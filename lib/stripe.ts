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
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: booking.email,
    client_reference_id: booking.ref,
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
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  await sql`UPDATE payments SET stripe_session_id = ${session.id}, checkout_url = ${session.url} WHERE id = ${payment.id}`;
  return { url: session.url, payment: { ...payment, stripeSessionId: session.id, checkoutUrl: session.url } };
}
