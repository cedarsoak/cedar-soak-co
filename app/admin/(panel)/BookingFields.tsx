import { BOOKING } from "@/lib/booking-config";
import type { Booking } from "@/lib/bookings";
import { dollars } from "@/lib/pricing";
import { centsToInput, F } from "./ui";

// Shared form fields for "New booking" and "Edit booking".
export default function BookingFields({ b }: { b: Booking | null }) {
  return (
    <>
      <h3 style={{ marginTop: 0 }}>Dates</h3>
      <div className="ad-row">
        <F label="Delivery date" name="startDate" type="date" defaultValue={b?.startDate} required />
        <F label="Nights" name="nights" type="number" min={1} max={30} defaultValue={b?.nights ?? BOOKING.minNights} required hint="Pickup = delivery + nights" />
      </div>

      <h3>Client</h3>
      <div className="ad-row">
        <F label="First name" name="firstName" defaultValue={b?.firstName} required />
        <F label="Last name" name="lastName" defaultValue={b?.lastName} required />
      </div>
      <div className="ad-row">
        <F label="Email" name="email" type="email" defaultValue={b?.email} required />
        <F label="Phone" name="phone" type="tel" defaultValue={b?.phone} />
      </div>

      <h3>Location</h3>
      <F label="Street address" name="address" defaultValue={b?.address} />
      <div className="ad-row">
        <F label="City" name="city" defaultValue={b?.city} />
        <F label="State" name="state" defaultValue={b?.state ?? "OH"} />
        <F label="ZIP" name="zip" defaultValue={b?.zip} />
      </div>

      <h3>Rental</h3>
      <div className="ad-row">
        <F label="Occasion" name="occasion">
          <select id="occasion" name="occasion" defaultValue={b?.occasion ?? ""}>
            <option value="">—</option>
            {BOOKING.occasions.map((o) => (
              <option key={o}>{o}</option>
            ))}
            {b?.occasion && !(BOOKING.occasions as readonly string[]).includes(b.occasion) && <option>{b.occasion}</option>}
          </select>
        </F>
        <F label="Heat" name="heat">
          <select id="heat" name="heat" defaultValue={b?.heat ?? BOOKING.heatOptions[0]}>
            {BOOKING.heatOptions.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </F>
        <F label="Guests" name="guests" type="number" min={1} defaultValue={b?.guests} />
      </div>
      <div className="ad-row">
        <F label="Heard about us from" name="referral">
          <select id="referral" name="referral" defaultValue={b?.referral ?? ""}>
            <option value="">—</option>
            {BOOKING.referralOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
            {b?.referral && !(BOOKING.referralOptions as readonly string[]).includes(b.referral) && <option>{b.referral}</option>}
          </select>
        </F>
        <F label="Promo code" name="promoCode" defaultValue={b?.promoCode} />
      </div>
      <F label="Client notes" name="notes">
        <textarea id="notes" name="notes" defaultValue={b?.notes ?? ""} />
      </F>
      <F label="Private admin notes" name="adminNotes" hint="Only you see these.">
        <textarea id="adminNotes" name="adminNotes" defaultValue={b?.adminNotes ?? ""} />
      </F>

      <h3>Pricing</h3>
      <div className="ad-row">
        <F label="Nightly rate ($)" name="nightlyRate" inputMode="decimal" defaultValue={centsToInput(b?.nightlyRateCents ?? BOOKING.nightlyRateCents)} />
        <F label="Package" name="package">
          <select id="package" name="package" defaultValue={b?.package ?? "escape"}>
            <option value="escape">{BOOKING.packages.escape.label}</option>
            <option value="lux">{BOOKING.packages.lux.label}</option>
          </select>
        </F>
        <F
          label="Package add-on ($)"
          name="packagePrice"
          inputMode="decimal"
          defaultValue={centsToInput(b?.packageCents ?? 0)}
          hint="Extra charged for The Lux"
        />
      </div>
      <div className="ad-row">
        <F
          label="Delivery miles (one way)"
          name="deliveryMiles"
          inputMode="decimal"
          defaultValue={b?.deliveryMiles}
          hint={`From ${BOOKING.delivery.originLabel}. Free ≤ ${BOOKING.delivery.freeRadiusMiles} mi; then ${dollars(BOOKING.delivery.feeCents)} + ${dollars(
            BOOKING.delivery.perMileCents
          )}/mi${b?.deliveryMilesEstimated ? ". Current value is an automatic estimate." : ""}`}
        />
        <F label="Delivery fee override ($)" name="deliveryFee" inputMode="decimal" defaultValue={centsToInput(b?.deliveryOverrideCents)} hint="Leave blank to calculate from miles" />
      </div>
      <div className="ad-row">
        <F label="Discount ($)" name="discount" inputMode="decimal" defaultValue={centsToInput(b?.discountCents ?? 0)} />
        <F label="Discount reason" name="discountNote" defaultValue={b?.discountNote} placeholder="e.g. repeat client" />
      </div>
      <div className="ad-row">
        <F label="Extras ($)" name="extras" inputMode="decimal" defaultValue={centsToInput(b?.extrasCents ?? 0)} />
        <F label="Extras description" name="extrasNote" defaultValue={b?.extrasNote} placeholder="e.g. firewood bundle" />
      </div>
      <label className="ad-checkline">
        <input type="checkbox" name="bonusNight" defaultChecked={b?.bonusNight ?? false} /> Bonus night free (subtracts one night)
      </label>
      <label className="ad-checkline">
        <input type="checkbox" name="force" /> Book anyway, even if the dates overlap another booking or blocked dates
      </label>
    </>
  );
}
