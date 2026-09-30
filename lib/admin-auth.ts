import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Simple password login for the owners. Set ADMIN_PASSWORD in Vercel.
// The session cookie is signed so it can't be forged, and lasts 30 days.

const COOKIE = "cs_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_PASSWORD is not set (see BOOKING-SETUP.md).");
  return s;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export function verifySessionValue(value: string | undefined | null): boolean {
  if (!value || !isAdminConfigured()) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now();
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionValue(store.get(COOKIE)?.value);
}

/** Call at the top of every admin page, action and API route. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function startAdminSession(): Promise<void> {
  const expires = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const store = await cookies();
  store.set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Token for the private calendar feed (subscribe from Google Calendar). */
export function calendarFeedToken(): string | null {
  if (!isAdminConfigured()) return null;
  return crypto.createHmac("sha256", secret()).update("calendar-feed-v1").digest("base64url").slice(0, 32);
}
