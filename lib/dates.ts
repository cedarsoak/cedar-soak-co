// Date helpers that work on plain "YYYY-MM-DD" strings so time zones never
// shift a booking by a day. Safe to use on both server and client.

import { BOOKING } from "./booking-config";

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** Every date from start to end, inclusive. */
export function eachDay(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  let cur = startIso;
  let guard = 0;
  while (cur <= endIso && guard < 800) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
}

/** Today's date in the business's time zone (Dayton), as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA formats as YYYY-MM-DD
}

export function earliestBookableDate(now: Date = new Date()): string {
  return addDays(todayIso(now), BOOKING.minLeadDays);
}

export function latestBookableDate(now: Date = new Date()): string {
  const d = new Date(`${todayIso(now)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + BOOKING.maxMonthsAhead);
  return d.toISOString().slice(0, 10);
}

/** Pickup day = start + nights. */
export function pickupDate(startIso: string, nights: number): string {
  return addDays(startIso, nights);
}

/**
 * The days a rental occupies the trailer: delivery day through pickup day,
 * plus any extra turnover days.
 */
export function occupiedRange(startIso: string, endIso: string): { from: string; to: string } {
  return { from: startIso, to: addDays(endIso, BOOKING.turnoverDaysAfterPickup) };
}

export function rangesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

const LONG = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function formatDate(iso: string): string {
  return LONG.format(new Date(`${iso}T00:00:00Z`));
}

export function formatShort(iso: string): string {
  return SHORT.format(new Date(`${iso}T00:00:00Z`));
}

export function formatRange(startIso: string, endIso: string): string {
  const sameYear = startIso.slice(0, 4) === endIso.slice(0, 4);
  const end = formatShort(endIso) + ", " + endIso.slice(0, 4);
  return `${formatShort(startIso)}${sameYear ? "" : ", " + startIso.slice(0, 4)} – ${end}`;
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: BOOKING.timeZone,
    timeZoneName: "short",
  }).format(d);
}

/** Minutes the business time zone is offset from UTC on a given day (e.g. -240 for EDT). */
function zoneOffsetMinutes(iso: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: BOOKING.timeZone, timeZoneName: "shortOffset" }).formatToParts(
      new Date(`${iso}T12:00:00Z`)
    );
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
    const m = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return -300;
    const mins = Number(m[2]) * 60 + Number(m[3] ?? 0);
    return m[1] === "-" ? -mins : mins;
  } catch {
    return -300;
  }
}

/** The moment a rental starts for the cancellation rule: 9:00 AM local time on delivery day. */
export function rentalStartInstant(iso: string, hour = 9): Date {
  const utcMs = Date.parse(`${iso}T${String(hour).padStart(2, "0")}:00:00Z`) - zoneOffsetMinutes(iso) * 60000;
  return new Date(utcMs);
}

export function hoursUntilRentalStart(iso: string, now: Date = new Date()): number {
  return (rentalStartInstant(iso).getTime() - now.getTime()) / 3600000;
}
