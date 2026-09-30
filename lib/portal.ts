import { BOOKING, luxAvailable } from "./booking-config";
import { Booking, bonusNightEligible, computeTotals, getBooking, getPayments, insertPayment, isRangeAvailable, Payment } from "./bookings";
import { accountLink } from "./customer-auth";
import { query, sql } from "./db";
import { formatDate, hoursUntilRentalStart, pickupDate, todayIso } from "./dates";
import { sendBookingChangedEmails, sendCancellationEmails } from "./emails";
import { bonusNightQualifies, dollars, packageCents, packageLabel } from "./pricing";
import { getStripe, isStripeConfigured } from "./stripe";
import { revokeCreditsFrom } from "./referrals";

// What renters can do themselves from their account page.

export type PortalResult = { ok: true; message: string } | { ok: false; message: string };

export function canManage(b: Booking): boolean {
  return b.status === "confirmed" && todayIso() < b.endDate;
}

export function canChangePackage(b: Booking): boolean {
  return canManage(b) && luxAvailable() && hoursUntilRentalStart(b.startDate) >= BOOKING.account.packageChangeCutoffHours;
}

export function maxExtraNights(b: Booking): number {
  return Math.max(0, BOOKING.maxNights - b.nights);
}

export function cancellationTerms(b: Booking): { refundDeposit: boolean; hours: number } {
  const hours = hoursUntilRentalStart(b.startDate);
  return { refundDeposit: hours >= BOOKING.cancellationNoticeHours, hours };
}

async function afterChange(bookingId: string, summary: string): Promise<void> {
  const fresh = await getBooking(bookingId);
  if (!fresh) return;
  const totals = computeTotals(fresh, await getPayments(bookingId));
  await sendBookingChangedEmails(fresh, totals, summary, accountLink(fresh.email));
}

export async function extendStay(b: Booking, extra: number): Promise<PortalResult> {
  if (!canManage(b)) return { ok: false, message: "This booking can't be changed online anymore. Call or text us." };
  if (!Number.isInteger(extra) || extra < 1 || extra > maxExtraNights(b)) {
    return { ok: false, message: `You can extend up to ${BOOKING.maxNights} nights in total.` };
  }
  const nights = b.nights + extra;
  const free = await isRangeAvailable(b.startDate, nights, { excludeBookingId: b.id });
  if (!free) return { ok: false, message: "Sorry, the tub is booked right after your stay, so we can't add those nights." };

  let bonus = b.bonusNight;
  if (!bonus && bonusNightQualifies(nights, b.promoCode) && (await bonusNightEligible(b.email, b.id))) bonus = true;
  const before = computeTotals(b, []).price.totalCents;
  const end = pickupDate(b.startDate, nights);
  await sql`UPDATE bookings SET nights = ${nights}, end_date = ${end}, bonus_night = ${bonus}, updated_at = now() WHERE id = ${b.id}`;
  const after = computeTotals({ ...b, nights, endDate: end, bonusNight: bonus }, []).price.totalCents;
  const added = after - before;
  const summary = `Extended to ${nights} nights. New pickup: ${formatDate(end)}. ${
    added > 0 ? `Added to your balance: ${dollars(added)}.` : `The extra night is free with ${b.promoCode}.`
  }`;
  await afterChange(b.id, summary);
  return { ok: true, message: summary };
}

export async function changePackage(b: Booking, pkg: string): Promise<PortalResult> {
  if (!canChangePackage(b)) {
    return { ok: false, message: `Packages can be changed up to ${BOOKING.account.packageChangeCutoffHours} hours before delivery. Call or text us.` };
  }
  if (pkg !== "escape" && pkg !== "lux") return { ok: false, message: "Choose a package." };
  if (pkg === b.package) return { ok: true, message: `You already have ${packageLabel(pkg)}.` };
  const cents = packageCents(pkg);
  await sql`UPDATE bookings SET package = ${pkg}, package_cents = ${cents}, updated_at = now() WHERE id = ${b.id}`;
  const diff = cents - b.packageCents;
  const summary = `Package changed to ${packageLabel(pkg)} (${diff >= 0 ? "+" : "−"}${dollars(Math.abs(diff))} on your balance).`;
  await afterChange(b.id, summary);
  return { ok: true, message: summary };
}

/** Stripe payments on the booking that still have money left to refund. */
function refundable(payments: Payment[]): { payment: Payment; remaining: number }[] {
  return payments
    .filter((p) => p.status === "paid" && p.kind !== "refund" && p.amountCents > 0)
    .map((p) => {
      const refunded = payments.filter((r) => r.refundOf === p.id && r.status === "paid").reduce((sum, r) => sum - r.amountCents, 0);
      return { payment: p, remaining: p.amountCents - refunded };
    })
    .filter((x) => x.remaining > 0);
}

export async function cancelByCustomer(b: Booking): Promise<PortalResult> {
  if (b.status !== "confirmed" || todayIso() >= b.startDate) {
    return { ok: false, message: "This booking can't be cancelled online. Call or text us." };
  }
  const { refundDeposit } = cancellationTerms(b);
  const payments = await getPayments(b.id);
  const open = refundable(payments);
  const refunded: string[] = [];
  const ownerTodo: string[] = [];

  for (const { payment, remaining } of open) {
    const isDeposit = payment.kind === "deposit";
    const shouldRefund = refundDeposit; // on time: everything back; late: deposit kept, rest reviewed by owner
    if (!shouldRefund) {
      if (!isDeposit) ownerTodo.push(`${dollars(remaining)} ${payment.kind} payment (${payment.method}) — decide whether to refund`);
      continue;
    }
    if (payment.method === "stripe" && payment.stripePaymentIntent && isStripeConfigured()) {
      try {
        const refund = await getStripe().refunds.create({
          payment_intent: payment.stripePaymentIntent,
          amount: remaining,
          metadata: { booking_id: b.id, payment_id: payment.id, reason: "customer_cancelled" },
        });
        await insertPayment({
          bookingId: b.id,
          kind: "refund",
          method: "stripe",
          amountCents: -remaining,
          status: "paid",
          refundOf: payment.id,
          note: `Customer cancelled · Stripe refund ${refund.id}`,
        });
        refunded.push(`the ${dollars(remaining)} ${isDeposit ? "deposit" : "payment"}`);
      } catch (err) {
        console.error("customer cancel refund failed", err);
        ownerTodo.push(`Refund ${dollars(remaining)} (${payment.kind}) — the automatic Stripe refund failed`);
      }
    } else {
      ownerTodo.push(`Refund ${dollars(remaining)} ${payment.kind} paid by ${payment.method}`);
    }
  }

  // Close any unpaid payment links.
  await query(`UPDATE payments SET status = 'expired' WHERE booking_id = $1 AND status = 'pending'`, [b.id]);
  const depositStatus = refundDeposit ? (ownerTodo.some((t) => t.includes("deposit")) ? b.depositStatus : "refunded") : "retained";
  await sql`
    UPDATE bookings SET status = 'cancelled', cancelled_at = now(), deposit_status = ${b.depositStatus === "unpaid" ? "unpaid" : depositStatus}::text,
      admin_notes = concat_ws(E'\n', admin_notes, ${`[Cancelled by customer online${refundDeposit ? "" : " — under " + BOOKING.cancellationNoticeHours + "h notice, deposit kept"}]`}::text),
      updated_at = now()
    WHERE id = ${b.id}`;

  const summary = refundDeposit
    ? refunded.length
      ? `We've refunded ${refunded.join(" and ")} to your card. It usually shows up in 5–10 business days.`
      : "Nothing was charged that needs refunding."
    : `Because this was less than ${BOOKING.cancellationNoticeHours} hours before delivery, the deposit is kept as described in the rental agreement.`;
  await revokeCreditsFrom(b.id).catch((err) => console.error("revoke referral credit failed", err));
  await sendCancellationEmails(b, summary, ownerTodo.length ? ownerTodo.join("; ") : null);
  return { ok: true, message: `Your booking is cancelled. ${summary}` };
}
