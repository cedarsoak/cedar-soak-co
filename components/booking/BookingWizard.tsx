"use client";

import "./booking.css";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOOKING, luxAvailable } from "@/lib/booking-config";
import { addDays, earliestBookableDate, eachDay, formatDate, latestBookableDate, occupiedRange, pickupDate } from "@/lib/dates";
import { bonusNightQualifies, computePrice, dollars, isBonusPromo, normalizePromo, stayLabel } from "@/lib/pricing";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AgreementText from "./AgreementText";

type Step = 1 | 2 | 3;

interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  address: string;
  city: string;
  state: string;
  zip: string;
  occasion: string;
  guests: string;
  notes: string;
  referral: string;
  website: string; // honeypot
}

interface QuoteResponse {
  price: ReturnType<typeof computePrice>;
  bonusNight: boolean;
  bonusNightBlockedByPriorUse: boolean;
  deliveryMiles: number | null;
  endDate: string;
  packageLabel: string;
  friendDiscountCents: number;
  availableCreditCents: number;
}

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Dates" },
  { n: 2, label: "Details" },
  { n: 3, label: "Deposit" },
];

const emptyContact: Contact = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  smsConsent: false,
  address: "",
  city: "",
  state: "OH",
  zip: "",
  occasion: "",
  guests: "",
  notes: "",
  referral: "",
  website: "",
};

export default function BookingWizard({ cancelled = false }: { cancelled?: boolean }) {
  const [step, setStep] = useState<Step>(1);
  const [earliest] = useState(() => earliestBookableDate());
  const [latest] = useState(() => latestBookableDate());
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [startDate, setStartDate] = useState<string | null>(null);
  const [nights, setNights] = useState<number>(BOOKING.stays.cedarSoak.nights);
  const [heat, setHeat] = useState<string>(BOOKING.heatOptions[0]);
  const [pkg, setPkg] = useState<"escape" | "lux">("escape");
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState(""); // the applied code
  const [promoMsg, setPromoMsg] = useState("");
  const [refCode, setRefCode] = useState("");

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(cancelled ? "Checkout was cancelled — your card was not charged. You can try again below." : "");
  const topRef = useRef<HTMLDivElement>(null);

  // ---- availability ------------------------------------------------------
  const loadMonth = useCallback(
    async (monthIso: string, force = false) => {
      if (!force && loadedMonths.has(monthIso)) return;
      setLoadingMonths(true);
      try {
        const res = await fetch(`/api/availability?from=${addDays(monthIso, -7)}&to=${addDays(monthIso, 50)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load availability.");
        setUnavailable((prev) => {
          const next = new Set(prev);
          for (const d of data.unavailable as string[]) next.add(d);
          return next;
        });
        setLoadedMonths((prev) => new Set(prev).add(monthIso));
        setAvailabilityError("");
      } catch {
        setAvailabilityError(`We couldn't load the calendar. Refresh the page, or call/text ${BOOKING.businessPhone}.`);
      } finally {
        setLoadingMonths(false);
      }
    },
    [loadedMonths]
  );

  const end = startDate ? pickupDate(startDate, nights) : null;
  const rangeConflict = useMemo(() => {
    if (!startDate || !end) return false;
    const occ = occupiedRange(startDate, end);
    return eachDay(occ.from, occ.to).some((d) => unavailable.has(d));
  }, [startDate, end, unavailable]);

  const promoUnlocksBonus = isBonusPromo(promoCode);
  const friendDiscount = refCode ? BOOKING.referral.friendDiscountCents : 0;
  const estimate = computePrice({ nights, bonusNight: bonusNightQualifies(nights, promoCode), packageKey: pkg, creditCents: friendDiscount });

  function applyPromo(raw: string) {
    const code = normalizePromo(raw);
    setError("");
    if (!code) {
      setPromoCode("");
      setPromoMsg("");
      return;
    }
    setPromoCode(code);
    setPromoMsg(
      isBonusPromo(code)
        ? `${code} applied: book ${BOOKING.bonusNight.minNightsForFreeNight - 1} nights, get night ${BOOKING.bonusNight.minNightsForFreeNight} free.`
        : `We'll note ${code} on your booking.`
    );
  }

  // Codes and referrals can come in the link: /book?promo=AFTERGLOW or /book?ref=CS-7F3K2
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const promo = params.get("promo") || params.get("code");
      if (promo) {
        setPromoInput(normalizePromo(promo));
        applyPromo(promo);
      }
      const n = Number(params.get("nights") || params.get("stay"));
      if (Number.isInteger(n) && n >= BOOKING.minNights && n <= BOOKING.maxNights) setNights(n);
      const ref = params.get("ref");
      if (ref) {
        setRefCode(ref.slice(0, 16));
        setContact((c) => ({ ...c, referral: c.referral || "Friend or family" }));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function go(next: Step) {
    setError("");
    setStep(next);
    scrollTop();
  }

  // ---- step validation -----------------------------------------------------
  function validateStep1(): string | null {
    if (!startDate) return "Pick your delivery date on the calendar.";
    if (rangeConflict) return "Part of that stay is already booked. Try fewer nights or a different delivery date.";
    return null;
  }
  function validateStep2(): string | null {
    const c = contact;
    if (!c.firstName.trim() || !c.lastName.trim()) return "Enter your first and last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) return "Enter a valid email address.";
    if (c.phone.replace(/\D/g, "").length < 10) return "Enter a valid phone number.";
    if (!c.address.trim() || !c.city.trim()) return "Enter the street address and city where the tub will go.";
    if (!/^\d{5}(-\d{4})?$/.test(c.zip.trim())) return "Enter a 5-digit ZIP code.";
    return null;
  }

  function payload() {
    return {
      startDate,
      nights,
      heat,
      package: pkg,
      ...contact,
      guests: contact.guests ? Number(contact.guests) : null,
      promoCode: promoCode || null,
      refCode: refCode || null,
    };
  }

  async function loadQuote() {
    setBusy(true);
    setQuote(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not calculate your price.");
      setQuote(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate your price.");
    } finally {
      setBusy(false);
    }
  }

  function next(e?: FormEvent) {
    e?.preventDefault();
    const problem = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (problem) {
      setError(problem);
      return;
    }
    if (step === 2) {
      go(3);
      void loadQuote();
      return;
    }
    go((step + 1) as Step);
  }

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        if (res.status === 409 && startDate) {
          // Dates were taken meanwhile — refresh availability for that month.
          void loadMonth(`${startDate.slice(0, 7)}-01`, true);
        }
        throw new Error(data.error || "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  useEffect(() => {
    if (cancelled) scrollTop();
  }, [cancelled]);

  const setField = (key: keyof Contact) => (e: { target: { value: string } }) => {
    setContact({ ...contact, [key]: e.target.value });
    if (error) setError("");
  };

  // ---- render ------------------------------------------------------------------
  return (
    <div className="bk" ref={topRef}>
      <ol className="bk-steps" aria-label="Booking steps">
        {STEPS.map((s) => (
          <li key={s.n} className={s.n === step ? "is-current" : s.n < step ? "is-done" : ""} aria-current={s.n === step ? "step" : undefined}>
            <span className="bk-step-num">{s.n < step ? "✓" : s.n}</span>
            <span className="bk-step-label">{s.label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form onSubmit={next} className="bk-panel">
          <h3 className="bk-h">When should we deliver?</h3>
          <p className="bk-sub">
            Pick your delivery day. We pick up the morning after your last night.
          </p>
          <AvailabilityCalendar
            startDate={startDate}
            nights={nights}
            earliest={earliest}
            latest={latest}
            unavailable={unavailable}
            loadingMonths={loadingMonths}
            onMonthChange={(m) => void loadMonth(m)}
            onSelect={(iso) => {
              setStartDate(iso);
              setError("");
            }}
          />
          {availabilityError && <p className="bk-error">{availabilityError}</p>}

          <div className="field">
            <label>Your stay</label>
            <div className="bk-stays" role="radiogroup" aria-label="Choose your stay">
              {[BOOKING.stays.fallSoak, BOOKING.stays.cedarSoak].map((stay) => (
                <button
                  type="button"
                  key={stay.nights}
                  role="radio"
                  aria-checked={nights === stay.nights}
                  className={`bk-stay${nights === stay.nights ? " is-on" : ""}`}
                  onClick={() => {
                    setNights(stay.nights);
                    setError("");
                  }}
                >
                  <strong>{stay.name}</strong>
                  <span>
                    {stay.nights} nights · {dollars(stay.priceCents)}
                  </span>
                </button>
              ))}
            </div>
            <div className="bk-longer">
              <span>Staying longer?</span>
              <div className="bk-pills" role="radiogroup" aria-label="Longer stays">
                {Array.from({ length: BOOKING.maxNights - 3 }, (_, i) => 4 + i).map((n) => (
                  <button
                    type="button"
                    key={n}
                    role="radio"
                    aria-checked={nights === n}
                    aria-label={`${n} nights`}
                    className={`bk-pill${nights === n ? " is-on" : ""}`}
                    onClick={() => {
                      setNights(n);
                      setError("");
                    }}
                  >
                    {n}
                    {promoUnlocksBonus && n === BOOKING.bonusNight.minNightsForFreeNight && <em>1 free</em>}
                  </button>
                ))}
              </div>
              <small>{dollars(BOOKING.nightlyRateCents)} per extra night after 3</small>
            </div>
          </div>

          {startDate && end && (
            <div className={`bk-summary${rangeConflict ? " is-bad" : ""}`}>
              <div>
                <span>Delivery</span>
                <strong>{formatDate(startDate)}</strong>
              </div>
              <div>
                <span>Pickup</span>
                <strong>{formatDate(end)}</strong>
              </div>
              {rangeConflict && <p>Part of this stay overlaps another booking. Try fewer nights or another date.</p>}
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label htmlFor="bk-heat">Heat preference</label>
              <select id="bk-heat" value={heat} onChange={(e) => setHeat(e.target.value)}>
                {BOOKING.heatOptions.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bk-pkg">Package</label>
              <select id="bk-pkg" value={pkg} onChange={(e) => setPkg(e.target.value as "escape" | "lux")}>
                <option value="escape">{BOOKING.packages.escape.label}</option>
                {luxAvailable() && (
                  <option value="lux">
                    {BOOKING.packages.lux.label} (+{dollars(BOOKING.packages.lux.addOnCents)})
                  </option>
                )}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="bk-promo">Promo code</label>
            <div className="bk-promo">
              <input
                id="bk-promo"
                autoCapitalize="characters"
                autoComplete="off"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  if (promoMsg) setPromoMsg("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPromo(promoInput);
                  }
                }}
                placeholder="Optional"
              />
              <button type="button" className="bk-apply" onClick={() => applyPromo(promoInput)}>
                Apply
              </button>
            </div>
            {promoMsg && <p className={`bk-promo-msg${promoUnlocksBonus ? " is-good" : ""}`}>{promoMsg}</p>}
          </div>

          <div className="bk-estimate">
            <div>
              <span>
                {stayLabel(nights)}
              </span>
              <span>{dollars(estimate.rentalCents)}</span>
            </div>
            {estimate.bonusNightCents > 0 && (
              <div className="bk-good">
                <span>Bonus night ({promoCode})</span>
                <span>−{dollars(estimate.bonusNightCents)}</span>
              </div>
            )}
            {promoUnlocksBonus && estimate.bonusNightCents === 0 && nights < BOOKING.bonusNight.minNightsForFreeNight && (
              <p className="bk-fine" style={{ marginTop: 0 }}>
                Add night {BOOKING.bonusNight.minNightsForFreeNight} and it&apos;s free with {promoCode}.
              </p>
            )}
            {estimate.packageCents > 0 && (
              <div>
                <span>{BOOKING.packages.lux.label}</span>
                <span>{dollars(estimate.packageCents)}</span>
              </div>
            )}
            {estimate.creditCents > 0 && (
              <div className="bk-good">
                <span>Friend referral discount</span>
                <span>−{dollars(estimate.creditCents)}</span>
              </div>
            )}
            <div className="bk-total">
              <span>Rental</span>
              <span>{dollars(estimate.totalCents)}</span>
            </div>
            <p className="bk-fine">
              Delivery is free within {BOOKING.delivery.freeRadiusMiles} miles of {BOOKING.delivery.originLabel}. Only the{" "}
              {dollars(BOOKING.depositCents)} deposit is due today.
            </p>
          </div>

          {error && <p className="bk-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary bk-next">
            Continue
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={next} className="bk-panel" noValidate>
          <h3 className="bk-h">Your details</h3>
          <p className="bk-sub">Where are we bringing the tub?</p>
          <div className="field-row">
            <div className="field">
              <label htmlFor="bk-fn">First name</label>
              <input id="bk-fn" autoComplete="given-name" value={contact.firstName} onChange={setField("firstName")} required />
            </div>
            <div className="field">
              <label htmlFor="bk-ln">Last name</label>
              <input id="bk-ln" autoComplete="family-name" value={contact.lastName} onChange={setField("lastName")} required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="bk-em">Email</label>
              <input id="bk-em" type="email" autoComplete="email" value={contact.email} onChange={setField("email")} required />
            </div>
            <div className="field">
              <label htmlFor="bk-ph">Phone</label>
              <input id="bk-ph" type="tel" autoComplete="tel" value={contact.phone} onChange={setField("phone")} required />
            </div>
          </div>
          <label className="bk-check">
            <input
              type="checkbox"
              checked={contact.smsConsent}
              onChange={(e) => setContact({ ...contact, smsConsent: e.target.checked })}
            />
            <span>{BOOKING.smsConsentText}</span>
          </label>
          <div className="field">
            <label htmlFor="bk-ad">Street address (where the tub goes)</label>
            <input id="bk-ad" autoComplete="street-address" value={contact.address} onChange={setField("address")} required />
          </div>
          <div className="bk-row3">
            <div className="field">
              <label htmlFor="bk-ci">City</label>
              <input id="bk-ci" autoComplete="address-level2" value={contact.city} onChange={setField("city")} required />
            </div>
            <div className="field">
              <label htmlFor="bk-st">State</label>
              <input id="bk-st" autoComplete="address-level1" value={contact.state} onChange={setField("state")} maxLength={2} />
            </div>
            <div className="field">
              <label htmlFor="bk-zip">ZIP</label>
              <input id="bk-zip" inputMode="numeric" autoComplete="postal-code" value={contact.zip} onChange={setField("zip")} required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="bk-oc">Occasion</label>
              <select id="bk-oc" value={contact.occasion} onChange={setField("occasion")}>
                <option value="">Choose one (optional)</option>
                {BOOKING.occasions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bk-gu">Expected guests</label>
              <select id="bk-gu" value={contact.guests} onChange={setField("guests")}>
                <option value="">Choose (optional)</option>
                {BOOKING.guestOptions.map((n) => (
                  <option key={n} value={String(n)}>
                    {n > (BOOKING.maxOccupancy ?? 99) ? `${n}+ people (we'll help plan soak times)` : n === 1 ? "1 person" : `${n} people`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="bk-rf">How did you hear about us?</label>
            <select id="bk-rf" value={contact.referral} onChange={setField("referral")}>
              <option value="">Choose one (optional)</option>
              {BOOKING.referralOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="bk-no">Anything we should know?</label>
            <textarea
              id="bk-no"
              value={contact.notes}
              onChange={setField("notes")}
              placeholder="Gate codes, slope or soft ground, where the spigot is, venue contact…"
            />
          </div>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={contact.website}
            onChange={setField("website")}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            aria-hidden="true"
          />
          {error && <p className="bk-error" role="alert">{error}</p>}
          <div className="bk-actions">
            <button type="button" className="bk-back" onClick={() => go(1)}>
              Back
            </button>
            <button type="submit" className="btn btn-primary bk-next">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="bk-panel">
          <h3 className="bk-h">Review &amp; reserve</h3>
          <div className="bk-review">
            <div>
              <span>Delivery</span>
              <strong>{startDate && formatDate(startDate)}</strong>
            </div>
            <div>
              <span>Pickup</span>
              <strong>{end && formatDate(end)}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{[contact.address, contact.city, contact.state, contact.zip].filter(Boolean).join(", ")}</strong>
            </div>
            <div>
              <span>Renter</span>
              <strong>
                {contact.firstName} {contact.lastName}
              </strong>
            </div>
          </div>

          {busy && !quote && <p className="bk-sub">Calculating your price…</p>}
          {quote && (
            <div className="bk-estimate">
              <div>
                <span>
                  {stayLabel(quote.price.nights, quote.price.nightlyRateCents)}
                </span>
                <span>{dollars(quote.price.rentalCents)}</span>
              </div>
              {quote.price.bonusNightCents > 0 && (
                <div className="bk-good">
                  <span>Bonus night ({promoCode})</span>
                  <span>−{dollars(quote.price.bonusNightCents)}</span>
                </div>
              )}
              {quote.bonusNightBlockedByPriorUse && (
                <p className="bk-fine">The {promoCode} bonus night is one use per person and has already been used with this email.</p>
              )}
              {quote.price.packageCents > 0 && (
                <div>
                  <span>{quote.packageLabel}</span>
                  <span>{dollars(quote.price.packageCents)}</span>
                </div>
              )}
              {quote.friendDiscountCents > 0 && (
                <div className="bk-good">
                  <span>Friend referral discount</span>
                  <span>−{dollars(Math.min(quote.friendDiscountCents, quote.price.creditCents))}</span>
                </div>
              )}
              {quote.availableCreditCents > 0 && (
                <div className="bk-good">
                  <span>Your referral credit</span>
                  <span>−{dollars(Math.max(0, quote.price.creditCents - quote.friendDiscountCents))}</span>
                </div>
              )}
              <div>
                <span>
                  Delivery
                  {quote.deliveryMiles !== null && <small> (~{Math.round(quote.deliveryMiles)} mi from {BOOKING.delivery.originLabel})</small>}
                </span>
                <span>
                  {quote.price.deliveryCents === null ? "We'll confirm" : quote.price.deliveryCents === 0 ? "Free" : dollars(quote.price.deliveryCents)}
                </span>
              </div>
              <div className="bk-total">
                <span>Rental total</span>
                <span>
                  {dollars(quote.price.totalCents)}
                  {quote.price.deliveryCents === null && " + delivery"}
                </span>
              </div>
              <div className="bk-due">
                <span>Due today: deposit</span>
                <span>{dollars(quote.price.depositCents)}</span>
              </div>
              <div className="bk-next-step">
                <strong>After you pay:</strong> you&apos;ll sign the rental agreement online (about 3 minutes). Sign right away, or have us email
                you the link to sign later. It needs to be signed before delivery.
              </div>
              <p className="bk-fine">
                {BOOKING.depositAppliesToRental
                  ? `Your deposit counts toward the rental. `
                  : `The ${dollars(quote.price.depositCents)} deposit holds your date and covers accidental damage; it's refunded after pickup if there's no damage. `}
                {BOOKING.balanceDueText} Cancel at least {BOOKING.cancellationNoticeHours} hours before delivery to get your deposit back.
                {quote.deliveryMiles !== null && quote.price.deliveryCents ? " Delivery is estimated from your address and confirmed before your rental." : ""}
              </p>
            </div>
          )}

          <details className="bk-preview">
            <summary>Preview the rental agreement</summary>
            <AgreementText />
          </details>

          {error && <p className="bk-error" role="alert">{error}</p>}
          <div className="bk-actions">
            <button type="button" className="bk-back" onClick={() => go(2)} disabled={busy}>
              Back
            </button>
            <button type="button" className="btn btn-primary bk-next" onClick={pay} disabled={busy || !quote}>
              {busy && quote ? "Opening secure checkout…" : `Pay ${dollars(BOOKING.depositCents)} deposit`}
            </button>
          </div>
          {!quote && !busy && error && (
            <button type="button" className="bk-link" onClick={() => void loadQuote()}>
              Try again
            </button>
          )}
          <p className="bk-secure">
            By paying, you agree to the deposit and {BOOKING.cancellationNoticeHours}-hour cancellation terms above.
          </p>
          <p className="bk-secure">Payments are processed securely by Stripe. Your dates are held for {BOOKING.holdMinutes - 5} minutes while you pay.</p>
        </div>
      )}
    </div>
  );
}
