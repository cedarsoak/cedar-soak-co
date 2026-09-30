import crypto from "crypto";
import { query, sql } from "./db";
import { BOOKING } from "./booking-config";
import { addDays, eachDay, occupiedRange, pickupDate } from "./dates";
import { computePrice, PriceBreakdown } from "./pricing";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "expired";
export type DepositStatus = "unpaid" | "held" | "refunded" | "retained" | "applied";

export interface Booking {
  id: string;
  ref: string;
  status: BookingStatus;
  source: string;
  startDate: string;
  endDate: string;
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
  adminNotes: string | null;
  referral: string | null;
  promoCode: string | null;
  referredBy: string | null;
  nightlyRateCents: number;
  bonusNight: boolean;
  packageCents: number;
  deliveryMiles: number | null;
  deliveryMilesEstimated: boolean;
  deliveryOverrideCents: number | null;
  discountCents: number;
  discountNote: string | null;
  creditCents: number;
  creditNote: string | null;
  extrasCents: number;
  extrasNote: string | null;
  depositCents: number;
  depositStatus: DepositStatus;
  waiverSignedAt: Date | null;
  waiverName: string | null;
  waiverToken: string | null;
  holdExpiresAt: Date | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  kind: "deposit" | "balance" | "damage" | "other" | "refund";
  method: string;
  amountCents: number;
  status: "pending" | "paid" | "failed" | "expired";
  refundOf: string | null;
  stripeSessionId: string | null;
  stripePaymentIntent: string | null;
  checkoutUrl: string | null;
  note: string | null;
  createdAt: Date;
  paidAt: Date | null;
}

export interface BookingFile {
  id: string;
  bookingId: string;
  kind: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  note: string | null;
  createdAt: Date;
}

export interface BlockedRange {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: Date;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toDate = (v: any): Date | null => (v === null || v === undefined ? null : v instanceof Date ? v : new Date(v));
const toNum = (v: any): number | null => (v === null || v === undefined ? null : Number(v));

export function mapBooking(r: any): Booking {
  return {
    id: r.id,
    ref: r.ref,
    status: r.status,
    source: r.source,
    startDate: r.start_date,
    endDate: r.end_date,
    nights: Number(r.nights),
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    city: r.city,
    state: r.state,
    zip: r.zip,
    occasion: r.occasion,
    heat: r.heat,
    package: r.package,
    guests: toNum(r.guests),
    notes: r.notes,
    adminNotes: r.admin_notes,
    referral: r.referral ?? null,
    promoCode: r.promo_code ?? null,
    referredBy: r.referred_by ?? null,
    nightlyRateCents: Number(r.nightly_rate_cents),
    bonusNight: Boolean(r.bonus_night),
    packageCents: Number(r.package_cents),
    deliveryMiles: toNum(r.delivery_miles),
    deliveryMilesEstimated: Boolean(r.delivery_miles_estimated),
    deliveryOverrideCents: toNum(r.delivery_override_cents),
    discountCents: Number(r.discount_cents),
    creditCents: Number(r.credit_cents ?? 0),
    creditNote: r.credit_note ?? null,
    discountNote: r.discount_note,
    extrasCents: Number(r.extras_cents),
    extrasNote: r.extras_note,
    depositCents: Number(r.deposit_cents),
    depositStatus: r.deposit_status,
    waiverSignedAt: toDate(r.waiver_signed_at),
    waiverName: r.waiver_name,
    waiverToken: r.waiver_token,
    holdExpiresAt: toDate(r.hold_expires_at),
    confirmedAt: toDate(r.confirmed_at),
    cancelledAt: toDate(r.cancelled_at),
    createdAt: toDate(r.created_at) as Date,
    updatedAt: toDate(r.updated_at) as Date,
  };
}

export function mapPayment(r: any): Payment {
  return {
    id: r.id,
    bookingId: r.booking_id,
    kind: r.kind,
    method: r.method,
    amountCents: Number(r.amount_cents),
    status: r.status,
    refundOf: r.refund_of,
    stripeSessionId: r.stripe_session_id,
    stripePaymentIntent: r.stripe_payment_intent,
    checkoutUrl: r.checkout_url,
    note: r.note,
    createdAt: toDate(r.created_at) as Date,
    paidAt: toDate(r.paid_at),
  };
}

function mapFile(r: any): BookingFile {
  return {
    id: r.id,
    bookingId: r.booking_id,
    kind: r.kind,
    filename: r.filename,
    contentType: r.content_type,
    sizeBytes: Number(r.size_bytes),
    note: r.note,
    createdAt: toDate(r.created_at) as Date,
  };
}

function mapBlocked(r: any): BlockedRange {
  return {
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    createdAt: toDate(r.created_at) as Date,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Refs & tokens
// ---------------------------------------------------------------------------

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRef(): string {
  const bytes = crypto.randomBytes(5);
  let out = "CS-";
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return out;
}

export function generateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/** SQL condition for bookings that currently hold dates. $1 = email to ignore (their own hold). */
const ACTIVE_BOOKING_SQL = `(
  b.status IN ('confirmed', 'completed')
  OR (b.status = 'pending' AND b.hold_expires_at > now() AND lower(b.email) <> lower($1))
)`;

export interface AvailabilityOptions {
  /** Ignore pending holds from this email (so a customer can retry their own checkout). */
  ignoreHoldsForEmail?: string;
  /** Ignore this booking (when editing it). */
  excludeBookingId?: string;
}

/** Every unavailable date between from and to (inclusive). */
export async function getUnavailableDates(from: string, to: string, opts: AvailabilityOptions = {}): Promise<Set<string>> {
  const turnover = BOOKING.turnoverDaysAfterPickup;
  const rows = await query(
    `SELECT b.start_date, b.end_date FROM bookings b
     WHERE ${ACTIVE_BOOKING_SQL}
       AND b.id::text <> $2
       AND b.start_date <= $4 AND b.end_date >= $3`,
    [opts.ignoreHoldsForEmail ?? "", opts.excludeBookingId ?? "", addDays(from, -turnover), to]
  );
  const blocked = await query(`SELECT start_date, end_date FROM blocked_dates WHERE start_date <= $2 AND end_date >= $1`, [from, to]);

  const out = new Set<string>();
  for (const r of rows) {
    const range = occupiedRange(r.start_date, r.end_date);
    for (const d of eachDay(range.from > from ? range.from : from, range.to < to ? range.to : to)) out.add(d);
  }
  for (const r of blocked) {
    for (const d of eachDay(r.start_date > from ? r.start_date : from, r.end_date < to ? r.end_date : to)) out.add(d);
  }
  return out;
}

export async function isRangeAvailable(start: string, nights: number, opts: AvailabilityOptions = {}): Promise<boolean> {
  const end = pickupDate(start, nights);
  const range = occupiedRange(start, end);
  const taken = await getUnavailableDates(start, range.to, opts);
  // Also make sure no *earlier* booking's turnover runs into our delivery day (handled by the query range).
  return taken.size === 0;
}

// ---------------------------------------------------------------------------
// Bonus night eligibility
// ---------------------------------------------------------------------------

export async function bonusNightEligible(email: string, excludeBookingId?: string): Promise<boolean> {
  if (!BOOKING.bonusNight.enabled) return false;
  if (!BOOKING.bonusNight.oncePerPerson) return true;
  if (!email) return true;
  const rows = await sql`
    SELECT 1 FROM bookings
    WHERE lower(email) = lower(${email}) AND bonus_night = true
      AND status IN ('confirmed', 'completed')
      AND id::text <> ${excludeBookingId ?? ""}
    LIMIT 1`;
  return rows.length === 0;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface NewBookingInput {
  status: BookingStatus;
  source: string;
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
  occasion?: string | null;
  heat?: string | null;
  package: string;
  guests?: number | null;
  notes?: string | null;
  adminNotes?: string | null;
  referral?: string | null;
  promoCode?: string | null;
  referredBy?: string | null;
  nightlyRateCents: number;
  bonusNight: boolean;
  packageCents: number;
  deliveryMiles: number | null;
  deliveryMilesEstimated: boolean;
  deliveryOverrideCents?: number | null;
  discountCents?: number;
  discountNote?: string | null;
  creditCents?: number;
  creditNote?: string | null;
  extrasCents?: number;
  extrasNote?: string | null;
  depositCents: number;
  waiverSignedAt?: Date | null;
  waiverName?: string | null;
  holdMinutes?: number | null;
  /** Skip the availability check (admin override). */
  force?: boolean;
}

export class DatesUnavailableError extends Error {
  constructor() {
    super("Those dates were just booked by someone else. Please pick different dates.");
  }
}

/**
 * Inserts the booking only if its dates are still free — the check and the
 * insert happen in one SQL statement so two people can't grab the same dates.
 */
export async function createBooking(input: NewBookingInput): Promise<Booking> {
  const endDate = pickupDate(input.startDate, input.nights);
  const occupied = occupiedRange(input.startDate, endDate);
  const turnover = BOOKING.turnoverDaysAfterPickup;

  for (let attempt = 0; attempt < 5; attempt++) {
    const ref = generateRef();
    const params: unknown[] = [
      input.email, // $1 (used by ACTIVE_BOOKING_SQL)
      ref,
      input.status,
      input.source,
      input.startDate,
      endDate,
      input.nights,
      input.firstName,
      input.lastName,
      input.email,
      input.phone,
      input.address,
      input.city,
      input.state,
      input.zip,
      input.occasion ?? null,
      input.heat ?? null,
      input.package,
      input.guests ?? null,
      input.notes ?? null,
      input.adminNotes ?? null,
      input.nightlyRateCents,
      input.bonusNight,
      input.packageCents,
      input.deliveryMiles,
      input.deliveryMilesEstimated,
      input.deliveryOverrideCents ?? null,
      input.discountCents ?? 0,
      input.discountNote ?? null,
      input.extrasCents ?? 0,
      input.extrasNote ?? null,
      input.depositCents,
      input.waiverSignedAt ?? null,
      input.waiverName ?? null,
      input.holdMinutes ?? null, // $35
      input.force ? true : false, // $36
      addDays(input.startDate, -turnover), // $37 earliest end_date that could collide
      occupied.to, // $38 last occupied day
      generateToken(), // $39 waiver token
      input.status === "confirmed" ? new Date() : null, // $40
      input.referral ?? null, // $41
      input.promoCode ?? null, // $42
      input.referredBy ?? null, // $43
      input.creditCents ?? 0, // $44
      input.creditNote ?? null, // $45
    ];
    try {
      const rows = await query(
        `INSERT INTO bookings (
           ref, status, source, start_date, end_date, nights, first_name, last_name, email, phone,
           address, city, state, zip, occasion, heat, package, guests, notes, admin_notes,
           nightly_rate_cents, bonus_night, package_cents, delivery_miles, delivery_miles_estimated,
           delivery_override_cents, discount_cents, discount_note, extras_cents, extras_note,
           deposit_cents, waiver_signed_at, waiver_name, hold_expires_at, waiver_token, confirmed_at,
           referral, promo_code, referred_by, credit_cents, credit_note
         )
         SELECT $2::text, $3::text, $4::text, $5::text, $6::text, $7::int, $8::text, $9::text, $10::text, $11::text,
                $12::text, $13::text, $14::text, $15::text, $16::text, $17::text, $18::text, $19::int, $20::text, $21::text,
                $22::int, $23::boolean, $24::int, $25::numeric, $26::boolean,
                $27::int, $28::int, $29::text, $30::int, $31::text,
                $32::int, $33::timestamptz, $34::text,
                CASE WHEN $35::int IS NULL THEN NULL ELSE now() + make_interval(mins => $35::int) END,
                $39::text, $40::timestamptz, $41::text, $42::text, $43::text, $44::int, $45::text
         WHERE $36::boolean
            OR (
              NOT EXISTS (
                SELECT 1 FROM bookings b
                WHERE ${ACTIVE_BOOKING_SQL}
                  AND b.start_date <= $38 AND b.end_date >= $37
              )
              AND NOT EXISTS (
                SELECT 1 FROM blocked_dates x WHERE x.start_date <= $38 AND x.end_date >= $5
              )
            )
         RETURNING *`,
        params
      );
      if (rows.length === 0) throw new DatesUnavailableError();
      const created = mapBooking(rows[0]);
      if (!input.force) {
        // Guard against two checkouts for the same dates landing at the same instant:
        // the earlier one wins, the later one is released.
        const clash = await query(
          `SELECT 1 FROM bookings b
           WHERE ${ACTIVE_BOOKING_SQL}
             AND b.id <> $2::uuid
             AND b.start_date <= $4 AND b.end_date >= $3
             AND (b.created_at, b.id) < (SELECT created_at, id FROM bookings WHERE id = $2::uuid)
           LIMIT 1`,
          [input.email, created.id, addDays(input.startDate, -turnover), occupied.to]
        );
        if (clash.length > 0) {
          await query(`UPDATE bookings SET status = 'expired', hold_expires_at = NULL WHERE id = $1`, [created.id]);
          throw new DatesUnavailableError();
        }
      }
      return created;
    } catch (err) {
      if (err instanceof DatesUnavailableError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("bookings_ref_key") || message.includes("duplicate key")) continue; // ref collision, retry
      throw err;
    }
  }
  throw new Error("Could not create booking reference. Please try again.");
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getBooking(id: string): Promise<Booking | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await sql`SELECT * FROM bookings WHERE id = ${id}`;
  return rows[0] ? mapBooking(rows[0]) : null;
}

/** "CS-7F3K2", "cs7f3k2" and "CS7F3K2" all match the same booking. */
export function normalizeRef(input: string | null | undefined): string | null {
  const raw = String(input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("CS") ? raw.slice(2) : raw;
  return /^[A-Z0-9]{5}$/.test(body) ? `CS-${body}` : null;
}

export async function getBookingByRef(ref: string): Promise<Booking | null> {
  const normalized = normalizeRef(ref);
  if (!normalized) return null;
  const rows = await sql`SELECT * FROM bookings WHERE ref = ${normalized}`;
  return rows[0] ? mapBooking(rows[0]) : null;
}

/** Every booking made with this email (for the customer's account page). */
export async function listBookingsForEmail(email: string): Promise<Booking[]> {
  const rows = await sql`
    SELECT * FROM bookings
    WHERE lower(email) = lower(${email}) AND status IN ('confirmed', 'completed', 'cancelled')
    ORDER BY start_date DESC`;
  return rows.map(mapBooking);
}

/** Bookings that came in through a customer's referral link. */
export async function listReferralsFor(refs: string[]): Promise<Booking[]> {
  if (refs.length === 0) return [];
  const rows = await query(
    `SELECT * FROM bookings WHERE referred_by = ANY($1::text[]) AND status IN ('confirmed', 'completed') ORDER BY created_at DESC`,
    [`{${refs.filter((r) => /^CS-[A-Z0-9]{5}$/.test(r)).join(",")}}`]
  );
  return rows.map(mapBooking);
}

export async function getBookingByWaiverToken(token: string): Promise<Booking | null> {
  if (!token || token.length < 20) return null;
  const rows = await sql`SELECT * FROM bookings WHERE waiver_token = ${token}`;
  return rows[0] ? mapBooking(rows[0]) : null;
}

export async function getPayments(bookingId: string): Promise<Payment[]> {
  const rows = await sql`SELECT * FROM payments WHERE booking_id = ${bookingId} ORDER BY created_at ASC`;
  return rows.map(mapPayment);
}

/** Postgres array literal for a list of UUIDs (works the same with every driver). */
function uuidArray(ids: string[]): string {
  return `{${ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).join(",")}}`;
}

export async function getPaymentsForBookings(ids: string[]): Promise<Map<string, Payment[]>> {
  const map = new Map<string, Payment[]>();
  if (ids.length === 0) return map;
  const rows = await query(`SELECT * FROM payments WHERE booking_id = ANY($1::uuid[]) ORDER BY created_at ASC`, [uuidArray(ids)]);
  for (const r of rows) {
    const p = mapPayment(r);
    const list = map.get(p.bookingId) ?? [];
    list.push(p);
    map.set(p.bookingId, list);
  }
  return map;
}

export async function getFiles(bookingId: string): Promise<BookingFile[]> {
  const rows = await sql`
    SELECT id, booking_id, kind, filename, content_type, size_bytes, note, created_at
    FROM booking_files WHERE booking_id = ${bookingId} ORDER BY created_at ASC`;
  return rows.map(mapFile);
}

export async function getFileCounts(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const rows = await query(
    `SELECT booking_id, count(*)::int AS n FROM booking_files WHERE booking_id = ANY($1::uuid[]) AND kind = 'waiver' GROUP BY booking_id`,
    [uuidArray(ids)]
  );
  for (const r of rows) map.set(r.booking_id, Number(r.n));
  return map;
}

export async function getFileWithData(id: string): Promise<(BookingFile & { data: Buffer }) | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await sql`SELECT * FROM booking_files WHERE id = ${id}`;
  if (!rows[0]) return null;
  return { ...mapFile(rows[0]), data: Buffer.from(rows[0].data_b64, "base64") };
}

export async function addFile(
  bookingId: string,
  file: { kind: string; filename: string; contentType: string; data: Buffer | Uint8Array; note?: string | null }
): Promise<void> {
  const buf = Buffer.from(file.data);
  await sql`
    INSERT INTO booking_files (booking_id, kind, filename, content_type, size_bytes, data_b64, note)
    VALUES (${bookingId}, ${file.kind}, ${file.filename}, ${file.contentType}, ${buf.length}, ${buf.toString("base64")}, ${file.note ?? null})`;
}

export async function listBlocked(fromDate?: string): Promise<BlockedRange[]> {
  const rows = fromDate
    ? await sql`SELECT * FROM blocked_dates WHERE end_date >= ${fromDate} ORDER BY start_date`
    : await sql`SELECT * FROM blocked_dates ORDER BY start_date`;
  return rows.map(mapBlocked);
}

export async function listBookingsInRange(from: string, to: string): Promise<Booking[]> {
  const rows = await sql`
    SELECT * FROM bookings
    WHERE start_date <= ${to} AND end_date >= ${from}
      AND (status IN ('confirmed', 'completed') OR (status = 'pending' AND hold_expires_at > now()))
    ORDER BY start_date`;
  return rows.map(mapBooking);
}

export type BookingFilter = "upcoming" | "attention" | "pending" | "past" | "cancelled" | "all";

export async function listBookings(filter: BookingFilter, search?: string, today?: string): Promise<Booking[]> {
  const t = today ?? new Date().toISOString().slice(0, 10);
  const q = (search ?? "").trim();
  const like = `%${q.toLowerCase()}%`;
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  switch (filter) {
    case "upcoming":
    case "attention":
      where.push(`status = 'confirmed' AND end_date >= ${p(t)}`);
      break;
    case "pending":
      where.push(`status = 'pending'`);
      break;
    case "past":
      where.push(`(status = 'completed' OR (status = 'confirmed' AND end_date < ${p(t)}))`);
      break;
    case "cancelled":
      where.push(`status IN ('cancelled', 'expired')`);
      break;
    case "all":
      break;
  }
  if (q) {
    const l = p(like);
    where.push(
      `(lower(first_name || ' ' || last_name) LIKE ${l} OR lower(email) LIKE ${l} OR lower(ref) LIKE ${l} OR lower(city) LIKE ${l} OR phone LIKE ${l} OR lower(address) LIKE ${l} OR lower(coalesce(promo_code, '')) LIKE ${l})`
    );
  }
  const order = filter === "upcoming" || filter === "attention" ? "start_date ASC" : "start_date DESC";
  const rows = await query(
    `SELECT * FROM bookings ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order} LIMIT 500`,
    params
  );
  return rows.map(mapBooking);
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export interface BookingTotals {
  price: PriceBreakdown;
  /** Paid toward the rental (excludes the damage deposit unless it applies to rental). */
  rentalPaidCents: number;
  balanceDueCents: number;
  depositPaidCents: number;
  depositRefundedCents: number;
  depositHeldCents: number;
  totalCollectedCents: number; // all money in minus refunds
  pendingLinks: Payment[];
}

export function bookingPrice(b: Booking): PriceBreakdown {
  return computePrice({
    nights: b.nights,
    nightlyRateCents: b.nightlyRateCents,
    bonusNight: b.bonusNight,
    packageKey: b.package,
    packageCents: b.packageCents,
    deliveryMiles: b.deliveryMiles,
    deliveryOverrideCents: b.deliveryOverrideCents,
    discountCents: b.discountCents,
    creditCents: b.creditCents,
    extrasCents: b.extrasCents,
  });
}

export function computeTotals(b: Booking, payments: Payment[]): BookingTotals {
  const price = bookingPrice(b);
  const paid = payments.filter((p) => p.status === "paid");
  const byId = new Map(payments.map((p) => [p.id, p]));

  let depositPaid = 0;
  let depositRefunded = 0;
  let rentalPaid = 0;
  let totalCollected = 0;

  for (const p of paid) {
    totalCollected += p.amountCents;
    if (p.kind === "deposit") depositPaid += p.amountCents;
    else if (p.kind === "refund") {
      const original = p.refundOf ? byId.get(p.refundOf) : undefined;
      if (original?.kind === "deposit") depositRefunded += -p.amountCents;
      else rentalPaid += p.amountCents; // refunds are stored as negative amounts
    } else if (p.kind === "balance" || p.kind === "other") rentalPaid += p.amountCents;
    // "damage" payments are extra charges; they don't reduce the rental balance.
  }

  const depositHeld = Math.max(0, depositPaid - depositRefunded);
  let balance = price.totalCents - rentalPaid;
  if (BOOKING.depositAppliesToRental || b.depositStatus === "applied") balance -= depositHeld;

  return {
    price,
    rentalPaidCents: rentalPaid,
    balanceDueCents: balance,
    depositPaidCents: depositPaid,
    depositRefundedCents: depositRefunded,
    depositHeldCents: b.depositStatus === "retained" || b.depositStatus === "applied" ? 0 : depositHeld,
    totalCollectedCents: totalCollected,
    pendingLinks: payments.filter((p) => p.status === "pending" && p.checkoutUrl),
  };
}

export async function insertPayment(p: {
  bookingId: string;
  kind: Payment["kind"];
  method: string;
  amountCents: number;
  status: Payment["status"];
  refundOf?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntent?: string | null;
  checkoutUrl?: string | null;
  note?: string | null;
}): Promise<Payment> {
  const rows = await sql`
    INSERT INTO payments (booking_id, kind, method, amount_cents, status, refund_of, stripe_session_id,
                          stripe_payment_intent, checkout_url, note, paid_at)
    VALUES (${p.bookingId}, ${p.kind}, ${p.method}, ${p.amountCents}, ${p.status}, ${p.refundOf ?? null},
            ${p.stripeSessionId ?? null}, ${p.stripePaymentIntent ?? null}, ${p.checkoutUrl ?? null}, ${p.note ?? null},
            ${p.status === "paid" ? new Date() : null})
    RETURNING *`;
  return mapPayment(rows[0]);
}

export async function touchBooking(id: string): Promise<void> {
  await sql`UPDATE bookings SET updated_at = now() WHERE id = ${id}`;
}
