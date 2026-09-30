import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { closeInvoice, expireCheckoutSession, finalizeCheckoutSession, finalizeInvoicePaid } from "@/lib/booking-service";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe calls this when a checkout or invoice is paid, fails, expires or is voided.
// Endpoint: https://www.cedarsoak.co/api/stripe/webhook (see BOOKING-SETUP.md)
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("stripe webhook signature failed", err);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await finalizeCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
        await expireCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.async_payment_failed":
        await expireCheckoutSession(event.data.object as Stripe.Checkout.Session, "failed");
        break;
      case "invoice.paid":
        await finalizeInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.voided":
      case "invoice.marked_uncollectible":
        await closeInvoice(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        // The invoice stays open and the hosted page lets the client try another card.
        console.warn("stripe invoice payment failed", (event.data.object as Stripe.Invoice).id);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("stripe webhook handler error", event.type, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
