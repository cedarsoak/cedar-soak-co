import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { expireCheckoutSession, finalizeCheckoutSession } from "@/lib/booking-service";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe calls this when a checkout is paid or expires.
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
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("stripe webhook handler error", event.type, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
