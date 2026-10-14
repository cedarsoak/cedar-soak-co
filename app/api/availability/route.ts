import { NextResponse } from "next/server";
import { getUnavailableDates } from "@/lib/bookings";
import { addDays, earliestBookableDate, isIsoDate, latestBookableDate } from "@/lib/dates";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public: returns only which dates are taken — never who booked them.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const earliest = earliestBookableDate();
  const latest = latestBookableDate();
  let from = url.searchParams.get("from") ?? earliest;
  let to = url.searchParams.get("to") ?? addDays(from, 92);
  if (!isIsoDate(from) || !isIsoDate(to) || to < from) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }
  if (addDays(from, 200) < to) to = addDays(from, 200);
  if (from < addDays(earliest, -40)) from = addDays(earliest, -40);

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ unavailable: [], earliest, latest, configured: false });
  }
  try {
    const taken = await getUnavailableDates(from, to);
    return NextResponse.json(
      { unavailable: [...taken].sort(), earliest, latest, configured: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("availability error", err);
    return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  }
}
