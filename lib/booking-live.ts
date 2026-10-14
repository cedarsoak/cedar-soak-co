import { isDatabaseConfigured } from "./db";
import { isStripeConfigured } from "./stripe";

/**
 * Online booking (calendar + Stripe deposit) switches on by itself once the
 * database and Stripe keys are added in Vercel and the site is redeployed.
 * Until then the site keeps the "request to book" form so no leads are lost.
 */
export function onlineBookingLive(): boolean {
  return isDatabaseConfigured() && isStripeConfigured();
}
