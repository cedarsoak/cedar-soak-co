import crypto from "crypto";
import { cookies } from "next/headers";
import { siteUrl } from "./stripe";

// Password-free sign-in for renters: they enter their email and get a link.
// The link (and the session cookie it sets) is signed, so it can't be forged.

const COOKIE = "cs_customer";
const SESSION_DAYS = 30;
const LINK_DAYS = 14;

function secret(): string {
  const s = process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("Set ADMIN_PASSWORD (or CUSTOMER_SESSION_SECRET) so customer sign-in links can be signed.");
  return s;
}

function sign(purpose: string, payload: string): string {
  return crypto.createHmac("sha256", secret()).update(`${purpose}:${payload}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function makeToken(purpose: string, email: string, days: number): string {
  const payload = `${Buffer.from(email.toLowerCase()).toString("base64url")}.${Date.now() + days * 86400000}`;
  return `${payload}.${sign(purpose, payload)}`;
}

function readToken(purpose: string, token: string | null | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  try {
    if (!safeEqual(parts[2], sign(purpose, payload))) return null;
  } catch {
    return null;
  }
  if (Number(parts[1]) < Date.now()) return null;
  const email = Buffer.from(parts[0], "base64url").toString("utf8");
  return email.includes("@") ? email : null;
}

/** A sign-in link for the renter's account page, valid for 14 days. */
export function accountLink(email: string): string {
  return `${siteUrl()}/account/verify?t=${encodeURIComponent(makeToken("login", email, LINK_DAYS))}`;
}

export function verifyLoginToken(token: string | null | undefined): string | null {
  return readToken("login", token);
}

export async function startCustomerSession(email: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, makeToken("session", email, SESSION_DAYS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

/** The signed-in renter's email, or null. */
export async function getCustomerEmail(): Promise<string | null> {
  const store = await cookies();
  return readToken("session", store.get(COOKIE)?.value);
}

export async function endCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
