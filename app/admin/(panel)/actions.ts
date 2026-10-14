"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { BOOKING } from "@/lib/booking-config";
import {
  createBooking,
  DatesUnavailableError,
  getBooking,
  getPayments,
  insertPayment,
  isRangeAvailable,
  mapPayment,
  Payment,
} from "@/lib/bookings";
import { query, sql } from "@/lib/db";
import { isIsoDate, pickupDate } from "@/lib/dates";
import { sendPaymentLinkEmail, sendWaiverLinkEmail } from "@/lib/emails";
import { dollars, packageCents, parseDollarsToCents } from "@/lib/pricing";
import { closeStripePayment, createCheckoutForBooking, createInvoiceForBooking, getStripe, isStripeConfigured, LinkKind, paymentIntentForInvoice, siteUrl } from "@/lib/stripe";

const back = (id: string, msg: string, anchor = ""): never =>
  redirect(`/admin/bookings/${id}?msg=${encodeURIComponent(msg)}${anchor ? `#${anchor}` : ""}`);
const backErr = (id: string, msg: string, anchor = ""): never =>
  redirect(`/admin/bookings/${id}?err=${encodeURIComponent(msg)}${anchor ? `#${anchor}` : ""}`);

const s = (fd: FormData, key: string, max = 300) => String(fd.get(key) ?? "").trim().slice(0, max);
const n = (fd: FormData, key: string): number | null => {
  const v = s(fd, key);
  if (v === "") return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
};
const isErrorRedirect = (err: unknown) =>
  typeof err === "object" && err !== null && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");

// ---------------------------------------------------------------------------
// Booking create / edit
// ---------------------------------------------------------------------------

function readBookingForm(fd: FormData) {
  const nights = Math.round(n(fd, "nights") ?? BOOKING.minNights);
  const pkg = s(fd, "package") === "lux" ? "lux" : "escape";
  const pkgOverride = parseDollarsToCents(fd.get("packagePrice"));
  return {
    startDate: s(fd, "startDate", 10),
    nights,
    firstName: s(fd, "firstName", 60),
    lastName: s(fd, "lastName", 60),
    email: s(fd, "email", 120).toLowerCase(),
    phone: s(fd, "phone", 30),
    address: s(fd, "address", 160),
    city: s(fd, "city", 80),
    state: s(fd, "state", 20) || "OH",
    zip: s(fd, "zip", 10),
    occasion: s(fd, "occasion", 60) || null,
    heat: s(fd, "heat", 40) || null,
    package: pkg,
    guests: n(fd, "guests"),
    notes: s(fd, "notes", 2000) || null,
    adminNotes: s(fd, "adminNotes", 4000) || null,
    referral: s(fd, "referral", 60) || null,
    promoCode: s(fd, "promoCode", 24).toUpperCase() || null,
    nightlyRateCents: parseDollarsToCents(fd.get("nightlyRate")) ?? BOOKING.nightlyRateCents,
    bonusNight: fd.get("bonusNight") === "on",
    packageCents: pkgOverride ?? packageCents(pkg),
    deliveryMiles: n(fd, "deliveryMiles"),
    deliveryOverrideCents: parseDollarsToCents(fd.get("deliveryFee")),
    discountCents: parseDollarsToCents(fd.get("discount")) ?? 0,
    discountNote: s(fd, "discountNote", 200) || null,
    extrasCents: parseDollarsToCents(fd.get("extras")) ?? 0,
    extrasNote: s(fd, "extrasNote", 200) || null,
    force: fd.get("force") === "on",
  };
}

function validate(b: ReturnType<typeof readBookingForm>): string | null {
  if (!isIsoDate(b.startDate)) return "Enter a delivery date.";
  if (b.nights < 1 || b.nights > 30) return "Nights must be between 1 and 30.";
  if (!b.firstName || !b.lastName) return "Enter the client's first and last name.";
  if (!b.email.includes("@")) return "Enter the client's email.";
  return null;
}

export async function createManualBooking(fd: FormData): Promise<void> {
  await requireAdmin();
  const b = readBookingForm(fd);
  const problem = validate(b);
  if (problem) redirect(`/admin/bookings/new?err=${encodeURIComponent(problem)}`);
  let id = "";
  try {
    const booking = await createBooking({
      ...b,
      status: "confirmed",
      source: "admin",
      deliveryMilesEstimated: false,
      depositCents: BOOKING.depositCents,
      holdMinutes: null,
    });
    id = booking.id;
  } catch (err) {
    if (err instanceof DatesUnavailableError) {
      redirect(`/admin/bookings/new?err=${encodeURIComponent("Those dates overlap another booking or blocked dates. Check “Book anyway” to override.")}`);
    }
    throw err;
  }
  back(id, "Booking created. Next: send the deposit link and the waiver link to the client.");
}

export async function updateBooking(id: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const current = await getBooking(id);
  if (!current) redirect("/admin");
  const b = readBookingForm(fd);
  const problem = validate(b);
  if (problem) backErr(id, problem, "edit");

  const datesChanged = b.startDate !== current.startDate || b.nights !== current.nights;
  if (datesChanged && !b.force && ["confirmed", "pending"].includes(current.status)) {
    const ok = await isRangeAvailable(b.startDate, b.nights, { excludeBookingId: id, ignoreHoldsForEmail: "" });
    if (!ok) backErr(id, "The new dates overlap another booking or blocked dates. Check “Book anyway” to override.", "edit");
  }

  await query(
    `UPDATE bookings SET
      start_date = $2, end_date = $3, nights = $4, first_name = $5, last_name = $6, email = $7, phone = $8,
      address = $9, city = $10, state = $11, zip = $12, occasion = $13, heat = $14, package = $15, guests = $16,
      notes = $17, admin_notes = $18, nightly_rate_cents = $19, bonus_night = $20, package_cents = $21,
      delivery_miles = $22, delivery_miles_estimated = CASE WHEN delivery_miles IS DISTINCT FROM $22::numeric THEN false ELSE delivery_miles_estimated END,
      delivery_override_cents = $23, discount_cents = $24, discount_note = $25, extras_cents = $26, extras_note = $27,
      referral = $28, promo_code = $29, updated_at = now()
     WHERE id = $1`,
    [
      id,
      b.startDate,
      pickupDate(b.startDate, b.nights),
      b.nights,
      b.firstName,
      b.lastName,
      b.email,
      b.phone,
      b.address,
      b.city,
      b.state,
      b.zip,
      b.occasion,
      b.heat,
      b.package,
      b.guests === null ? null : Math.round(b.guests),
      b.notes,
      b.adminNotes,
      b.nightlyRateCents,
      b.bonusNight,
      b.packageCents,
      b.deliveryMiles,
      b.deliveryOverrideCents,
      b.discountCents,
      b.discountNote,
      b.extrasCents,
      b.extrasNote,
      b.referral,
      b.promoCode,
    ]
  );
  back(id, "Booking saved.");
}

export async function setBookingStatus(id: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const status = s(fd, "status");
  if (!["confirmed", "completed", "cancelled", "pending"].includes(status)) backErr(id, "Unknown status.");
  const current = await getBooking(id);
  if (!current) redirect("/admin");
  if (status === "confirmed" && (current.status === "cancelled" || current.status === "expired")) {
    const ok = await isRangeAvailable(current.startDate, current.nights, { excludeBookingId: id });
    if (!ok && fd.get("force") !== "on") backErr(id, "Can't reopen — those dates are now taken by another booking.");
  }
  await sql`
    UPDATE bookings SET status = ${status},
      confirmed_at = CASE WHEN ${status} = 'confirmed' THEN COALESCE(confirmed_at, now()) ELSE confirmed_at END,
      cancelled_at = CASE WHEN ${status} = 'cancelled' THEN now() ELSE NULL END,
      hold_expires_at = NULL, updated_at = now()
    WHERE id = ${id}`;
  if (status === "cancelled") {
    const { revokeCreditsFrom } = await import("@/lib/referrals");
    await revokeCreditsFrom(id).catch((err) => console.error("revoke referral credit failed", err));
  }
  const label = { confirmed: "confirmed", completed: "marked completed", cancelled: "cancelled", pending: "set to pending" }[status];
  back(id, `Booking ${label}.${status === "cancelled" ? " If the deposit should go back, use Refund in Payments." : ""}`);
}

export async function deleteBooking(id: string, fd: FormData): Promise<void> {
  await requireAdmin();
  if (s(fd, "confirm").toUpperCase() !== "DELETE") backErr(id, "Type DELETE to confirm.", "danger");
  const payments = await getPayments(id);
  if (payments.some((p) => p.status === "paid")) {
    backErr(id, "This booking has payments recorded, so it can't be deleted. Cancel it instead (keeps your records).", "danger");
  }
  await sql`DELETE FROM bookings WHERE id = ${id}`;
  redirect(`/admin?msg=${encodeURIComponent("Booking deleted.")}`);
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function recordManualPayment(id: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const booking = await getBooking(id);
  if (!booking) redirect("/admin");
  const amount = parseDollarsToCents(fd.get("amount"));
  if (!amount || amount <= 0) backErr(id, "Enter the amount received.", "payments");
  const kind = s(fd, "kind") as Payment["kind"];
  if (!["deposit", "balance", "damage", "other"].includes(kind)) backErr(id, "Choose what the payment was for.", "payments");
  const method = s(fd, "method") || "cash";
  await insertPayment({ bookingId: id, kind, method, amountCents: amount!, status: "paid", note: s(fd, "note", 200) || null });
  if (kind === "deposit") {
    await sql`UPDATE bookings SET deposit_status = CASE WHEN deposit_status = 'unpaid' THEN 'held' ELSE deposit_status END,
      status = CASE WHEN status IN ('pending','expired') THEN 'confirmed' ELSE status END,
      confirmed_at = COALESCE(confirmed_at, now()), hold_expires_at = NULL, updated_at = now() WHERE id = ${id}`;
  } else {
    await sql`UPDATE bookings SET updated_at = now() WHERE id = ${id}`;
  }
  back(id, `Recorded ${dollars(amount)} (${method}).`, "payments");
}

export async function sendPaymentLink(id: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const booking = await getBooking(id);
  if (!booking) redirect("/admin");
  if (!isStripeConfigured()) backErr(id, "Stripe isn't set up yet (STRIPE_SECRET_KEY).", "payments");
  const kind = s(fd, "kind") as LinkKind;
  if (!["deposit", "balance", "damage", "other"].includes(kind)) backErr(id, "Choose what the link is for.", "payments");
  const amount = parseDollarsToCents(fd.get("amount"));
  if (!amount || amount < 50) backErr(id, "Enter an amount of at least $0.50.", "payments");
  const description = s(fd, "description", 200) || undefined;

  // Deposits use a Checkout page (it confirms the booking); everything else is a Stripe Invoice.
  const asInvoice = kind !== "deposit";
  let url = "";
  try {
    if (asInvoice) {
      const result = await createInvoiceForBooking({ booking: booking!, kind: kind as Exclude<LinkKind, "deposit">, amountCents: amount!, description });
      url = result.url;
    } else {
      const result = await createCheckoutForBooking({
        booking: booking!,
        kind,
        amountCents: amount!,
        expiresInMinutes: 23 * 60,
        successPath: "/book/confirmed",
        cancelPath: "/",
        description,
      });
      url = result.url;
    }
  } catch (err) {
    if (isErrorRedirect(err)) throw err;
    console.error("payment link error", err);
    backErr(id, `Stripe error: ${err instanceof Error ? err.message : "could not create link"}`, "payments");
  }
  const what = { deposit: "Reservation deposit", balance: "Rental balance", damage: "Damage charge", other: "Payment" }[kind];
  let emailed = false;
  if (fd.get("email") === "on") emailed = await sendPaymentLinkEmail(booking!, url, amount!, what, asInvoice ? BOOKING.invoiceDaysUntilDue : null);
  back(
    id,
    `${what} ${asInvoice ? "invoice" : "link"} for ${dollars(amount)} created${emailed ? ` and emailed to ${booking!.email}` : fd.get("email") === "on" ? " (email could not be sent — copy the link below)" : ""}. ${asInvoice ? `It's due in ${BOOKING.invoiceDaysUntilDue} days; Stripe sends reminders.` : "It's valid for 23 hours."}`,
    "payments"
  );
}

export async function cancelPaymentLink(bookingId: string, paymentId: string): Promise<void> {
  await requireAdmin();
  const rows = await sql`SELECT * FROM payments WHERE id = ${paymentId} AND booking_id = ${bookingId}`;
  const p = rows[0] ? mapPayment(rows[0]) : null;
  if (!p || p.status !== "pending") back(bookingId, "Link already closed.", "payments");
  await closeStripePayment(p!);
  await sql`UPDATE payments SET status = 'expired' WHERE id = ${paymentId} AND status = 'pending'`;
  back(bookingId, "Payment link cancelled.", "payments");
}

export async function refundPayment(bookingId: string, paymentId: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const rows = await sql`SELECT * FROM payments WHERE id = ${paymentId} AND booking_id = ${bookingId}`;
  const original = rows[0] ? mapPayment(rows[0]) : null;
  if (!original || original.status !== "paid" || original.kind === "refund") backErr(bookingId, "That payment can't be refunded.", "payments");
  const already = await sql`SELECT COALESCE(SUM(-amount_cents), 0)::int AS r FROM payments WHERE refund_of = ${paymentId} AND status = 'paid'`;
  const remaining = original!.amountCents - Number(already[0]?.r ?? 0);
  const amount = parseDollarsToCents(fd.get("amount")) ?? remaining;
  if (amount <= 0 || amount > remaining) backErr(bookingId, `Refund must be between $0.01 and ${dollars(remaining)}.`, "payments");

  let method = original!.method;
  let note = s(fd, "note", 200) || null;
  let intent = original!.stripePaymentIntent;
  if (!intent && original!.stripeInvoiceId && isStripeConfigured()) intent = await paymentIntentForInvoice(original!.stripeInvoiceId).catch(() => null);
  if (original!.method === "stripe" && intent) {
    try {
      const refund = await getStripe().refunds.create({
        payment_intent: intent,
        amount,
        metadata: { booking_id: bookingId, payment_id: paymentId },
      }, { idempotencyKey: `refund-${paymentId}-${amount}-${Number(already[0]?.r ?? 0)}` });
      note = [note, `Stripe refund ${refund.id}`].filter(Boolean).join(" · ");
    } catch (err) {
      console.error("stripe refund error", err);
      backErr(bookingId, `Stripe refund failed: ${err instanceof Error ? err.message : "unknown error"}`, "payments");
    }
  } else {
    method = s(fd, "method") || original!.method;
  }

  await insertPayment({ bookingId, kind: "refund", method, amountCents: -amount, status: "paid", refundOf: paymentId, note });
  if (original!.kind === "deposit" && amount === remaining) {
    await sql`UPDATE bookings SET deposit_status = 'refunded', updated_at = now() WHERE id = ${bookingId}`;
  } else {
    await sql`UPDATE bookings SET updated_at = now() WHERE id = ${bookingId}`;
  }
  back(
    bookingId,
    `Refunded ${dollars(amount)}${original!.method === "stripe" ? " to the client's card (arrives in 5–10 business days)" : ` (${method}) — recorded`}.`,
    "payments"
  );
}

export async function setDepositStatus(id: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const status = s(fd, "depositStatus");
  if (!["held", "retained", "applied", "unpaid", "refunded"].includes(status)) backErr(id, "Unknown deposit status.", "payments");
  const note = s(fd, "note", 300);
  await sql`
    UPDATE bookings SET deposit_status = ${status},
      admin_notes = CASE WHEN ${note}::text = '' THEN admin_notes ELSE concat_ws(E'\n', admin_notes, ${`[Deposit ${status}] ${note}`}::text) END,
      updated_at = now()
    WHERE id = ${id}`;
  const label: Record<string, string> = {
    held: "Deposit marked as held.",
    retained: "Deposit kept for damage.",
    applied: "Deposit applied toward the rental balance.",
    unpaid: "Deposit marked unpaid.",
    refunded: "Deposit marked refunded.",
  };
  back(id, label[status], "payments");
}

// ---------------------------------------------------------------------------
// Waivers & files
// ---------------------------------------------------------------------------

export async function sendWaiverLink(id: string): Promise<void> {
  await requireAdmin();
  const booking = await getBooking(id);
  if (!booking) redirect("/admin");
  let token = booking.waiverToken;
  if (!token) {
    const { generateToken } = await import("@/lib/bookings");
    token = generateToken();
    await sql`UPDATE bookings SET waiver_token = ${token} WHERE id = ${id}`;
  }
  const url = `${siteUrl()}/waiver/${token}`;
  const sent = await sendWaiverLinkEmail(booking, url);
  back(id, sent ? `Signing link emailed to ${booking.email}.` : "Couldn't send the email — copy the signing link below and text it to the client.", "files");
}

export async function deleteFile(bookingId: string, fileId: string, fd: FormData): Promise<void> {
  await requireAdmin();
  if (fd.get("confirm") !== "on") backErr(bookingId, "Tick the box to confirm deleting the file.", "files");
  await sql`DELETE FROM booking_files WHERE id = ${fileId} AND booking_id = ${bookingId}`;
  const left = await sql`SELECT count(*)::int AS n FROM booking_files WHERE booking_id = ${bookingId} AND kind = 'waiver'`;
  if (Number(left[0]?.n ?? 0) === 0) {
    await sql`UPDATE bookings SET waiver_signed_at = NULL, waiver_name = NULL WHERE id = ${bookingId}`;
  }
  back(bookingId, "File deleted.", "files");
}

// ---------------------------------------------------------------------------
// Blocked dates
// ---------------------------------------------------------------------------

export async function addBlockedDates(fd: FormData): Promise<void> {
  await requireAdmin();
  const start = s(fd, "startDate", 10);
  const end = s(fd, "endDate", 10) || start;
  if (!isIsoDate(start) || !isIsoDate(end) || end < start) {
    redirect(`/admin/availability?err=${encodeURIComponent("Pick a start date and an end date on or after it.")}`);
  }
  await sql`INSERT INTO blocked_dates (start_date, end_date, reason) VALUES (${start}, ${end}, ${s(fd, "reason", 200) || null})`;
  redirect(`/admin/availability?msg=${encodeURIComponent("Dates blocked — customers can't book them online.")}`);
}

export async function removeBlockedDates(blockId: string): Promise<void> {
  await requireAdmin();
  await sql`DELETE FROM blocked_dates WHERE id = ${blockId}`;
  redirect(`/admin/availability?msg=${encodeURIComponent("Dates reopened.")}`);
}
