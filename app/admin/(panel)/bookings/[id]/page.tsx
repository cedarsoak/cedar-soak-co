import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKING } from "@/lib/booking-config";
import { computeTotals, getBooking, getFiles, getPayments, Payment } from "@/lib/bookings";
import { diffDays, formatDate, formatDateTime, todayIso } from "@/lib/dates";
import { dollars, packageLabel, stayLabel } from "@/lib/pricing";
import { isStripeConfigured, siteUrl } from "@/lib/stripe";
import {
  cancelPaymentLink,
  deleteBooking,
  deleteFile,
  recordManualPayment,
  refundPayment,
  sendPaymentLink,
  sendWaiverLink,
  setBookingStatus,
  setDepositStatus,
  updateBooking,
} from "../../actions";
import BookingFields from "../../BookingFields";
import { centsToInput, F, Flash, StatusBadge } from "../../ui";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  deposit: "Deposit",
  balance: "Rental balance",
  damage: "Damage charge",
  other: "Other",
  refund: "Refund",
};
const FILE_KIND: Record<string, string> = {
  waiver: "Signed rental agreement",
  "guest-waiver": "Guest waivers",
  photo: "Photo",
  other: "Document",
};

function sizeLabel(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function BookingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const booking = await getBooking(id);
  if (!booking) notFound();
  const b = booking;
  const [payments, files] = await Promise.all([getPayments(b.id), getFiles(b.id)]);
  const t = computeTotals(b, payments);
  const today = todayIso();
  const hoursToStart = diffDays(today, b.startDate) * 24;
  const fullAddress = [b.address, b.city, b.state, b.zip].filter(Boolean).join(", ");
  const q = encodeURIComponent(fullAddress);
  const satelliteUrl = `https://maps.google.com/maps?q=${q}&t=k&z=20`;
  const satelliteEmbed = `https://maps.google.com/maps?q=${q}&t=k&z=19&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(BOOKING.delivery.originLabel)}&destination=${q}`;
  const waiverUrl = b.waiverToken ? `${siteUrl()}/waiver/${b.waiverToken}` : null;
  const refundedFor = (p: Payment) =>
    payments.filter((r) => r.refundOf === p.id && r.status === "paid").reduce((sum, r) => sum - r.amountCents, 0);
  const stripeOn = isStripeConfigured();

  return (
    <>
      <Link href="/admin" className="ad-crumb">
        ← All bookings
      </Link>
      <div className="ad-head">
        <div>
          <h1>
            {b.firstName} {b.lastName}
          </h1>
          <p>
            {formatDate(b.startDate)} → {formatDate(b.endDate)} · {b.nights} nights · {b.ref} <StatusBadge status={b.status} />
          </p>
        </div>
        <div className="ad-btns">
          {b.phone && (
            <>
              <a className="ad-btn is-ghost is-sm" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}>
                Call
              </a>
              <a className="ad-btn is-ghost is-sm" href={`sms:${b.phone.replace(/[^\d+]/g, "")}`}>
                Text
              </a>
            </>
          )}
          <a className="ad-btn is-ghost is-sm" href={`mailto:${b.email}?subject=${encodeURIComponent(`Your Cedar Soak rental (${b.ref})`)}`}>
            Email
          </a>
        </div>
      </div>

      <Flash msg={sp.msg} err={sp.err} />
      {b.status === "pending" && (
        <div className="ad-flash is-err">
          This client started checkout but hasn&apos;t paid the deposit yet
          {b.holdExpiresAt ? ` — dates are held until ${formatDateTime(b.holdExpiresAt)}` : ""}.
        </div>
      )}

      <div className="ad-grid2">
        {/* ---------------- LEFT ---------------- */}
        <div>
          <div className="ad-card">
            <h2>Booking</h2>
            <dl className="ad-kv">
              <dt>Delivery</dt>
              <dd>{formatDate(b.startDate)}</dd>
              <dt>Pickup</dt>
              <dd>{formatDate(b.endDate)}</dd>
              <dt>Location</dt>
              <dd>
                {fullAddress ? (
                  <a href={satelliteUrl} target="_blank" rel="noreferrer" className="ad-addr" title="Open satellite view in Google Maps">
                    {fullAddress} ↗
                  </a>
                ) : (
                  "—"
                )}
                {fullAddress && (
                  <div className="ad-addr-links">
                    <a href={satelliteUrl} target="_blank" rel="noreferrer">
                      Satellite view
                    </a>
                    <a href={directionsUrl} target="_blank" rel="noreferrer">
                      Directions from {BOOKING.delivery.originLabel}
                    </a>
                  </div>
                )}
              </dd>
              <dt>Email</dt>
              <dd>{b.email}</dd>
              <dt>Phone</dt>
              <dd>{b.phone || "—"}</dd>
              <dt>OK to text</dt>
              <dd>{b.smsConsent ? "Yes, agreed on the booking form" : "No"}</dd>
              <dt>Occasion</dt>
              <dd>{b.occasion || "—"}</dd>
              <dt>Heat</dt>
              <dd>{b.heat || "—"}</dd>
              <dt>Package</dt>
              <dd>{packageLabel(b.package)}</dd>
              <dt>Guests</dt>
              <dd>{b.guests === null ? "—" : b.guests > (BOOKING.maxOccupancy ?? 99) ? `${b.guests}+` : b.guests}</dd>
              <dt>Heard about us</dt>
              <dd>{b.referral || "—"}</dd>
              <dt>Promo code</dt>
              <dd>{b.promoCode || "—"}</dd>
              <dt>Referred by</dt>
              <dd>{b.referredBy ? <Link href={`/admin?tab=all&q=${encodeURIComponent(b.referredBy)}`}>{b.referredBy}</Link> : "—"}</dd>
              <dt>Client notes</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{b.notes || "—"}</dd>
              {b.adminNotes && (
                <>
                  <dt>Admin notes</dt>
                  <dd style={{ whiteSpace: "pre-wrap" }}>{b.adminNotes}</dd>
                </>
              )}
              <dt>Booked</dt>
              <dd>
                {formatDateTime(b.createdAt)} · {b.source === "website" ? "online" : "added by admin"}
              </dd>
            </dl>
            {fullAddress && (
              <div className="ad-sat">
                <iframe
                  src={satelliteEmbed}
                  title={`Satellite view of ${fullAddress}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          <div className="ad-card" id="edit">
            <details className="ad-details" style={{ border: 0, margin: 0, padding: 0 }}>
              <summary>Edit booking details, dates &amp; pricing</summary>
              <form action={updateBooking.bind(null, b.id)} className="ad-form">
                <BookingFields b={b} />
                <div className="ad-btns">
                  <button type="submit" className="ad-btn is-ember">
                    Save changes
                  </button>
                </div>
              </form>
            </details>
          </div>

          <div className="ad-card">
            <h2>Status</h2>
            <div className="ad-btns">
              {b.status !== "confirmed" && (
                <form action={setBookingStatus.bind(null, b.id)}>
                  <input type="hidden" name="status" value="confirmed" />
                  <button className="ad-btn is-ghost" type="submit">
                    {b.status === "cancelled" || b.status === "expired" ? "Reopen as confirmed" : "Mark confirmed"}
                  </button>
                </form>
              )}
              {b.status === "confirmed" && (
                <form action={setBookingStatus.bind(null, b.id)}>
                  <input type="hidden" name="status" value="completed" />
                  <button className="ad-btn is-ghost" type="submit">
                    Mark completed (picked up)
                  </button>
                </form>
              )}
              {b.status !== "cancelled" && (
                <form action={setBookingStatus.bind(null, b.id)}>
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="ad-btn is-danger" type="submit">
                    Cancel booking
                  </button>
                </form>
              )}
            </div>
            {b.status !== "cancelled" && b.depositStatus === "held" && (
              <p className="muted" style={{ marginTop: 10 }}>
                Cancellation policy: {hoursToStart >= BOOKING.cancellationNoticeHours ? "more" : "less"} than {BOOKING.cancellationNoticeHours} hours before
                delivery → deposit {hoursToStart >= BOOKING.cancellationNoticeHours ? "is refunded" : "is forfeited"}.
              </p>
            )}
          </div>

          <div className="ad-card" id="danger">
            <details className="ad-details" style={{ border: 0, margin: 0, padding: 0 }}>
              <summary>Delete booking</summary>
              <p className="muted" style={{ marginBottom: 10 }}>
                For test or spam bookings only. Bookings with payments can&apos;t be deleted — cancel them instead so your records stay intact.
              </p>
              <form action={deleteBooking.bind(null, b.id)} className="ad-inline">
                <F label="Type DELETE to confirm" name="confirm" />
                <button className="ad-btn is-danger" type="submit">
                  Delete
                </button>
              </form>
            </details>
          </div>
        </div>

        {/* ---------------- RIGHT ---------------- */}
        <div>
          <div className="ad-card" id="payments">
            <h2>
              Billing <span className={`ad-badge ${b.depositStatus}`}>Deposit {b.depositStatus}</span>
            </h2>
            <div className="ad-money">
              <div>
                <span>
                  {stayLabel(b.nights, b.nightlyRateCents)}
                </span>
                <span>{dollars(t.price.rentalCents)}</span>
              </div>
              {t.price.bonusNightCents > 0 && (
                <div>
                  <span>Bonus night</span>
                  <span>−{dollars(t.price.bonusNightCents)}</span>
                </div>
              )}
              {t.price.packageCents !== 0 && (
                <div>
                  <span>{packageLabel(b.package)}</span>
                  <span>{dollars(t.price.packageCents)}</span>
                </div>
              )}
              <div>
                <span>
                  Delivery
                  {b.deliveryMiles !== null && (
                    <span className="muted">
                      {" "}
                      ({b.deliveryMiles} mi{b.deliveryMilesEstimated ? ", estimated" : ""}
                      {b.deliveryOverrideCents !== null ? ", manual fee" : ""})
                    </span>
                  )}
                </span>
                <span>{t.price.deliveryCents === null ? <em className="muted">not set</em> : dollars(t.price.deliveryCents)}</span>
              </div>
              {t.price.discountCents !== 0 && (
                <div>
                  <span>Discount{b.discountNote ? ` (${b.discountNote})` : ""}</span>
                  <span>−{dollars(t.price.discountCents)}</span>
                </div>
              )}
              {t.price.creditCents !== 0 && (
                <div>
                  <span>Referral {b.creditNote ? <span className="muted">({b.creditNote})</span> : null}</span>
                  <span>−{dollars(t.price.creditCents)}</span>
                </div>
              )}
              {t.price.extrasCents !== 0 && (
                <div>
                  <span>Extras{b.extrasNote ? ` (${b.extrasNote})` : ""}</span>
                  <span>{dollars(t.price.extrasCents)}</span>
                </div>
              )}
              <div className="tot">
                <span>Rental total</span>
                <span>{dollars(t.price.totalCents)}</span>
              </div>
              <div>
                <span>Paid toward rental</span>
                <span>{dollars(t.rentalPaidCents)}</span>
              </div>
              {(BOOKING.depositAppliesToRental || b.depositStatus === "applied") && t.depositPaidCents > 0 && (
                <div>
                  <span>Deposit applied</span>
                  <span>−{dollars(t.depositPaidCents - t.depositRefundedCents)}</span>
                </div>
              )}
              <div className={`due${t.balanceDueCents <= 0 ? " is-zero" : ""}`}>
                <span>Balance due</span>
                <span>{t.balanceDueCents <= 0 ? (t.balanceDueCents < 0 ? `Overpaid ${dollars(-t.balanceDueCents)}` : "Paid in full") : dollars(t.balanceDueCents)}</span>
              </div>
              <div className="tot">
                <span>Damage deposit</span>
                <span>
                  {dollars(t.depositPaidCents)} paid
                  {t.depositRefundedCents > 0 && ` · ${dollars(t.depositRefundedCents)} refunded`}
                </span>
              </div>
            </div>

            <h3>Payment history</h3>
            {payments.length === 0 ? (
              <p className="muted">No payments yet.</p>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>For</th>
                      <th className="num">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const refunded = refundedFor(p);
                      const refundable = p.status === "paid" && p.kind !== "refund" && refunded < p.amountCents;
                      return (
                        <tr key={p.id}>
                          <td className="muted">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                          <td>
                            {KIND_LABEL[p.kind] ?? p.kind}
                            <div className="muted">
                              {p.method}
                              {p.note ? ` · ${p.note}` : ""}
                            </div>
                            {p.status === "pending" && p.checkoutUrl && (
                              <>
                                <code className="ad-copy">{p.checkoutUrl}</code>
                                <form action={cancelPaymentLink.bind(null, b.id, p.id)} style={{ marginTop: 6 }}>
                                  <button className="ad-btn is-ghost is-sm" type="submit">
                                    Cancel link
                                  </button>
                                </form>
                              </>
                            )}
                            {refundable && (
                              <details className="ad-details" style={{ marginTop: 8, paddingTop: 8 }}>
                                <summary>Refund</summary>
                                <form action={refundPayment.bind(null, b.id, p.id)} className="ad-form">
                                  <F
                                    label="Amount ($)"
                                    name="amount"
                                    inputMode="decimal"
                                    defaultValue={centsToInput(p.amountCents - refunded)}
                                    hint={p.method === "stripe" ? "Goes back to the client's card through Stripe." : "Records a refund you paid back by hand."}
                                  />
                                  {p.method !== "stripe" && (
                                    <F label="Paid back by" name="method">
                                      <select id="method" name="method" defaultValue={p.method}>
                                        {["cash", "venmo", "zelle", "check", "cash app", "other"].map((m) => (
                                          <option key={m}>{m}</option>
                                        ))}
                                      </select>
                                    </F>
                                  )}
                                  <F label="Note" name="note" placeholder="Reason (optional)" />
                                  <button className="ad-btn is-danger is-sm" type="submit">
                                    Refund
                                  </button>
                                </form>
                              </details>
                            )}
                          </td>
                          <td className="num">{dollars(p.amountCents)}</td>
                          <td>
                            <span className={`ad-badge ${p.status === "paid" ? (p.kind === "refund" ? "refunded" : "paid") : p.status}`}>
                              {p.status === "pending" ? "link sent" : p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <details className="ad-details" open={t.balanceDueCents > 0 && b.status === "confirmed" && t.pendingLinks.length === 0}>
              <summary>Request a payment (Stripe link)</summary>
              {!stripeOn && <p className="ad-flash is-err">Add STRIPE_SECRET_KEY in Vercel to send card payment links.</p>}
              <form action={sendPaymentLink.bind(null, b.id)} className="ad-form">
                <div className="ad-row">
                  <F label="For" name="kind">
                    <select id="kind" name="kind" defaultValue={b.depositStatus === "unpaid" ? "deposit" : "balance"}>
                      <option value="deposit">Deposit</option>
                      <option value="balance">Rental balance</option>
                      <option value="damage">Damage charge</option>
                      <option value="other">Other</option>
                    </select>
                  </F>
                  <F
                    label="Amount ($)"
                    name="amount"
                    inputMode="decimal"
                    defaultValue={centsToInput(b.depositStatus === "unpaid" ? b.depositCents : Math.max(0, t.balanceDueCents))}
                  />
                </div>
                <F label="Description (shown to client)" name="description" placeholder="Optional" />
                <label className="ad-checkline">
                  <input type="checkbox" name="email" defaultChecked /> Email the link to {b.email}
                </label>
                <button className="ad-btn is-ember" type="submit" disabled={!stripeOn}>
                  Create payment link
                </button>
              </form>
            </details>

            <details className="ad-details">
              <summary>Record a payment received (cash, Venmo, check…)</summary>
              <form action={recordManualPayment.bind(null, b.id)} className="ad-form">
                <div className="ad-row">
                  <F label="For" name="kind">
                    <select id="kind2" name="kind" defaultValue={b.depositStatus === "unpaid" ? "deposit" : "balance"}>
                      <option value="deposit">Deposit</option>
                      <option value="balance">Rental balance</option>
                      <option value="damage">Damage charge</option>
                      <option value="other">Other</option>
                    </select>
                  </F>
                  <F label="Amount ($)" name="amount" inputMode="decimal" defaultValue={centsToInput(Math.max(0, t.balanceDueCents))} />
                  <F label="Method" name="method">
                    <select id="method2" name="method" defaultValue="cash">
                      {["cash", "venmo", "zelle", "check", "cash app", "card (in person)", "other"].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </F>
                </div>
                <F label="Note" name="note" placeholder="e.g. check #1042" />
                <button className="ad-btn" type="submit">
                  Record payment
                </button>
              </form>
            </details>

            {t.depositPaidCents > 0 && (
              <details className="ad-details">
                <summary>Deposit after pickup</summary>
                <p className="muted" style={{ marginBottom: 10 }}>
                  No damage? Refund the deposit from the payment history above (Refund on the Deposit row). Damage? Keep it here, and if repairs cost
                  more, send a Damage charge link (due within 14 days per the agreement).
                </p>
                <form action={setDepositStatus.bind(null, b.id)} className="ad-form">
                  <div className="ad-row">
                    <F label="Deposit is" name="depositStatus">
                      <select id="depositStatus" name="depositStatus" defaultValue={b.depositStatus}>
                        <option value="held">Held (waiting for pickup)</option>
                        <option value="retained">Kept for damage</option>
                        <option value="applied">Applied to rental balance</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </F>
                  </div>
                  <F label="Note" name="note" placeholder="e.g. cracked step, photos in files" />
                  <button className="ad-btn is-ghost" type="submit">
                    Update deposit
                  </button>
                </form>
              </details>
            )}
          </div>

          <div className="ad-card" id="files">
            <h2>
              Waivers &amp; files
              {b.waiverSignedAt ? <span className="ad-badge ok">Waiver signed</span> : <span className="ad-badge warn">Waiver missing</span>}
            </h2>
            {b.waiverSignedAt && (
              <p className="muted" style={{ marginBottom: 10 }}>
                {b.waiverName} · {formatDateTime(b.waiverSignedAt)}
              </p>
            )}
            {files.length === 0 ? (
              <p className="muted">No files yet.</p>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <tbody>
                    {files.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <a href={`/api/admin/files/${f.id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, textDecoration: "underline" }}>
                            {f.filename}
                          </a>
                          <div className="muted">
                            {FILE_KIND[f.kind] ?? f.kind} · {sizeLabel(f.sizeBytes)} · {formatDateTime(f.createdAt)}
                            {f.note ? ` · ${f.note}` : ""}
                          </div>
                        </td>
                        <td style={{ width: 1, whiteSpace: "nowrap" }}>
                          <a className="ad-btn is-ghost is-sm" href={`/api/admin/files/${f.id}?download=1`}>
                            Download
                          </a>
                          <details className="ad-details" style={{ border: 0, marginTop: 6, paddingTop: 0 }}>
                            <summary className="muted">Delete</summary>
                            <form action={deleteFile.bind(null, b.id, f.id)} className="ad-form" style={{ marginTop: 6 }}>
                              <label className="ad-checkline">
                                <input type="checkbox" name="confirm" /> Yes, delete
                              </label>
                              <button className="ad-btn is-danger is-sm" type="submit">
                                Delete file
                              </button>
                            </form>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <details className="ad-details" open={!b.waiverSignedAt}>
              <summary>Get the waiver signed online</summary>
              <p className="muted" style={{ marginBottom: 10 }}>
                Sends the client a link to read, initial and sign the rental agreement on their phone. The signed PDF appears here automatically.
              </p>
              <form action={sendWaiverLink.bind(null, b.id)}>
                <button className="ad-btn is-ghost" type="submit">
                  Email signing link to {b.email}
                </button>
              </form>
              {waiverUrl && (
                <>
                  <span className="ad-label" style={{ marginTop: 12 }}>
                    Or copy and text this link
                  </span>
                  <code className="ad-copy">{waiverUrl}</code>
                </>
              )}
            </details>

            <details className="ad-details">
              <summary>Upload a file (paper waiver, guest waivers, photos)</summary>
              <form action={`/api/admin/bookings/${b.id}/files`} method="post" encType="multipart/form-data" className="ad-form">
                <div className="ad-row">
                  <F label="Type" name="kind">
                    <select id="filekind" name="kind" defaultValue={b.waiverSignedAt ? "guest-waiver" : "waiver"}>
                      <option value="waiver">Signed rental agreement</option>
                      <option value="guest-waiver">Guest waivers</option>
                      <option value="photo">Photo (damage, setup…)</option>
                      <option value="other">Other document</option>
                    </select>
                  </F>
                </div>
                <div className="ad-f">
                  <label htmlFor="file">File (PDF or photo, up to 4 MB)</label>
                  <input id="file" name="file" type="file" accept="application/pdf,image/*" required />
                </div>
                <F label="Note" name="note" placeholder="Optional" />
                <button className="ad-btn" type="submit">
                  Upload
                </button>
              </form>
            </details>
          </div>
        </div>
      </div>
    </>
  );
}
