import { BOOKING } from "./booking-config";
import { Booking, getBookingByRef } from "./bookings";
import { query, sql } from "./db";
import { todayIso } from "./dates";
import { sendReferralCreditEmails } from "./emails";
import { dollars } from "./pricing";

// $25 for each party: the friend's discount is set when they book (see booking-service);
// the person who shared the link gets a credit once the friend's deposit is paid.

/** Credit waiting to be used on this customer's next rental. */
export async function availableCreditCents(email: string): Promise<number> {
  if (!email) return 0;
  const rows = await sql`
    SELECT COALESCE(SUM(amount_cents), 0)::int AS total FROM referral_credits
    WHERE lower(email) = lower(${email}) AND status = 'available'`;
  return Number(rows[0]?.total ?? 0);
}

/** Moves any available credit onto the customer's next upcoming confirmed rental. Returns the booking it went to. */
export async function applyAvailableCredits(email: string): Promise<{ bookingRef: string; cents: number } | null> {
  const credits = await sql`
    SELECT id, amount_cents FROM referral_credits
    WHERE lower(email) = lower(${email}) AND status = 'available' ORDER BY created_at`;
  if (credits.length === 0) return null;
  const target = await sql`
    SELECT id, ref FROM bookings
    WHERE lower(email) = lower(${email}) AND status = 'confirmed' AND start_date > ${todayIso()}
    ORDER BY start_date LIMIT 1`;
  if (!target[0]) return null;
  let total = 0;
  for (const c of credits) {
    const claimed = await sql`
      UPDATE referral_credits SET status = 'applied', applied_booking_id = ${target[0].id}
      WHERE id = ${c.id} AND status = 'available' RETURNING amount_cents`;
    if (claimed[0]) total += Number(claimed[0].amount_cents);
  }
  if (total > 0) {
    await sql`
      UPDATE bookings SET credit_cents = credit_cents + ${total}::int,
        credit_note = concat_ws('; ', credit_note, ${`Referral credit ${dollars(total)}`}::text),
        updated_at = now()
      WHERE id = ${target[0].id}`;
  }
  return total > 0 ? { bookingRef: target[0].ref, cents: total } : null;
}

/** Called when a referred friend's deposit is paid: credits the person who shared the link. */
export async function grantReferralCredit(friend: Booking): Promise<void> {
  const amount = BOOKING.referral.referrerCreditCents;
  if (!friend.referredBy || amount <= 0) return;
  const referrer = await getBookingByRef(friend.referredBy);
  if (!referrer || referrer.email.toLowerCase() === friend.email.toLowerCase()) return;
  const inserted = await query(
    `INSERT INTO referral_credits (email, amount_cents, from_booking_id) VALUES ($1, $2, $3)
     ON CONFLICT (from_booking_id) DO NOTHING RETURNING id`,
    [referrer.email.toLowerCase(), amount, friend.id]
  );
  if (inserted.length === 0) return; // already credited
  const applied = await applyAvailableCredits(referrer.email);
  await sendReferralCreditEmails(referrer, friend, amount, applied?.bookingRef ?? null);
}

/** Called when a booking is cancelled: takes back credit it earned for someone else, if not used yet. */
export async function revokeCreditsFrom(bookingId: string): Promise<void> {
  const credits = await sql`SELECT * FROM referral_credits WHERE from_booking_id = ${bookingId} AND status <> 'revoked'`;
  for (const c of credits) {
    if (c.status === "applied" && c.applied_booking_id) {
      const target = await sql`SELECT start_date, status FROM bookings WHERE id = ${c.applied_booking_id}`;
      const notStarted = target[0] && target[0].status === "confirmed" && target[0].start_date > todayIso();
      if (!notStarted) continue; // already used on a rental that happened — leave it
      await sql`
        UPDATE bookings SET credit_cents = GREATEST(0, credit_cents - ${Number(c.amount_cents)}::int),
          credit_note = concat_ws('; ', credit_note, ${"Referral credit removed (friend cancelled)"}::text), updated_at = now()
        WHERE id = ${c.applied_booking_id}`;
    }
    await sql`UPDATE referral_credits SET status = 'revoked' WHERE id = ${c.id}`;
  }
}

/** Credits a customer has earned, for their account page. */
export async function creditSummary(email: string): Promise<{ earnedCents: number; availableCents: number }> {
  const rows = await sql`
    SELECT
      COALESCE(SUM(amount_cents) FILTER (WHERE status IN ('available', 'applied')), 0)::int AS earned,
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'available'), 0)::int AS available
    FROM referral_credits WHERE lower(email) = lower(${email})`;
  return { earnedCents: Number(rows[0]?.earned ?? 0), availableCents: Number(rows[0]?.available ?? 0) };
}
