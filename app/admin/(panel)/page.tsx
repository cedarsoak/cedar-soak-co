import Link from "next/link";
import { calendarFeedToken } from "@/lib/admin-auth";
import {
  Booking,
  BookingFilter,
  BookingTotals,
  computeTotals,
  getPaymentsForBookings,
  listBlocked,
  listBookings,
  listBookingsInRange,
} from "@/lib/bookings";
import { isDatabaseConfigured, query } from "@/lib/db";
import { addDays, diffDays, formatDate, formatShort, todayIso } from "@/lib/dates";
import { dollars } from "@/lib/pricing";
import { isStripeConfigured, siteUrl } from "@/lib/stripe";
import { Flash, StatusBadge } from "./ui";

export const dynamic = "force-dynamic";

const TABS: { key: BookingFilter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "attention", label: "Needs attention" },
  { key: "pending", label: "Awaiting payment" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

function needsAttention(b: Booking, t: BookingTotals, today: string): string[] {
  const issues: string[] = [];
  if (!b.waiverSignedAt) issues.push("No waiver");
  if (b.depositStatus === "unpaid") issues.push("Deposit unpaid");
  if (t.price.deliveryCents === null) issues.push("Delivery fee not set");
  if (t.balanceDueCents > 0 && diffDays(today, b.startDate) <= 14) issues.push("Balance due");
  if (b.deliveryMilesEstimated && (t.price.deliveryCents ?? 0) > 0) issues.push("Confirm delivery miles");
  return issues;
}

function monthStart(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}
function shiftMonth(first: string, delta: number) {
  const d = new Date(`${first}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 10);
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; month?: string; msg?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const today = todayIso();

  if (!isDatabaseConfigured()) {
    return (
      <>
        <div className="ad-head">
          <h1>Finish setup</h1>
        </div>
        <SetupCard />
      </>
    );
  }

  const tab = (TABS.find((t) => t.key === sp.tab)?.key ?? "upcoming") as BookingFilter;
  const q = sp.q ?? "";
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? `${sp.month}-01` : monthStart(today);

  // Calendar data (a 6-week window around the month)
  const firstDow = new Date(`${month}T00:00:00Z`).getUTCDay();
  const gridStart = addDays(month, -firstDow);
  const gridEnd = addDays(gridStart, 41);

  const [bookings, calBookings, blocked, allActive, yearRows] = await Promise.all([
    listBookings(tab, q, today),
    listBookingsInRange(gridStart, gridEnd),
    listBlocked(gridStart),
    listBookings("upcoming", "", today),
    query(
      // Deposits and deposit refunds are money held for the client, not income.
      // A deposit kept for damage or applied to the rental (retained / applied) counts as income.
      `SELECT COALESCE(SUM(p.amount_cents), 0)::int AS total
       FROM payments p JOIN bookings b ON b.id = p.booking_id
       LEFT JOIN payments orig ON orig.id = p.refund_of
       WHERE p.status = 'paid' AND p.paid_at >= date_trunc('year', now())
         AND (
           (p.kind NOT IN ('deposit', 'refund'))
           OR (p.kind = 'refund' AND orig.kind <> 'deposit')
           OR (b.deposit_status IN ('retained', 'applied') AND (p.kind = 'deposit' OR (p.kind = 'refund' AND orig.kind = 'deposit')))
         )`
    ),
  ]);
  const depositRows = await query(
    `SELECT COALESCE(SUM(p.amount_cents), 0)::int AS total FROM payments p JOIN bookings b ON b.id = p.booking_id
     WHERE p.status = 'paid' AND b.deposit_status = 'held' AND (p.kind = 'deposit' OR (p.kind = 'refund' AND p.refund_of IN (SELECT id FROM payments WHERE kind = 'deposit')))`
  );

  const ids = [...new Set([...bookings, ...allActive].map((b) => b.id))];
  const payments = await getPaymentsForBookings(ids);
  const totalsFor = (b: Booking) => computeTotals(b, payments.get(b.id) ?? []);

  let rows = bookings;
  if (tab === "attention") rows = bookings.filter((b) => needsAttention(b, totalsFor(b), today).length > 0);

  const outstanding = allActive.reduce((sum, b) => sum + Math.max(0, totalsFor(b).balanceDueCents), 0);
  const next = allActive.find((b) => b.startDate >= today);
  const attentionCount = allActive.filter((b) => needsAttention(b, totalsFor(b), today).length > 0).length;

  const feedToken = calendarFeedToken();
  const feedUrl = feedToken ? `${siteUrl()}/api/calendar/${feedToken}` : null;

  return (
    <>
      <Flash msg={sp.msg} err={sp.err} />
      <SetupCard compact />

      <div className="ad-kpis">
        <div className="ad-kpi">
          <span>Upcoming rentals</span>
          <strong>{allActive.length}</strong>
          <small>{attentionCount ? `${attentionCount} need attention` : "All set"}</small>
        </div>
        <div className="ad-kpi">
          <span>Next delivery</span>
          <strong>{next ? formatShort(next.startDate) : "—"}</strong>
          <small>{next ? `${next.firstName} ${next.lastName}` : "Nothing booked"}</small>
        </div>
        <div className="ad-kpi">
          <span>Balances owed</span>
          <strong>{dollars(outstanding)}</strong>
          <small>upcoming rentals</small>
        </div>
        <div className="ad-kpi">
          <span>Deposits held</span>
          <strong>{dollars(Number(depositRows[0]?.total ?? 0))}</strong>
          <small>refund after pickup</small>
        </div>
        <div className="ad-kpi">
          <span>Rental income {today.slice(0, 4)}</span>
          <strong>{dollars(Number(yearRows[0]?.total ?? 0))}</strong>
          <small>excludes refundable deposits</small>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-cal-head">
          <Link className="ad-btn is-ghost is-sm" href={`/admin?month=${shiftMonth(month, -1).slice(0, 7)}&tab=${tab}`}>
            ‹ Prev
          </Link>
          <strong>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}T00:00:00Z`))}</strong>
          <Link className="ad-btn is-ghost is-sm" href={`/admin?month=${shiftMonth(month, 1).slice(0, 7)}&tab=${tab}`}>
            Next ›
          </Link>
        </div>
        <div className="ad-cal">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="ad-cal-wd">
              {d}
            </div>
          ))}
          {Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)).map((day) => {
            const events = calBookings.filter((b) => b.startDate <= day && b.endDate >= day);
            const blocks = blocked.filter((x) => x.startDate <= day && x.endDate >= day);
            const weekStart = new Date(`${day}T00:00:00Z`).getUTCDay() === 0;
            return (
              <div key={day} className={`ad-cal-day${day.slice(0, 7) !== month.slice(0, 7) ? " is-out" : ""}${day === today ? " is-today" : ""}`}>
                <span className="ad-cal-n">{Number(day.slice(8))}</span>
                {events.map((b) => {
                  const first = b.startDate === day;
                  const last = b.endDate === day;
                  return (
                    <Link
                      key={b.id}
                      href={`/admin/bookings/${b.id}`}
                      className={`ad-ev${first ? " is-first" : ""}${last ? " is-last" : ""}${b.status === "pending" ? " is-pending" : ""}`}
                      title={`${b.firstName} ${b.lastName} · ${formatDate(b.startDate)} → ${formatDate(b.endDate)}`}
                    >
                      {first || weekStart ? `${first ? "▸ " : ""}${b.firstName} ${b.lastName.charAt(0)}.` : last ? "pickup" : " "}
                    </Link>
                  );
                })}
                {blocks.map((x) => (
                  <Link key={x.id} href="/admin/availability" className="ad-ev is-blocked is-first is-last" title={x.reason ?? "Blocked"}>
                    {x.reason || "Blocked"}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-head" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Bookings</h2>
          <form className="ad-inline" action="/admin" style={{ flexWrap: "nowrap" }}>
            <input type="hidden" name="tab" value={tab} />
            <input className="ad-input" name="q" defaultValue={q} placeholder="Search name, email, phone, city, ref" style={{ minWidth: 0, width: 260 }} />
            <button className="ad-btn is-ghost" type="submit">
              Search
            </button>
          </form>
        </div>
        <div className="ad-tabs">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={t.key === tab ? "is-on" : ""}>
              {t.label}
            </Link>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="ad-empty">{q ? "No bookings match that search." : "No bookings here yet."}</p>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Dates</th>
                  <th>Client</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Waiver</th>
                  <th className="num">Total</th>
                  <th className="num">Balance</th>
                  <th>Deposit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const t = totalsFor(b);
                  const issues = needsAttention(b, t, today);
                  return (
                    <tr key={b.id}>
                      <td>
                        <Link href={`/admin/bookings/${b.id}`}>
                          <strong>{formatShort(b.startDate)}</strong> → {formatShort(b.endDate)}
                        </Link>
                        <div className="muted">
                          {b.nights} nights · {b.ref}
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/bookings/${b.id}`}>
                          <strong>
                            {b.firstName} {b.lastName}
                          </strong>
                        </Link>
                        <div className="muted">{b.phone}</div>
                      </td>
                      <td>
                        {b.city || "—"}
                        <div className="muted">{b.occasion ?? ""}</div>
                      </td>
                      <td>
                        <StatusBadge status={b.status} />
                        {b.status === "confirmed" && issues.length > 0 && (
                          <div className="muted" style={{ marginTop: 4, color: "#8A4B12" }}>
                            {issues.join(" · ")}
                          </div>
                        )}
                      </td>
                      <td>{b.waiverSignedAt ? <span className="ad-badge ok">Signed</span> : <span className="ad-badge warn">Missing</span>}</td>
                      <td className="num">
                        {dollars(t.price.totalCents)}
                        {t.price.deliveryCents === null && <div className="muted">+ delivery</div>}
                      </td>
                      <td className="num">{t.balanceDueCents > 0 ? <strong>{dollars(t.balanceDueCents)}</strong> : <span className="muted">Paid</span>}</td>
                      <td>
                        <span className={`ad-badge ${b.depositStatus}`}>{b.depositStatus}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="ad-card">
        <h2>Tools</h2>
        <div className="ad-btns" style={{ marginBottom: 14 }}>
          <a className="ad-btn is-ghost" href="/api/admin/export">
            Download all bookings (CSV)
          </a>
          <Link className="ad-btn is-ghost" href="/admin/availability">
            Block off dates
          </Link>
        </div>
        {feedUrl && (
          <>
            <span className="ad-label">Google Calendar feed (private — don&apos;t share)</span>
            <p className="muted">
              In Google Calendar: Other calendars → + → From URL → paste this. Confirmed rentals then show up on your calendar automatically (Google
              refreshes it every few hours).
            </p>
            <code className="ad-copy">{feedUrl}</code>
          </>
        )}
      </div>
    </>
  );
}

function SetupCard({ compact = false }: { compact?: boolean }) {
  const checks = [
    { ok: isDatabaseConfigured(), label: "Database connected (DATABASE_URL)" },
    { ok: isStripeConfigured(), label: "Stripe secret key (STRIPE_SECRET_KEY)" },
    { ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET), label: "Stripe webhook secret (STRIPE_WEBHOOK_SECRET)" },
    { ok: Boolean(process.env.RESEND_API_KEY), label: "Email sending (RESEND_API_KEY)" },
    { ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL), label: "Site address (NEXT_PUBLIC_SITE_URL)" },
  ];
  if (compact && checks.every((c) => c.ok)) return null;
  return (
    <div className="ad-card" style={compact ? { borderColor: "#F0D2AE", background: "#FFFAF3" } : undefined}>
      <h2>{compact ? "A few setup steps left" : "Setup checklist"}</h2>
      <ul className="ad-setup">
        {checks.map((c) => (
          <li key={c.label}>
            <span className={`ad-badge ${c.ok ? "ok" : "warn"}`}>{c.ok ? "Done" : "To do"}</span> {c.label}
          </li>
        ))}
      </ul>
      <p className="muted" style={{ marginTop: 10 }}>
        Step-by-step instructions are in BOOKING-SETUP.md in the website folder. Add each value in Vercel → Project → Settings → Environment
        Variables, then redeploy.
      </p>
    </div>
  );
}
