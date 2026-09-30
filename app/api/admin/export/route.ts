import { isAdmin } from "@/lib/admin-auth";
import { computeTotals, getPaymentsForBookings, listBookings } from "@/lib/bookings";
import { packageLabel } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const money = (cents: number | null) => (cents === null ? "" : (cents / 100).toFixed(2));

// Download every booking as a spreadsheet (for bookkeeping / taxes).
export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const bookings = await listBookings("all");
  const payments = await getPaymentsForBookings(bookings.map((b) => b.id));
  const header = [
    "Ref", "Status", "Delivery date", "Pickup date", "Nights", "First name", "Last name", "Email", "Phone",
    "Address", "City", "State", "ZIP", "Occasion", "Heat", "Package", "Guests", "Delivery miles",
    "Rental", "Bonus night", "Package add-on", "Delivery fee", "Discount", "Referral credit", "Extras", "Rental total",
    "Paid toward rental", "Balance due", "Deposit paid", "Deposit refunded", "Deposit status",
    "Total collected", "Waiver signed", "Source", "Heard about us", "Promo code", "Referred by", "Created",
  ];
  const rows = bookings.map((b) => {
    const t = computeTotals(b, payments.get(b.id) ?? []);
    return [
      b.ref, b.status, b.startDate, b.endDate, b.nights, b.firstName, b.lastName, b.email, b.phone,
      b.address, b.city, b.state, b.zip, b.occasion, b.heat, packageLabel(b.package), b.guests, b.deliveryMiles,
      money(t.price.rentalCents), money(-t.price.bonusNightCents), money(t.price.packageCents), money(t.price.deliveryCents),
      money(-t.price.discountCents), money(-t.price.creditCents), money(t.price.extrasCents), money(t.price.totalCents),
      money(t.rentalPaidCents), money(t.balanceDueCents), money(t.depositPaidCents), money(t.depositRefundedCents), b.depositStatus,
      money(t.totalCollectedCents), b.waiverSignedAt ? b.waiverSignedAt.toISOString() : "", b.source, b.referral, b.promoCode, b.referredBy, b.createdAt.toISOString(),
    ].map(csvCell).join(",");
  });
  const csv = [header.join(","), ...rows].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cedar-soak-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
