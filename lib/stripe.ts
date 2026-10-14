import Stripe from "stripe";
import { BOOKING } from "./booking-config";
import { Booking, insertPayment, Payment } from "./bookings";
import { sql } from "./db";
import { formatRange } from "./dates";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set (see BOOKING-SETUP.md).");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function siteUrl(fallbackOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "https://www.cedarsoak.co";
}

export type LinkKind = "deposit" | "balance" | "damage" | "other";

const KIND_LABEL: Record<LinkKind, string> = {
  deposit: "Reservation deposit (refundable damage deposit)",
  balance: "Rental balance",
  damage: "Damage charge",
  other: "Payment",
};

/**
 * Creates a Stripe Checkout page for a booking and records a pending payment.
 * The payment is marked paid by the webhook (or the confirmation page) once
 * Stripe reports it's complete.
 */
export async function createCheckoutForBooking(opts: {
  booking: Booking;
  kind: LinkKind;
  amountCents: number;
  origin?: string;
  /** Minutes until the link expires (Stripe allows 30 min – 24 h). */
  expiresInMinutes: number;
  successPath?: string;
  cancelPath?: string;
  description?: string;
}): Promise<{ url: string; payment: Payment }> {
  const { booking, kind, amountCents } = opts;
  if (amountCents < 50) throw new Error("Amount must be at least $0.50.");
  const base = siteUrl(opts.origin);
  const minutes = Math.min(Math.max(opts.expiresInMinutes, 31), 23 * 60);
  const dates = formatRange(booking.startDate, booking.endDate);

  const payment = await insertPayment({
    bookingId: booking.id,
    kind,
    method: "stripe",
    amountCents,
    status: "pending",
    note: opts.description ?? null,
  });

  const metadata = { booking_id: booking.id, booking_ref: booking.ref, payment_id: payment.id, kind };
  const customer = await ensureStripeCustomer(booking);
  // `integration_identifier` tags these sessions in the Stripe Dashboard (API 2026-03-25.dahlia+).
  const params: Stripe.Checkout.SessionCreateParams & { integration_identifier?: string } = {
    mode: "payment",
    customer,
    client_reference_id: booking.ref,
    integration_identifier: INTEGRATION_ID,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `${BOOKING.businessName} — ${KIND_LABEL[kind]}`,
            description: opts.description || `Booking ${booking.ref} · ${dates}`,
          },
        },
      },
    ],
    metadata,
    payment_intent_data: {
      metadata,
      description: `${booking.ref} ${KIND_LABEL[kind]} (${dates})`,
    },
    expires_at: Math.floor(Date.now() / 1000) + minutes * 60,
    success_url: `${base}${opts.successPath ?? "/book/confirmed"}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}${opts.cancelPath ?? "/book"}`,
  };
  const session = await getStripe().checkout.sessions.create(params, { idempotencyKey: `checkout-${payment.id}` });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  await sql`UPDATE payments SET stripe_session_id = ${session.id}, checkout_url = ${session.url} WHERE id = ${payment.id}`;
  return { url: session.url, payment: { ...payment, stripeSessionId: session.id, checkoutUrl: session.url } };
}

const INTEGRATION_ID = "cedarsoak_booking_rkvtwqmz";

/**
 * One Stripe Customer per email address, so every deposit, invoice and refund
 * for a client sits together in the Stripe Dashboard. Stored on the booking.
 */
export async function ensureStripeCustomer(booking: Booking): Promise<string> {
  const stripe = getStripe();
  const email = booking.email.trim().toLowerCase();

  // Reuse an ID saved on this or another booking with this email — but only if it exists
  // in the Stripe account the site is using now (IDs saved in test mode don't exist in live mode).
  const saved = booking.stripeCustomerId
    ? [{ stripe_customer_id: booking.stripeCustomerId }]
    : await sql`SELECT stripe_customer_id FROM bookings
        WHERE lower(email) = ${email} AND stripe_customer_id IS NOT NULL LIMIT 1`;
  let id: string | null = saved[0]?.stripe_customer_id ?? null;
  if (id && !(await customerExists(id))) {
    await sql`UPDATE bookings SET stripe_customer_id = NULL WHERE stripe_customer_id = ${id}`;
    booking.stripeCustomerId = null;
    id = null;
  }
  if (id && booking.stripeCustomerId === id) return id;
  if (!id) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    id = existing.data[0]?.id ?? null;
  }
  if (!id) {
    const created = await stripe.customers.create(
      {
        email,
        name: `${booking.firstName} ${booking.lastName}`.trim(),
        phone: booking.phone || undefined,
        address: { line1: booking.address, city: booking.city, state: booking.state, postal_code: booking.zip, country: "US" },
        metadata: { first_booking_ref: booking.ref },
      },
      { idempotencyKey: `customer-${email}` }
    );
    id = created.id;
  }
  await sql`UPDATE bookings SET stripe_customer_id = ${id} WHERE lower(email) = ${email} AND stripe_customer_id IS NULL`;
  booking.stripeCustomerId = id;
  return id;
}

async function customerExists(id: string): Promise<boolean> {
  try {
    const c = await getStripe().customers.retrieve(id);
    return !("deleted" in c && c.deleted);
  } catch (err) {
    const e = err as { code?: string; statusCode?: number };
    if (e?.code === "resource_missing" || e?.statusCode === 404) return false;
    throw err;
  }
}

const INVOICE_KIND_LABEL: Record<Exclude<LinkKind, "deposit">, string> = {
  balance: "Rental balance",
  damage: "Damage charge",
  other: "Payment",
};

/**
 * Bills a balance, damage charge or other amount as a Stripe Invoice.
 * The customer pays on Stripe's hosted invoice page (cards, wallets, 3DS handled);
 * the `invoice.paid` webhook marks it paid here.
 */
export async function createInvoiceForBooking(opts: {
  booking: Booking;
  kind: Exclude<LinkKind, "deposit">;
  amountCents: number;
  description?: string;
  daysUntilDue?: number;
}): Promise<{ url: string; payment: Payment; invoiceId: string }> {
  const { booking, kind, amountCents } = opts;
  if (amountCents < 50) throw new Error("Amount must be at least $0.50.");
  const stripe = getStripe();
  const customer = await ensureStripeCustomer(booking);
  const dates = formatRange(booking.startDate, booking.endDate);
  const label = INVOICE_KIND_LABEL[kind];

  const payment = await insertPayment({
    bookingId: booking.id,
    kind,
    method: "stripe",
    amountCents,
    status: "pending",
    note: opts.description ?? null,
  });
  const metadata = { booking_id: booking.id, booking_ref: booking.ref, payment_id: payment.id, kind };

  const draft = await stripe.invoices.create(
    {
      customer,
      collection_method: "send_invoice",
      days_until_due: opts.daysUntilDue ?? BOOKING.invoiceDaysUntilDue,
      auto_advance: false,
      pending_invoice_items_behavior: "exclude",
      description: `${BOOKING.businessName} rental ${booking.ref} · ${dates}`,
      metadata,
    },
    { idempotencyKey: `invoice-${payment.id}` }
  );
  await stripe.invoiceItems.create(
    {
      customer,
      invoice: draft.id!,
      amount: amountCents,
      currency: "usd",
      description: opts.description ? `${label}: ${opts.description}` : `${label} · ${dates}`,
      metadata,
    },
    { idempotencyKey: `invoice-item-${payment.id}` }
  );
  // auto_advance after finalizing lets Stripe send reminders and mark it overdue.
  const invoice = await stripe.invoices.finalizeInvoice(draft.id!, { auto_advance: true }, { idempotencyKey: `invoice-finalize-${payment.id}` });
  const url = invoice.hosted_invoice_url;
  if (!url) throw new Error("Stripe did not return an invoice link.");

  await sql`UPDATE payments SET stripe_invoice_id = ${invoice.id!}, checkout_url = ${url} WHERE id = ${payment.id}`;
  return { url, invoiceId: invoice.id!, payment: { ...payment, stripeInvoiceId: invoice.id!, checkoutUrl: url } };
}

/** Finds the PaymentIntent behind a paid invoice (needed for refunds). */
export async function paymentIntentForInvoice(invoiceId: string): Promise<string | null> {
  const invoice = await getStripe().invoices.retrieve(invoiceId, { expand: ["payments"] });
  const paid = invoice.payments?.data?.find((p) => p.status === "paid") ?? invoice.payments?.data?.[0];
  const pi = paid?.payment?.payment_intent;
  return typeof pi === "string" ? pi : pi?.id ?? null;
}

/** Stops a pending Stripe payment from being paid: voids its invoice or expires its checkout page. */
export async function closeStripePayment(p: Pick<Payment, "stripeInvoiceId" | "stripeSessionId">): Promise<void> {
  if (!isStripeConfigured()) return;
  try {
    if (p.stripeInvoiceId) await getStripe().invoices.voidInvoice(p.stripeInvoiceId);
    else if (p.stripeSessionId) await getStripe().checkout.sessions.expire(p.stripeSessionId);
  } catch (err) {
    console.warn("could not close stripe payment", err);
  }
}
