// Pricing math shared by the booking page, the checkout API and the admin.
// Pure functions only — no database or network — so it runs anywhere.

import { BOOKING, PackageKey } from "./booking-config";

export function dollars(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** "$12.50" / "12.5" / "12" -> 1250. Returns null for blank or invalid input. */
export function parseDollarsToCents(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const cleaned = String(input).replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

export function deliveryFeeCents(miles: number | null | undefined): number | null {
  if (miles === null || miles === undefined || Number.isNaN(miles)) return null;
  const d = BOOKING.delivery;
  if (miles <= d.freeRadiusMiles) return 0;
  const extraMiles = Math.ceil(miles - d.freeRadiusMiles);
  return d.feeCents + extraMiles * d.perMileCents;
}

export function packageCents(pkg: string | null | undefined): number {
  if (pkg === "lux") return BOOKING.packages.lux.addOnCents ?? 0;
  return 0;
}

export function packageLabel(pkg: string | null | undefined): string {
  const key = (pkg || "escape") as PackageKey;
  return BOOKING.packages[key]?.label ?? String(pkg);
}

export interface PriceInput {
  nights: number;
  nightlyRateCents?: number;
  bonusNight: boolean;
  packageKey?: string | null;
  packageCents?: number | null;
  deliveryMiles?: number | null;
  deliveryOverrideCents?: number | null;
  discountCents?: number | null;
  /** Referral discounts and credits. */
  creditCents?: number | null;
  extrasCents?: number | null;
}

export interface PriceBreakdown {
  nights: number;
  nightlyRateCents: number;
  rentalCents: number;
  bonusNightCents: number;
  packageCents: number;
  deliveryCents: number | null; // null = not calculated yet
  discountCents: number;
  creditCents: number;
  extrasCents: number;
  totalCents: number; // rental total (excludes the damage deposit unless it applies)
  depositCents: number;
  dueTodayCents: number;
  balanceAfterDepositCents: number;
}

export function normalizePromo(code: string | null | undefined): string {
  return String(code ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

/** True when the code unlocks the bonus-night offer (e.g. AFTERGLOW). */
export function isBonusPromo(code: string | null | undefined): boolean {
  const c = normalizePromo(code);
  return Boolean(c) && (BOOKING.bonusNight.promoCodes as readonly string[]).includes(c);
}

/** The free night applies with a bonus promo code and a long enough stay. */
export function bonusNightQualifies(nights: number, promoCode: string | null | undefined): boolean {
  return BOOKING.bonusNight.enabled && isBonusPromo(promoCode) && nights >= BOOKING.bonusNight.minNightsForFreeNight;
}

/** Rental price before extras: the 2-night Fall Soak is a flat $549; 3+ nights are priced per night ($747 for 3). */
export function stayPriceCents(nights: number, rate: number = BOOKING.nightlyRateCents): number {
  if (nights === BOOKING.stays.fallSoak.nights) return BOOKING.stays.fallSoak.priceCents;
  return nights * rate;
}

/** How the rental line reads on receipts: "Fall Soak (2 nights)", "Cedar Soak (3 nights)", "5 nights × $249". */
export function stayLabel(nights: number, rate: number = BOOKING.nightlyRateCents): string {
  if (nights === BOOKING.stays.fallSoak.nights) return `${BOOKING.stays.fallSoak.name} (2 nights)`;
  if (nights === BOOKING.stays.cedarSoak.nights && rate === BOOKING.nightlyRateCents) return `${BOOKING.stays.cedarSoak.name} (3 nights)`;
  return `${nights} nights × ${dollars(rate)}`;
}

export function computePrice(input: PriceInput): PriceBreakdown {
  const rate = input.nightlyRateCents ?? BOOKING.nightlyRateCents;
  const rentalCents = stayPriceCents(input.nights, rate);
  const bonusNightCents = input.bonusNight ? rate : 0;
  const pkg = input.packageCents ?? packageCents(input.packageKey);
  const delivery =
    input.deliveryOverrideCents !== null && input.deliveryOverrideCents !== undefined
      ? input.deliveryOverrideCents
      : deliveryFeeCents(input.deliveryMiles);
  const discount = input.discountCents ?? 0;
  const extras = input.extrasCents ?? 0;
  const beforeCredit = rentalCents - bonusNightCents + pkg + (delivery ?? 0) - discount + extras;
  const credit = Math.min(Math.max(0, input.creditCents ?? 0), Math.max(0, beforeCredit));
  const totalCents = beforeCredit - credit;
  const depositCents = BOOKING.depositCents;
  return {
    nights: input.nights,
    nightlyRateCents: rate,
    rentalCents,
    bonusNightCents,
    packageCents: pkg,
    deliveryCents: delivery,
    discountCents: discount,
    creditCents: credit,
    extrasCents: extras,
    totalCents,
    depositCents,
    dueTodayCents: depositCents,
    balanceAfterDepositCents: BOOKING.depositAppliesToRental ? totalCents - depositCents : totalCents,
  };
}

/** What the share link offers, e.g. "Friends get $25 off their rental, and you get $25 off yours for each friend who books." */
export function referralRewardText(): string | null {
  const friend = BOOKING.referral.friendDiscountCents;
  const you = BOOKING.referral.referrerCreditCents;
  if (!friend && !you) return null;
  if (friend && you) return `Friends get ${dollars(friend)} off their rental, and you get ${dollars(you)} off yours for each friend who books.`;
  if (friend) return `Friends get ${dollars(friend)} off their rental when they book with your link.`;
  return `You get ${dollars(you)} off your rental for each friend who books with your link.`;
}

/** Straight-line miles between two lat/lng points. */
export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
