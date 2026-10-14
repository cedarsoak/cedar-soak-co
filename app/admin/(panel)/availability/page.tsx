import { listBlocked } from "@/lib/bookings";
import { formatDate, todayIso } from "@/lib/dates";
import { addBlockedDates, removeBlockedDates } from "../actions";
import { F, Flash } from "../ui";

export const dynamic = "force-dynamic";

export default async function Availability({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const sp = await searchParams;
  const blocks = await listBlocked(todayIso());
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Block off dates</h1>
          <p>Close dates for maintenance, personal use, or events you&apos;re booking elsewhere. Customers can&apos;t pick them online.</p>
        </div>
      </div>
      <Flash msg={sp.msg} err={sp.err} />
      <div className="ad-grid2">
        <div className="ad-card">
          <h2>Add blocked dates</h2>
          <form action={addBlockedDates} className="ad-form">
            <div className="ad-row">
              <F label="From" name="startDate" type="date" required />
              <F label="Through" name="endDate" type="date" hint="Leave blank for a single day" />
            </div>
            <F label="Reason (only you see this)" name="reason" placeholder="e.g. Trailer service, family trip" />
            <button type="submit" className="ad-btn is-ember">
              Block dates
            </button>
          </form>
        </div>
        <div className="ad-card">
          <h2>Currently blocked</h2>
          {blocks.length === 0 ? (
            <p className="muted">Nothing blocked.</p>
          ) : (
            <table className="ad-table">
              <tbody>
                {blocks.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <strong>{formatDate(x.startDate)}</strong>
                      {x.endDate !== x.startDate && <> → {formatDate(x.endDate)}</>}
                      <div className="muted">{x.reason || "No reason given"}</div>
                    </td>
                    <td style={{ width: 1 }}>
                      <form action={removeBlockedDates.bind(null, x.id)}>
                        <button className="ad-btn is-ghost is-sm" type="submit">
                          Reopen
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
