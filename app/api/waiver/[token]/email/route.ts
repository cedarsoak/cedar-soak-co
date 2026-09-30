import { NextResponse } from "next/server";
import { getBookingByWaiverToken } from "@/lib/bookings";
import { waiverLink } from "@/lib/booking-service";
import { sendWaiverLinkEmail } from "@/lib/emails";

export const dynamic = "force-dynamic";

// "Email me the link" on the confirmation page: sends the signing link to the renter.
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByWaiverToken(token);
  if (!booking || booking.status === "cancelled" || booking.status === "expired") {
    return NextResponse.json({ ok: false, error: "This booking link is no longer valid." }, { status: 404 });
  }
  const url = waiverLink(booking);
  const sent = url ? await sendWaiverLinkEmail(booking, url) : false;
  if (!sent) return NextResponse.json({ ok: false, error: "We couldn't send the email. Use the Sign now button instead." }, { status: 500 });
  return NextResponse.json({ ok: true, email: booking.email });
}
