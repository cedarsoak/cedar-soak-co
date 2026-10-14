import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "@/components/booking/booking.css";
import { BOOKING } from "@/lib/booking-config";
import { finalizeCheckoutSession } from "@/lib/booking-service";
import { Booking } from "@/lib/bookings";
import { formatDate } from "@/lib/dates";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { accountLink } from "@/lib/customer-auth";
import SignPrompt from "@/components/booking/SignPrompt";

export const metadata: Metadata = {
  title: "Booking Confirmed | Cedar Soak Co.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

async function lookup(sessionId: string | undefined): Promise<{ booking: Booking | null; paid: boolean; kind: string }> {
  if (!sessionId || !isStripeConfigured() || !sessionId.startsWith("cs_")) return { booking: null, paid: false, kind: "" };
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    // Marks the payment as paid right away, in case Stripe's webhook hasn't arrived yet.
    const booking = await finalizeCheckoutSession(session);
    return { booking, paid: session.payment_status === "paid", kind: session.metadata?.kind ?? "deposit" };
  } catch (err) {
    console.error("confirmation lookup failed", err);
    return { booking: null, paid: false, kind: "" };
  }
}

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const { booking, paid, kind } = await lookup(session_id);
  const isDeposit = kind === "deposit";

  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Cedar Soak Co.</span>
          <h1>{paid ? (isDeposit ? "You're booked." : "Payment received.") : "Thanks!"}</h1>
        </div>
      </section>
      <section className="form-section">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="bk">
            <div className="bk-done">
              {paid && booking && !isDeposit && (
                <>
                  <h2>Thank you, {booking.firstName}.</h2>
                  <p>Your payment for booking {booking.ref} went through. You&apos;ll get a receipt from Stripe by email.</p>
                  <p style={{ marginTop: 18 }}>
                    <a className="btn btn-primary" href={accountLink(booking.email)}>
                      View my rental
                    </a>
                  </p>
                </>
              )}
              {paid && booking && isDeposit ? (
                <>
                  <h2>See you on {formatDate(booking.startDate)}, {booking.firstName}.</h2>
                  <p>Your deposit is received and your dates are locked in. A confirmation is on its way to {booking.email}.</p>
                  {!booking.waiverSignedAt && booking.waiverToken && <SignPrompt token={booking.waiverToken} email={booking.email} />}
                  <div className="bk-review">
                    <div>
                      <span>Booking</span>
                      <strong>{booking.ref}</strong>
                    </div>
                    <div>
                      <span>Nights</span>
                      <strong>{booking.nights}</strong>
                    </div>
                    <div>
                      <span>Delivery</span>
                      <strong>{formatDate(booking.startDate)}</strong>
                    </div>
                    <div>
                      <span>Pickup</span>
                      <strong>{formatDate(booking.endDate)}</strong>
                    </div>
                  </div>
                  <p>{BOOKING.balanceDueText}</p>
                  <p>
                    <a href={accountLink(booking.email)} style={{ color: "var(--ember-dark)", fontWeight: 600, textDecoration: "underline" }}>
                      View or manage your rental
                    </a>{" "}
                    — pay your balance, change your package, extend, or cancel.
                  </p>
                  <p>
                    Questions? Call or text {BOOKING.businessPhone}.
                  </p>
                </>
              ) : !paid || !booking ? (
                <>
                  <h2>We&apos;re confirming your payment.</h2>
                  <p>
                    If you completed checkout, you&apos;ll get a confirmation email within a few minutes. If it doesn&apos;t arrive, call or
                    text {BOOKING.businessPhone} and we&apos;ll sort it out.
                  </p>
                </>
              ) : null}
              <p style={{ marginTop: 24 }}>
                <Link href="/" className="btn btn-primary">
                  Back to home
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
