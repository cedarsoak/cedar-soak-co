import { NextResponse } from "next/server";
import { isRangeAvailable } from "@/lib/bookings";
import { buildQuote, parseBookingRequest } from "@/lib/booking-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseBookingRequest(body, { requireContact: false });
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    const available = await isRangeAvailable(parsed.data.startDate, parsed.data.nights, {
      ignoreHoldsForEmail: parsed.data.email,
    });
    if (!available) {
      return NextResponse.json({ ok: false, error: "Those dates are no longer available. Please pick different dates." }, { status: 409 });
    }
    const quote = await buildQuote(parsed.data);
    return NextResponse.json({ ok: true, quote });
  } catch (err) {
    console.error("quote error", err);
    return NextResponse.json({ ok: false, error: "Could not calculate a price. Please try again." }, { status: 500 });
  }
}
