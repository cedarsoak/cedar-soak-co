import { NextResponse } from "next/server";
import { getBookingByWaiverToken } from "@/lib/bookings";
import { notifyWaiverSigned, parseWaiver, requestMeta, signWaiver } from "@/lib/booking-service";

export const dynamic = "force-dynamic";

// Signs the rental agreement for an existing booking (link sent from the admin).
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const booking = await getBookingByWaiverToken(token);
    if (!booking || booking.status === "cancelled") {
      return NextResponse.json({ ok: false, error: "This signing link is no longer valid." }, { status: 404 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const waiver = parseWaiver(body);
    if (!waiver.ok) return NextResponse.json({ ok: false, error: waiver.error }, { status: 400 });
    const pdf = await signWaiver(booking, waiver.data, requestMeta(request));
    await notifyWaiverSigned(booking, pdf);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("waiver sign error", err);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
