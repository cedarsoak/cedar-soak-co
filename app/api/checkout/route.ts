import { NextResponse } from "next/server";
import { BOOKING } from "@/lib/booking-config";
import { createBooking, DatesUnavailableError } from "@/lib/bookings";
import { bookingFieldsFromQuote, buildQuote, parseBookingRequest } from "@/lib/booking-service";
import { sql } from "@/lib/db";
import { createCheckoutForBooking, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let bookingId: string | null = null;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.website) return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 400 }); // honeypot

    const parsed = parseBookingRequest(body, { requireContact: true });
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { ok: false, error: `Online payments aren't set up yet. Please call or text ${BOOKING.businessPhone} to book.` },
        { status: 503 }
      );
    }

    const quote = await buildQuote(parsed.data);
    const booking = await createBooking({
      ...bookingFieldsFromQuote(parsed.data, quote),
      status: "pending",
      source: "website",
      holdMinutes: BOOKING.holdMinutes,
    });
    bookingId = booking.id;

    const origin = new URL(request.url).origin;
    const { url } = await createCheckoutForBooking({
      booking,
      kind: "deposit",
      amountCents: booking.depositCents,
      origin,
      expiresInMinutes: BOOKING.holdMinutes - 3,
      successPath: "/book/confirmed",
      cancelPath: "/book?cancelled=1",
    });
    return NextResponse.json({ ok: true, url, ref: booking.ref });
  } catch (err) {
    if (bookingId) {
      await sql`UPDATE bookings SET status = 'expired', hold_expires_at = NULL WHERE id = ${bookingId} AND status = 'pending'`.catch(() => {});
    }
    if (err instanceof DatesUnavailableError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    console.error("checkout error", err);
    return NextResponse.json(
      { ok: false, error: `Something went wrong starting checkout. Please try again or call/text ${BOOKING.businessPhone}.` },
      { status: 500 }
    );
  }
}
