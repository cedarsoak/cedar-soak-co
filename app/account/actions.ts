"use server";

import { redirect } from "next/navigation";
import { accountLink, endCustomerSession, getCustomerEmail } from "@/lib/customer-auth";
import { Booking, computeTotals, getBooking, getPayments, listBookingsForEmail } from "@/lib/bookings";
import { sendAccountLinkEmail } from "@/lib/emails";
import { cancelByCustomer, changePackage, extendStay } from "@/lib/portal";
import { createCheckoutForBooking, isStripeConfigured } from "@/lib/stripe";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const done = (msg: string, anchor = ""): never => redirect(`/account?msg=${encodeURIComponent(msg)}${anchor ? `#${anchor}` : ""}`);
const fail = (msg: string, anchor = ""): never => redirect(`/account?err=${encodeURIComponent(msg)}${anchor ? `#${anchor}` : ""}`);

export async function requestSignIn(fd: FormData): Promise<void> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  if (!EMAIL.test(email)) redirect(`/account?err=${encodeURIComponent("Enter the email you booked with.")}`);
  const bookings = await listBookingsForEmail(email);
  if (bookings.length > 0) await sendAccountLinkEmail(email, bookings[0].firstName, accountLink(email));
  // Same answer either way, so the page never reveals who has booked.
  redirect(`/account?sent=${encodeURIComponent(email)}`);
}

export async function signOut(): Promise<void> {
  await endCustomerSession();
  redirect("/account");
}

/** Loads the booking only if it belongs to the signed-in renter. */
async function ownBooking(id: string): Promise<Booking> {
  const email = await getCustomerEmail();
  if (!email) redirect("/account");
  const b = await getBooking(id);
  if (!b || b.email.toLowerCase() !== email!.toLowerCase()) fail("We couldn't find that booking on your account.");
  return b!;
}

export async function payBalance(id: string): Promise<void> {
  const b = await ownBooking(id);
  if (!isStripeConfigured()) fail("Online payments aren't available right now. Call or text us.", b.ref);
  const t = computeTotals(b, await getPayments(b.id));
  if (t.price.deliveryCents === null) fail("We're still confirming your delivery fee. We'll email you when your balance is ready.", b.ref);
  if (t.balanceDueCents < 50) done("Your rental is paid in full.", b.ref);
  // If we've already sent an invoice for the balance, send them there instead of charging twice.
  const payments = await getPayments(b.id);
  const openInvoice = payments.find((p) => p.status === "pending" && p.kind === "balance" && p.stripeInvoiceId && p.checkoutUrl);
  if (openInvoice) redirect(openInvoice.checkoutUrl!);
  const { url } = await createCheckoutForBooking({
    booking: b,
    kind: "balance",
    amountCents: t.balanceDueCents,
    expiresInMinutes: 60,
    successPath: "/account",
    cancelPath: "/account",
    description: `Rental balance · ${b.ref}`,
  });
  redirect(url);
}

export async function updatePackage(id: string, fd: FormData): Promise<void> {
  const b = await ownBooking(id);
  const r = await changePackage(b, String(fd.get("package") ?? ""));
  (r.ok ? done : fail)(r.message, b.ref);
}

export async function addNights(id: string, fd: FormData): Promise<void> {
  const b = await ownBooking(id);
  const r = await extendStay(b, Number(fd.get("extra")));
  (r.ok ? done : fail)(r.message, b.ref);
}

export async function cancelBooking(id: string, fd: FormData): Promise<void> {
  const b = await ownBooking(id);
  if (fd.get("confirm") !== "on") fail("Tick the box to confirm you want to cancel.", b.ref);
  const r = await cancelByCustomer(b);
  (r.ok ? done : fail)(r.message, b.ref);
}
