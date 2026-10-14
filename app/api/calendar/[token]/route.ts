import { calendarFeedToken } from "@/lib/admin-auth";
import { computeTotals, getPaymentsForBookings, listBookingsInRange } from "@/lib/bookings";
import { addDays, todayIso } from "@/lib/dates";
import { dollars, packageLabel } from "@/lib/pricing";
import { siteUrl } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Private calendar feed of confirmed rentals. Subscribe to it from Google
// Calendar ("Other calendars → From URL"). The link is shown in the admin.
function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}
const ymd = (iso: string) => iso.replace(/-/g, "");

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const expected = calendarFeedToken();
  if (!expected || token.replace(/\.ics$/, "") !== expected) return new Response("Not found", { status: 404 });

  const today = todayIso();
  const bookings = (await listBookingsInRange(addDays(today, -60), addDays(today, 400))).filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );
  const payments = await getPaymentsForBookings(bookings.map((b) => b.id));
  const base = siteUrl(new URL(request.url).origin);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cedar Soak Co.//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Cedar Soak Rentals",
    "X-WR-TIMEZONE:America/New_York",
  ];
  for (const b of bookings) {
    const t = computeTotals(b, payments.get(b.id) ?? []);
    const where = [b.address, b.city, b.state, b.zip].filter(Boolean).join(", ");
    const description = [
      `${b.ref} · ${b.nights} nights · ${packageLabel(b.package)}`,
      `Phone: ${b.phone}`,
      `Email: ${b.email}`,
      `Balance due: ${dollars(t.balanceDueCents)}`,
      `Waiver: ${b.waiverSignedAt ? "signed" : "NOT signed"}`,
      `${base}/admin/bookings/${b.id}`,
    ].join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.id}@cedarsoak.co`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(b.startDate)}`,
      `DTEND;VALUE=DATE:${ymd(addDays(b.endDate, 1))}`,
      fold(`SUMMARY:${icsEscape(`Cedar Soak: ${b.firstName} ${b.lastName}${b.city ? ` (${b.city})` : ""}`)}`),
      fold(`LOCATION:${icsEscape(where)}`),
      fold(`DESCRIPTION:${icsEscape(description)}`),
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
  });
}
