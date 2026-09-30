import { BOOKING } from "@/lib/booking-config";
import { dollars } from "@/lib/pricing";

export default function BookingSideCopy({ heading = "Reserve your escape." }: { heading?: string }) {
  return (
    <div className="form-side">
      <span className="eyebrow">Live availability</span>
      <h2>{heading}</h2>
      <p>
        Choose your delivery day, tell us where the tub is going, and a{" "}
        {dollars(BOOKING.depositCents)} deposit locks in your dates instantly.
      </p>
      <div className="form-meta">
        <div className="row">
          <span className="dot"></span> {BOOKING.stays.fallSoak.name}: {BOOKING.stays.fallSoak.nights} nights, {dollars(BOOKING.stays.fallSoak.priceCents)}.{" "}
          {BOOKING.stays.cedarSoak.name}: {BOOKING.stays.cedarSoak.nights} nights, {dollars(BOOKING.stays.cedarSoak.priceCents)}. Extra nights{" "}
          {dollars(BOOKING.nightlyRateCents)}.
        </div>
        <div className="row">
          <span className="dot"></span> Sign the rental agreement online after you book — no printing.
        </div>
        <div className="row">
          <span className="dot"></span> Free delivery within {BOOKING.delivery.freeRadiusMiles} miles of {BOOKING.delivery.originLabel}; beyond
          that {dollars(BOOKING.delivery.feeCents)} + {dollars(BOOKING.delivery.perMileCents)}/mile.
        </div>
        <div className="row">
          <span className="dot"></span> Free cancellation up to {BOOKING.cancellationNoticeHours} hours before delivery.
        </div>
        <div className="row">
          <span className="dot"></span> Questions first? {BOOKING.businessPhone} &middot; {BOOKING.businessEmail}
        </div>
      </div>
    </div>
  );
}
