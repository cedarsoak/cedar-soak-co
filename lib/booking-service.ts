import type Stripe from "stripe";
import { BOOKING, luxAvailable } from "./booking-config";
import { initialedSectionIds } from "./agreement";
import {
  addFile,
  Booking,
  bonusNightEligible,
  computeTotals,
  getBooking,
  getFiles,
  getFileWithData,
  getBookingByRef,
  getPayments,
  mapBooking,
  normalizeRef,
  mapPayment,
} from "./bookings";
import { query, sql } from "./db";
import { earliestBookableDate, isIsoDate, latestBookableDate, pickupDate } from "./dates";
import { sendBookingConfirmedEmails, sendPaymentReceivedOwnerEmail, sendWaiverSignedCustomerEmail, sendWaiverSignedOwnerEmail } from "./emails";
import { accountLink } from "./customer-auth";
import { applyAvailableCredits, availableCreditCents as creditFor, grantReferralCredit } from "./referrals";
import { paymentIntentForInvoice, siteUrl } from "./stripe";
import { estimateDeliveryMiles } from "./geocode";
import { bonusNightQualifies, computePrice, dollars, packageCents, packageLabel, PriceBreakdown } from "./pricing";
import { buildWaiverPdf } from "./waiver-pdf";

// ---------------------------------------------------------------------------
// Validate what the booking page sends
// ---------------------------------------------------------------------------

export interface BookingRequest {
  startDate: string;
  nights: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  occasion: string | null;
  heat: string | null;
  package: string;
  guests: number | null;
  notes: string | null;
  referral: string | null;
  promoCode: string | null;
  /** Referral code from a past customer's share link (?ref=CS-XXXXX). */
  refCode: string | null;
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseBookingRequest(body: Record<string, unknown>, opts: { requireContact: boolean }): { ok: true; data: BookingRequest } | { ok: false; error: string } {
  const startDate = str(body.startDate, 10);
  const nights = Number(body.nights);
  if (!isIsoDate(startDate)) return { ok: false, error: "Pick a delivery date." };
  if (!Number.isInteger(nights) || nights < BOOKING.minNights || nights > BOOKING.maxNights) {
    return { ok: false, error: `Stays are ${BOOKING.minNights}–${BOOKING.maxNights} nights.` };
  }
  if (startDate < earliestBookableDate()) return { ok: false, error: "That date is too soon to book online — call or text us." };
  if (startDate > latestBookableDate()) return { ok: false, error: "That date is too far out to book online yet." };

  const pkg = str(body.package, 20) === "lux" && luxAvailable() ? "lux" : "escape";
  const guestsNum = Number(body.guests);
  const data: BookingRequest = {
    startDate,
    nights,
    firstName: str(body.firstName, 60),
    lastName: str(body.lastName, 60),
    email: str(body.email, 120).toLowerCase(),
    phone: str(body.phone, 30),
    address: str(body.address, 160),
    city: str(body.city, 80),
    state: str(body.state, 20) || "OH",
    zip: str(body.zip, 10),
    occasion: str(body.occasion, 60) || null,
    heat: (BOOKING.heatOptions as readonly string[]).includes(str(body.heat, 40)) ? str(body.heat, 40) : null,
    package: pkg,
    guests: Number.isInteger(guestsNum) && guestsNum > 0 && guestsNum < 100 ? guestsNum : null,
    notes: str(body.notes, 2000) || null,
    referral: str(body.referral, 60) || null,
    promoCode: str(body.promoCode, 24).toUpperCase().replace(/[^A-Z0-9-]/g, "") || null,
    refCode: normalizeRef(str(body.refCode, 16)),
  };

  if (opts.requireContact) {
    if (!data.firstName || !data.lastName) return { ok: false, error: "Enter your first and last name." };
    if (!EMAIL.test(data.email)) return { ok: false, error: "Enter a valid email address." };
    if (data.phone.replace(/\D/g, "").length < 10) return { ok: false, error: "Enter a valid phone number." };
    if (!data.address || !data.city) return { ok: false, error: "Enter the street address and city where the tub will go." };
    if (!/^\d{5}(-\d{4})?$/.test(data.zip)) return { ok: false, error: "Enter a 5-digit ZIP code." };
  }
  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export interface Quote {
  price: PriceBreakdown;
  bonusNight: boolean;
  bonusNightBlockedByPriorUse: boolean;
  deliveryMiles: number | null;
  endDate: string;
  packageLabel: string;
  /** Referral discount for booking with a friend's share link. */
  friendDiscountCents: number;
  referredBy: string | null;
  /** Referral credit this customer earned earlier (applied once their deposit is paid). */
  availableCreditCents: number;
}

export async function buildQuote(data: BookingRequest): Promise<Quote> {
  const qualifies = bonusNightQualifies(data.nights, data.promoCode);
  const eligible = qualifies ? await bonusNightEligible(data.email) : false;
  const miles = await estimateDeliveryMiles(data.address, data.city, data.state, data.zip);
  const referredBy = data.email ? await resolveReferral(data) : data.refCode ? (await getBookingByRef(data.refCode))?.ref ?? null : null;
  const friendDiscountCents = referredBy ? BOOKING.referral.friendDiscountCents : 0;
  const availableCreditCents = data.email ? await creditFor(data.email) : 0;
  const price = computePrice({
    nights: data.nights,
    bonusNight: qualifies && eligible,
    packageKey: data.package,
    deliveryMiles: miles,
    creditCents: friendDiscountCents + availableCreditCents,
  });
  return {
    friendDiscountCents,
    referredBy,
    availableCreditCents,
    price,
    bonusNight: qualifies && eligible,
    bonusNightBlockedByPriorUse: qualifies && !eligible,
    deliveryMiles: miles,
    endDate: pickupDate(data.startDate, data.nights),
    packageLabel: packageLabel(data.package),
  };
}

/** Returns the referral code to store, if it belongs to a different customer. */
export async function resolveReferral(data: BookingRequest): Promise<string | null> {
  if (!data.refCode) return null;
  const referrer = await getBookingByRef(data.refCode);
  if (!referrer || referrer.email.toLowerCase() === data.email.toLowerCase()) return null;
  return referrer.ref;
}

export function bookingFieldsFromQuote(data: BookingRequest, quote: Quote) {
  return {
    referredBy: quote.referredBy,
    creditCents: quote.friendDiscountCents,
    creditNote: quote.friendDiscountCents ? `Referral discount ${dollars(quote.friendDiscountCents)} (friend of ${quote.referredBy})` : null,
    startDate: data.startDate,
    nights: data.nights,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    occasion: data.occasion,
    heat: data.heat,
    package: data.package,
    guests: data.guests,
    notes: data.notes,
    referral: data.referral,
    promoCode: data.promoCode,
    nightlyRateCents: BOOKING.nightlyRateCents,
    bonusNight: quote.bonusNight,
    packageCents: packageCents(data.package),
    deliveryMiles: quote.deliveryMiles,
    deliveryMilesEstimated: quote.deliveryMiles !== null,
    depositCents: BOOKING.depositCents,
  };
}

// ---------------------------------------------------------------------------
// Waiver signing
// ---------------------------------------------------------------------------

export interface WaiverSubmission {
  initials: Record<string, string>;
  printedName: string;
  signatureDataUrl: string;
  agreed: boolean;
  adult: boolean;
}

export function parseWaiver(body: Record<string, unknown>): { ok: true; data: WaiverSubmission } | { ok: false; error: string } {
  const w = (body.waiver ?? {}) as Record<string, unknown>;
  const rawInitials = (w.initials ?? {}) as Record<string, unknown>;
  const initials: Record<string, string> = {};
  for (const id of initialedSectionIds()) {
    const v = typeof rawInitials[id] === "string" ? (rawInitials[id] as string).trim().slice(0, 5) : "";
    if (v.replace(/[^A-Za-z]/g, "").length < 2) return { ok: false, error: "Add your initials to every section marked “Initials”." };
    initials[id] = v.toUpperCase();
  }
  const printedName = typeof w.printedName === "string" ? w.printedName.trim().slice(0, 100) : "";
  if (printedName.length < 3) return { ok: false, error: "Type your full name under the signature." };
  const sig = typeof w.signatureDataUrl === "string" ? w.signatureDataUrl : "";
  if (!sig.startsWith("data:image/png;base64,") || sig.length < 1500 || sig.length > 800_000) {
    return { ok: false, error: "Please draw your signature in the box." };
  }
  if (w.adult !== true) return { ok: false, error: "Confirm you are at least 18 years old." };
  if (w.agreed !== true) return { ok: false, error: "Check the box to agree to the Rental Agreement." };
  return { ok: true, data: { initials, printedName, signatureDataUrl: sig, agreed: true, adult: true } };
}

export async function signWaiver(
  booking: Booking,
  waiver: WaiverSubmission,
  meta: { ip: string; userAgent: string }
): Promise<Buffer> {
  const signedAt = new Date();
  const pdf = await buildWaiverPdf({
    ref: booking.ref,
    renterName: `${booking.firstName} ${booking.lastName}`,
    phone: booking.phone,
    email: booking.email,
    rentalAddress: [booking.address, booking.city, booking.state, booking.zip].filter(Boolean).join(", "),
    startDate: booking.startDate,
    endDate: booking.endDate,
    packageLabel: packageLabel(booking.package),
    initials: waiver.initials,
    printedName: waiver.printedName,
    signaturePng: Buffer.from(waiver.signatureDataUrl.split(",")[1], "base64"),
    signedAt,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  const buf = Buffer.from(pdf);
  await addFile(booking.id, {
    kind: "waiver",
    filename: `Rental-Agreement-${booking.ref}-${booking.lastName.replace(/[^A-Za-z0-9]/g, "") || "renter"}.pdf`,
    contentType: "application/pdf",
    data: buf,
    note: `Signed online by ${waiver.printedName}`,
  });
  await sql`UPDATE bookings SET waiver_signed_at = ${signedAt}, waiver_name = ${waiver.printedName}, updated_at = now() WHERE id = ${booking.id}`;
  return buf;
}

export function requestMeta(request: Request): { ip: string; userAgent: string } {
  const fwd = request.headers.get("x-forwarded-for") || "";
  return {
    ip: fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "",
    userAgent: request.headers.get("user-agent") || "",
  };
}

export function waiverLink(b: Booking): string | null {
  return b.waiverToken ? `${siteUrl()}/waiver/${b.waiverToken}` : null;
}

export async function notifyWaiverSigned(b: Booking, pdf: Buffer): Promise<void> {
  await sendWaiverSignedOwnerEmail(b);
  await sendWaiverSignedCustomerEmail(b, pdf, accountLink(b.email));
}

// ---------------------------------------------------------------------------
// Stripe → mark paid (idempotent; safe to call from webhook and success page)
// ---------------------------------------------------------------------------

export async function finalizeCheckoutSession(session: Stripe.Checkout.Session): Promise<Booking | null> {
  const paymentId = session.metadata?.payment_id;
  const bookingId = session.metadata?.booking_id;
  if (!paymentId || !bookingId) return null;
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return getBooking(bookingId);
  }

  const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const amount = session.amount_total ?? null;

  // Only the first caller flips pending → paid, so emails go out once.
  const updated = await query(
    `UPDATE payments SET status = 'paid', paid_at = now(), stripe_payment_intent = $2,
            amount_cents = COALESCE($3::int, amount_cents)
     WHERE id = $1 AND status <> 'paid' RETURNING *`,
    [paymentId, intent, amount]
  );
  if (updated.length === 0) return getBooking(bookingId);
  const payment = mapPayment(updated[0]);

  if (payment.kind === "deposit") {
    const rows = await sql`
      UPDATE bookings SET
        deposit_status = CASE WHEN deposit_status = 'unpaid' THEN 'held' ELSE deposit_status END,
        status = CASE WHEN status IN ('pending', 'expired') THEN 'confirmed' ELSE status END,
        confirmed_at = COALESCE(confirmed_at, now()),
        hold_expires_at = NULL,
        updated_at = now()
      WHERE id = ${bookingId} RETURNING *`;
    const booking = mapBooking(rows[0]);
    const payments = await getPayments(booking.id);
    const waiverFile = (await getFiles(booking.id)).find((f) => f.kind === "waiver");
    const waiver = waiverFile ? await getFileWithData(waiverFile.id) : null;
    // Referral rewards: credit the person who shared the link, and use any credit this customer earned.
    try {
      await grantReferralCredit(booking);
      await applyAvailableCredits(booking.email);
    } catch (err) {
      console.error("referral credit error", err);
    }
    const refreshed = (await getBooking(booking.id)) ?? booking;
    const freshTotals = computeTotals(refreshed, payments);
    await sendBookingConfirmedEmails(refreshed, freshTotals, waiver?.data ?? null, { waiverUrl: waiverLink(refreshed), accountUrl: accountLink(refreshed.email) });
    return booking;
  }

  const booking = await getBooking(bookingId);
  if (booking) {
    await sql`UPDATE bookings SET updated_at = now() WHERE id = ${bookingId}`;
    await sendPaymentReceivedOwnerEmail(booking, payment.amountCents, payment.kind === "damage" ? "Damage charge" : payment.kind === "balance" ? "Rental balance" : "Payment");
  }
  return booking;
}

export async function expireCheckoutSession(
  session: Stripe.Checkout.Session,
  outcome: "expired" | "failed" = "expired"
): Promise<void> {
  const paymentId = session.metadata?.payment_id;
  const bookingId = session.metadata?.booking_id;
  if (!paymentId) return;
  // A delayed payment (e.g. bank debit) that later fails arrives as async_payment_failed.
  const rows = await sql`UPDATE payments SET status = ${outcome} WHERE id = ${paymentId} AND status = 'pending' RETURNING kind`;
  if (rows[0]?.kind === "deposit" && bookingId) {
    await sql`UPDATE bookings SET status = 'expired', hold_expires_at = NULL, updated_at = now() WHERE id = ${bookingId} AND status = 'pending'`;
  }
}

// ---------------------------------------------------------------------------
// Stripe Invoicing (balance, damage and other charges)
// ---------------------------------------------------------------------------

/** invoice.paid → mark the payment paid (idempotent) and tell the owner. */
export async function finalizeInvoicePaid(invoice: Stripe.Invoice): Promise<Booking | null> {
  const paymentId = invoice.metadata?.payment_id;
  const bookingId = invoice.metadata?.booking_id;
  if (!paymentId || !bookingId || !invoice.id) return null;

  let intent: string | null = null;
  try {
    intent = await paymentIntentForInvoice(invoice.id);
  } catch (err) {
    console.error("could not look up invoice payment", err);
  }
  const updated = await query(
    `UPDATE payments SET status = 'paid', paid_at = now(), stripe_payment_intent = COALESCE($2, stripe_payment_intent),
            amount_cents = COALESCE($3::int, amount_cents)
     WHERE id = $1 AND status <> 'paid' RETURNING *`,
    [paymentId, intent, invoice.amount_paid ?? null]
  );
  const booking = await getBooking(bookingId);
  if (updated.length === 0 || !booking) return booking;
  const payment = mapPayment(updated[0]);
  await sql`UPDATE bookings SET updated_at = now() WHERE id = ${bookingId}`;
  const what = payment.kind === "damage" ? "Damage charge" : payment.kind === "balance" ? "Rental balance" : "Payment";
  await sendPaymentReceivedOwnerEmail(booking, payment.amountCents, `${what} (invoice ${invoice.number ?? invoice.id})`);
  return booking;
}

/** invoice.voided / invoice.marked_uncollectible → close the pending payment. */
export async function closeInvoice(invoice: Stripe.Invoice): Promise<void> {
  const paymentId = invoice.metadata?.payment_id;
  if (!paymentId) return;
  await sql`UPDATE payments SET status = 'expired' WHERE id = ${paymentId} AND status = 'pending'`;
}
