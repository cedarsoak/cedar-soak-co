import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BOOKING } from "@/lib/booking-config";

export const metadata: Metadata = {
  title: "Terms of Service | Cedar Soak Co.",
  description: "The terms for using cedarsoak.co and booking a Cedar Soak Co. hot tub rental: deposits, payment, cancellation, delivery, and safe use.",
  alternates: { canonical: "https://www.cedarsoak.co/terms" },
};

const LAST_UPDATED = "October 3, 2026";

function dollars(cents: number): string {
  const d = cents / 100;
  return `$${Number.isInteger(d) ? d : d.toFixed(2)}`;
}

export default function TermsPage() {
  const phoneHref = `tel:${BOOKING.businessPhone.replace(/[^\d]/g, "")}`;
  const { fallSoak, cedarSoak } = BOOKING.stays;
  const d = BOOKING.delivery;
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Terms</span>
          <h1>Terms of Service</h1>
          <p>The terms for using this site and booking a rental with us.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="legal">
            <p className="legal-updated">Last updated {LAST_UPDATED}</p>

            <p>
              These terms apply when you use cedarsoak.co or book a rental with {BOOKING.businessName} (&ldquo;Cedar Soak,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us&rdquo;). By using the site or booking, you agree to them.
            </p>

            <h2>The rental agreement</h2>
            <p>
              Every rental also requires a signed Rental Agreement and Release of Liability, which you sign online after you book. It covers
              safe use, your responsibility for guests and the equipment, the release of liability, and damage. If these terms and the signed
              Rental Agreement ever disagree, the Rental Agreement controls. We cannot deliver until it is signed.
            </p>

            <h2>Who can book</h2>
            <p>
              You must be at least 18 years old to book and sign. You must own the property where the tub will be set up, or have permission
              from the owner, landlord, venue, or HOA to place and use it there.
            </p>

            <h2>Pricing and payment</h2>
            <ul>
              <li>
                The {fallSoak.name} is {fallSoak.nights} nights for {dollars(fallSoak.priceCents)}. The {cedarSoak.name} is {cedarSoak.nights}{" "}
                nights for {dollars(cedarSoak.priceCents)}. Extra nights are {dollars(BOOKING.nightlyRateCents)} each.
              </li>
              <li>The price shown at checkout is the price for your booking. Prices and offers on the site can change for future bookings.</li>
              <li>
                A {dollars(BOOKING.depositCents)} deposit is due when you book and holds your dates. It is a refundable damage deposit and
                does not count toward the rental price.
              </li>
              <li>The rental balance is due on or before delivery day. We send a secure payment link.</li>
              <li>Payments are processed by Stripe.</li>
              <li>Promo codes and referral credits have their own conditions and are limited to one use per person unless we say otherwise.</li>
            </ul>

            <h2>Deposit and damage</h2>
            <p>
              After pickup we inspect the tub and trailer. If there is no damage, we refund the deposit, usually within 3 to 5 days after
              pickup. You are responsible for loss, theft, or damage beyond normal wear and tear during your rental, including damage caused
              by guests. Costs above the deposit are billed to you as described in the Rental Agreement.
            </p>

            <h2>Cancellations and changes</h2>
            <ul>
              <li>
                Cancel at least {BOOKING.cancellationNoticeHours} hours before your delivery and we refund your deposit in full. Cancel with
                less notice and the deposit is not refunded.
              </li>
              <li>To change your dates, contact us. Changes depend on availability.</li>
              <li>
                We may cancel or end a rental for unsafe conditions, severe weather, a burn ban, or a violation of the Rental Agreement. If we
                cancel before delivery for weather or safety, we will work with you to reschedule or refund what you paid.
              </li>
            </ul>

            <h2>Delivery, setup, and pickup</h2>
            <ul>
              <li>
                Delivery is free within {d.freeRadiusMiles} miles of {d.originLabel}. Beyond that there is a {dollars(d.feeCents)} fee plus{" "}
                {dollars(d.perMileCents)} per mile past {d.freeRadiusMiles} miles. The online figure is an estimate and we confirm it before
                delivery.
              </li>
              <li>
                You provide a firm, level, accessible spot clear of overhead lines and low branches, and an outdoor water spigot for filling.
                Electric heating needs a standard 15-amp outlet nearby.
              </li>
              <li>Plan on about 2.5 hours to fill the tub and 6 to 10 hours to heat it, depending on the weather.</li>
              <li>We pick up the morning after your last night. Please make the last fire the night before so the stove is cool.</li>
              <li>Once we set up the tub, do not move or adjust the trailer.</li>
            </ul>

            <h2>Safe use</h2>
            <p>
              Using a wood-fired hot tub carries real risks, including burns, overheating, and drowning. You agree to follow the Rules of Safe
              Use in the Rental Agreement and to make sure your guests do too. That includes sober adult supervision whenever the tub is in
              use or the fire is burning
              {BOOKING.maxOccupancy ? `, no more than ${BOOKING.maxOccupancy} people in the tub at one time` : ""}, water no hotter than
              104&deg;F, no glass near the tub, and nothing added to the water.
            </p>

            <h2>Text messages</h2>
            <p>
              If you agree to receive texts, we may text you about your booking and occasional Cedar Soak offers. Message frequency varies.
              Message and data rates may apply. Reply STOP to opt out or HELP for help. Agreeing to texts is not required to book. See our{" "}
              <Link href="/privacy">Privacy Policy</Link> for how we handle your phone number.
            </p>

            <h2>Using this site</h2>
            <ul>
              <li>Give accurate information when you inquire or book, and keep the sign-in link for your rental page to yourself.</li>
              <li>Do not misuse the site, try to access another customer&rsquo;s booking, or interfere with how the site works.</li>
              <li>The photos, text, and logo on this site belong to {BOOKING.businessName} and may not be reused without our permission.</li>
              <li>Photos show typical setups. Your setup may look different depending on your space and the package you choose.</li>
            </ul>

            <h2>Disclaimers and limits</h2>
            <p>
              The site is provided as is. We work to keep availability and pricing accurate, but errors can happen, and we may correct them
              and contact you if one affects your booking. To the fullest extent permitted by Ohio law, our liability for anything related to
              the site or a booking is limited to the amount you paid us for that booking. The Rental Agreement sets out the release of
              liability that applies to use of the tub.
            </p>

            <h2>Governing law</h2>
            <p>These terms are governed by Ohio law. Any dispute will be brought in the courts of Montgomery County, Ohio.</p>

            <h2>Changes to these terms</h2>
            <p>
              If we change these terms we will post the new version here and update the date at the top. The terms in place when you booked
              apply to that booking.
            </p>

            <h2>Contact us</h2>
            <p>
              {BOOKING.businessName}, Dayton, Ohio
              <br />
              <a href={`mailto:${BOOKING.businessEmail}`}>{BOOKING.businessEmail}</a> &middot; <a href={phoneHref}>{BOOKING.businessPhone}</a>
            </p>
            <p>
              See also our <Link href="/privacy">Privacy Policy</Link> and <Link href="/hot-tub-faqs">FAQs</Link>.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
