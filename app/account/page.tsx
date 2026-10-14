import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CopyLink from "@/components/booking/CopyLink";
import "@/components/booking/booking.css";
import { BOOKING, luxAvailable } from "@/lib/booking-config";
import { finalizeCheckoutSession, waiverLink } from "@/lib/booking-service";
import { Booking, computeTotals, getPayments, listBookingsForEmail, listReferralsFor } from "@/lib/bookings";
import { getCustomerEmail } from "@/lib/customer-auth";
import { formatDate, pickupDate, todayIso } from "@/lib/dates";
import { canChangePackage, canManage, cancellationTerms, maxExtraNights } from "@/lib/portal";
import { dollars, packageLabel, referralRewardText, stayLabel, stayPriceCents } from "@/lib/pricing";
import { creditSummary } from "@/lib/referrals";
import { qrSvg } from "@/lib/qr";
import { getStripe, isStripeConfigured, siteUrl } from "@/lib/stripe";
import { addNights, cancelBooking, payBalance, requestSignIn, signOut, updatePackage } from "./actions";

export const metadata: Metadata = {
  title: "My Rental | Cedar Soak Co.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type SP = { msg?: string; err?: string; sent?: string; expired?: string; session_id?: string };

const STATUS: Record<string, string> = { confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  let paidMsg = "";
  if (sp.session_id?.startsWith("cs_") && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sp.session_id);
      await finalizeCheckoutSession(session);
      if (session.payment_status === "paid") paidMsg = "Payment received — thank you! Stripe will email you a receipt.";
    } catch (err) {
      console.error("account payment lookup failed", err);
    }
  }
  const email = await getCustomerEmail();

  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Cedar Soak Co.</span>
          <h1>My rental</h1>
          <p>{email ? `Signed in as ${email}` : "See your booking, pay your balance, change your package, extend or cancel."}</p>
        </div>
      </section>
      <section className="form-section">
        <div className="wrap acct">
          {(sp.msg || paidMsg) && <p className="acct-flash">{paidMsg || sp.msg}</p>}
          {sp.err && <p className="bk-error">{sp.err}</p>}
          {email ? <Account email={email} /> : <SignIn sent={sp.sent} expired={Boolean(sp.expired)} />}
        </div>
      </section>
      <Footer />
    </>
  );
}

function SignIn({ sent, expired }: { sent?: string; expired: boolean }) {
  return (
    <div className="bk acct-signin">
      {sent ? (
        <>
          <h3 className="bk-h">Check your email</h3>
          <p className="bk-sub">
            If {sent} has a Cedar Soak booking, a sign-in link is on its way. It works for 14 days. No password needed.
          </p>
          <a className="bk-link" href="/account">
            Use a different email
          </a>
        </>
      ) : (
        <form action={requestSignIn}>
          <h3 className="bk-h">Sign in to see your rental</h3>
          <p className="bk-sub">
            {expired ? "That sign-in link has expired. " : ""}Enter the email you booked with and we&apos;ll send you a sign-in link. No password
            needed.
          </p>
          <div className="field">
            <label htmlFor="acct-email">Email</label>
            <input id="acct-email" name="email" type="email" autoComplete="email" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Email me a sign-in link
          </button>
        </form>
      )}
    </div>
  );
}

async function Account({ email }: { email: string }) {
  const bookings = await listBookingsForEmail(email);
  const today = todayIso();
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.endDate >= today).reverse();
  const past = bookings.filter((b) => !(b.status === "confirmed" && b.endDate >= today));
  const own = bookings.filter((b) => b.status !== "cancelled");
  const referralRef = [...own].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]?.ref ?? null;
  const shareUrl = referralRef ? `${siteUrl()}/book?ref=${referralRef}` : null;
  const [qr, referred, credits] = await Promise.all([
    shareUrl ? qrSvg(shareUrl) : Promise.resolve(null),
    listReferralsFor(own.map((b) => b.ref)),
    creditSummary(email),
  ]);

  return (
    <div className="acct-grid">
      <div className="acct-main">
        {bookings.length === 0 && (
          <div className="bk">
            <h3 className="bk-h">No bookings yet</h3>
            <p className="bk-sub">We don&apos;t see a confirmed booking for {email}.</p>
            <a className="btn btn-primary" href="/book">
              Book your dates
            </a>
          </div>
        )}
        {upcoming.map((b) => (
          <UpcomingCard key={b.id} b={b} />
        ))}
        {past.length > 0 && (
          <div className="bk acct-past">
            <h3 className="bk-h" style={{ fontSize: 19 }}>
              Past &amp; cancelled
            </h3>
            {past.map((b) => (
              <div key={b.id} className="acct-past-row">
                <div>
                  <strong>
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </strong>
                  <span>
                    {b.ref} · {packageLabel(b.package)} · {b.city}
                  </span>
                </div>
                <span className={`acct-pill ${b.status}`}>{STATUS[b.status] ?? b.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="acct-side">
        {shareUrl && (
          <div className="bk acct-share" id="share">
            <h3 className="bk-h" style={{ fontSize: 19 }}>
              Share Cedar Soak
            </h3>
            <p className="bk-sub">
              {referralRewardText() ?? "Send friends your link or let them scan your code. When they book with it, we'll know you sent them."}
            </p>
            {qr && <div className="acct-qr" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR code for your share link" role="img" />}
            <CopyLink url={shareUrl} />
            {qr && (
              <a className="bk-link" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`} download={`cedar-soak-${referralRef}.svg`}>
                Download QR code
              </a>
            )}
            <p className="acct-count">
              {referred.length === 0
                ? "No bookings from your link yet."
                : `${referred.length} ${referred.length === 1 ? "booking" : "bookings"} from your link so far. Thank you!`}
              {credits.earnedCents > 0 && ` You've earned ${dollars(credits.earnedCents)} in credit.`}
              {credits.availableCents > 0 && ` ${dollars(credits.availableCents)} will come off your next rental.`}
            </p>
          </div>
        )}
        <div className="bk acct-help">
          <p className="bk-sub" style={{ margin: 0 }}>
            Questions? Call or text {BOOKING.businessPhone} or email {BOOKING.businessEmail}.
          </p>
          <form action={signOut}>
            <button type="submit" className="bk-link" style={{ marginTop: 10 }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

async function UpcomingCard({ b }: { b: Booking }) {
  const t = computeTotals(b, await getPayments(b.id));
  const manage = canManage(b);
  const pkgChange = canChangePackage(b);
  const extraMax = maxExtraNights(b);
  const terms = cancellationTerms(b);
  const waiverUrl = waiverLink(b);
  const address = [b.address, b.city, b.state, b.zip].filter(Boolean).join(", ");
  const started = todayIso() >= b.startDate;

  return (
    <div className="bk acct-card" id={b.ref}>
      <div className="acct-card-head">
        <div>
          <span className="eyebrow">{b.ref}</span>
          <h3 className="bk-h" style={{ marginTop: 8 }}>
            {formatDate(b.startDate)} → {formatDate(b.endDate)}
          </h3>
          <p className="bk-sub" style={{ margin: 0 }}>
            {b.nights} nights · {packageLabel(b.package)} · {b.heat ?? "Heat: your choice"}
          </p>
        </div>
        <span className="acct-pill confirmed">Confirmed</span>
      </div>

      <dl className="bk-doc-details acct-details">
        <div>
          <dt>Delivery</dt>
          <dd>{formatDate(b.startDate)}</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>{formatDate(b.endDate)}</dd>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <dt>Location</dt>
          <dd>{address}</dd>
        </div>
      </dl>

      <ul className="acct-checklist">
        <li className={b.depositStatus === "unpaid" ? "todo" : "done"}>
          <span>{b.depositStatus === "unpaid" ? "Deposit not paid yet" : `Deposit paid (${dollars(t.depositPaidCents)})`}</span>
        </li>
        <li className={b.waiverSignedAt ? "done" : "todo"}>
          <span>{b.waiverSignedAt ? "Rental agreement signed" : "Rental agreement not signed yet"}</span>
          {!b.waiverSignedAt && waiverUrl && (
            <a className="btn btn-primary acct-mini" href={waiverUrl}>
              Sign now
            </a>
          )}
        </li>
        <li className={t.balanceDueCents > 0 ? "todo" : "done"}>
          <span>
            {t.balanceDueCents > 0
              ? `Balance due: ${dollars(t.balanceDueCents)}${t.price.deliveryCents === null ? " + delivery (we'll confirm)" : ""}`
              : "Rental paid in full"}
          </span>
          {t.balanceDueCents > 0 && t.price.deliveryCents !== null && (
            <form action={payBalance.bind(null, b.id)}>
              <button type="submit" className="btn btn-primary acct-mini">
                Pay {dollars(t.balanceDueCents)}
              </button>
            </form>
          )}
        </li>
      </ul>

      <div className="bk-estimate acct-price">
        <div>
          <span>
            {stayLabel(b.nights, t.price.nightlyRateCents)}
          </span>
          <span>{dollars(t.price.rentalCents)}</span>
        </div>
        {t.price.bonusNightCents > 0 && (
          <div className="bk-good">
            <span>Bonus night{b.promoCode ? ` (${b.promoCode})` : ""}</span>
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
          <span>Delivery</span>
          <span>{t.price.deliveryCents === null ? "We'll confirm" : t.price.deliveryCents === 0 ? "Free" : dollars(t.price.deliveryCents)}</span>
        </div>
        {t.price.discountCents !== 0 && (
          <div className="bk-good">
            <span>Discount</span>
            <span>−{dollars(t.price.discountCents)}</span>
          </div>
        )}
        {t.price.creditCents !== 0 && (
          <div className="bk-good">
            <span>Referral {b.referredBy ? "discount" : "credit"}</span>
            <span>−{dollars(t.price.creditCents)}</span>
          </div>
        )}
        {t.price.extrasCents !== 0 && (
          <div>
            <span>{b.extrasNote || "Extras"}</span>
            <span>{dollars(t.price.extrasCents)}</span>
          </div>
        )}
        <div className="bk-total">
          <span>Rental total</span>
          <span>{dollars(t.price.totalCents)}</span>
        </div>
        {t.rentalPaidCents !== 0 && (
          <div>
            <span>Paid so far</span>
            <span>−{dollars(t.rentalPaidCents)}</span>
          </div>
        )}
      </div>

      {manage && (
        <div className="acct-actions">
          {luxAvailable() && (
            <details className="acct-action">
              <summary>Change package</summary>
              {pkgChange ? (
                <form action={updatePackage.bind(null, b.id)}>
                  <div className="acct-options">
                    <label className="bk-check">
                      <input type="radio" name="package" value="escape" defaultChecked={b.package !== "lux"} />
                      <span>
                        <strong>{BOOKING.packages.escape.label}</strong> — {BOOKING.packages.escape.description}
                      </span>
                    </label>
                    <label className="bk-check">
                      <input type="radio" name="package" value="lux" defaultChecked={b.package === "lux"} />
                      <span>
                        <strong>
                          {BOOKING.packages.lux.label} (+{dollars(BOOKING.packages.lux.addOnCents)})
                        </strong>{" "}
                        — {BOOKING.packages.lux.description}
                      </span>
                    </label>
                  </div>
                  <button type="submit" className="bk-ghost-btn">
                    Save package
                  </button>
                </form>
              ) : (
                <p className="bk-fine">
                  Package changes close {BOOKING.account.packageChangeCutoffHours} hours before delivery. Call or text {BOOKING.businessPhone}.
                </p>
              )}
            </details>
          )}

          <details className="acct-action">
            <summary>Extend my stay</summary>
            {extraMax > 0 ? (
              <form action={addNights.bind(null, b.id)}>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label htmlFor={`extra-${b.id}`}>Add nights</label>
                  <select id={`extra-${b.id}`} name="extra" defaultValue="1">
                    {Array.from({ length: extraMax }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        +{n} {n === 1 ? "night" : "nights"} — pickup {formatDate(pickupDate(b.startDate, b.nights + n))} (+
                        {dollars(stayPriceCents(b.nights + n, b.nightlyRateCents) - stayPriceCents(b.nights, b.nightlyRateCents))})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="bk-fine" style={{ marginTop: 0, marginBottom: 12 }}>
                  We&apos;ll check the calendar. Added nights go on your balance.
                </p>
                <button type="submit" className="bk-ghost-btn">
                  Extend
                </button>
              </form>
            ) : (
              <p className="bk-fine">
                Stays top out at {BOOKING.maxNights} nights online. Call or text {BOOKING.businessPhone} for longer.
              </p>
            )}
          </details>

          {!started && (
            <details className="acct-action">
              <summary>Cancel booking</summary>
              <form action={cancelBooking.bind(null, b.id)}>
                <p className="bk-fine" style={{ marginTop: 0 }}>
                  {terms.refundDeposit
                    ? `You're more than ${BOOKING.cancellationNoticeHours} hours before delivery, so your deposit${
                        t.rentalPaidCents > 0 ? " and any payments" : ""
                      } will be refunded to your card.`
                    : `You're less than ${BOOKING.cancellationNoticeHours} hours before delivery, so the ${dollars(
                        t.depositPaidCents
                      )} deposit is kept, as described in the rental agreement.`}
                </p>
                <label className="bk-check">
                  <input type="checkbox" name="confirm" />
                  <span>Yes, cancel my {formatDate(b.startDate)} rental.</span>
                </label>
                <button type="submit" className="bk-ghost-btn acct-danger">
                  Cancel booking
                </button>
              </form>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
