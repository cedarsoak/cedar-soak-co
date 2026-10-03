import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BOOKING } from "@/lib/booking-config";

export const metadata: Metadata = {
  title: "Privacy Policy | Cedar Soak Co.",
  description: "What information Cedar Soak Co. collects when you inquire about or book a hot tub rental, how we use it, and the choices you have.",
  alternates: { canonical: "https://www.cedarsoak.co/privacy" },
};

const LAST_UPDATED = "October 3, 2026";

export default function PrivacyPage() {
  const phoneHref = `tel:${BOOKING.businessPhone.replace(/[^\d]/g, "")}`;
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Privacy</span>
          <h1>Privacy Policy</h1>
          <p>What we collect when you inquire or book, how we use it, and the choices you have.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="legal">
            <p className="legal-updated">Last updated {LAST_UPDATED}</p>

            <p>
              {BOOKING.businessName} (&ldquo;Cedar Soak,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) rents a mobile cedar hot tub in the Dayton, Ohio
              area. This policy covers the information we collect through cedarsoak.co and when you email, call, or text us.
            </p>

            <h2>Information we collect</h2>
            <ul>
              <li>
                <strong>Inquiries.</strong> Your name, email address, phone number, preferred dates, delivery location, heat preference, and
                anything you write in a message to us.
              </li>
              <li>
                <strong>Bookings.</strong> Your name, email, phone, the address where the tub will be set up, rental dates, package, occasion,
                expected number of guests, how you heard about us, any promo or referral code, and notes you add.
              </li>
              <li>
                <strong>Rental agreement.</strong> Your typed initials, drawn signature, the date and time you signed, and the IP address and
                browser used to sign, which we keep as a record of the signed agreement.
              </li>
              <li>
                <strong>Payments.</strong> Payments are processed by Stripe. We see the amount, the status of the payment, and limited card
                details such as the brand and last four digits. We do not receive or store your full card number.
              </li>
              <li>
                <strong>Site usage.</strong> Pages viewed, approximate location, device and browser type, and how you arrived at the site,
                collected through Google Analytics.
              </li>
            </ul>

            <h2>How we use it</h2>
            <ul>
              <li>To answer your questions and send pricing and availability.</li>
              <li>To hold your dates, plan delivery and pickup, and calculate any delivery fee.</li>
              <li>To take payments, refund deposits, and send receipts and invoices.</li>
              <li>To send booking confirmations, reminders, and messages about your rental.</li>
              <li>To keep a record of signed rental agreements.</li>
              <li>To send occasional offers and news, if you asked to hear from us. You can opt out at any time.</li>
              <li>To understand how the site is used and improve it.</li>
            </ul>

            <h2>Text messages</h2>
            <p>
              We send marketing texts only to people who have agreed to receive them. If you agree, we may text you about your booking and
              occasional Cedar Soak offers. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time, or
              HELP for help. Agreeing to texts is not required to book.
            </p>
            <p>
              We do not sell or share mobile phone numbers or text-message consent with third parties or affiliates for their marketing
              purposes.
            </p>

            <h2>Who we share it with</h2>
            <p>We do not sell your personal information. We share it only with the services that help us run the business:</p>
            <ul>
              <li>Stripe, for payment processing.</li>
              <li>Vercel and Neon, which host the website and the booking database.</li>
              <li>Resend and Brevo, which deliver our emails and text messages.</li>
              <li>Google, for site analytics and for mapping the delivery address.</li>
              <li>The U.S. Census Bureau geocoder, which we use to estimate the delivery distance to your address.</li>
            </ul>
            <p>We may also disclose information when the law requires it, or to protect our rights, our equipment, or someone&rsquo;s safety.</p>

            <h2>Cookies</h2>
            <p>
              The site uses a sign-in cookie that keeps you signed in to your rental page for up to 30 days, and Google Analytics cookies that
              measure site traffic. You can block or delete cookies in your browser settings. The site will still work, but you will need to
              sign in to your rental page again each visit.
            </p>

            <h2>How long we keep it</h2>
            <p>
              We keep booking records, payment records, and signed rental agreements for as long as we need them to run the business and to
              meet tax, insurance, and legal requirements. We keep inquiry and marketing contact details until you ask us to remove them or
              opt out.
            </p>

            <h2>Your choices</h2>
            <ul>
              <li>Unsubscribe from marketing email using the link in any email, and from texts by replying STOP.</li>
              <li>Ask us for a copy of the information we hold about you, or ask us to correct or delete it.</li>
              <li>
                View your booking details on your <Link href="/account">rental page</Link>, and ask us any time for a copy of your signed
                agreement.
              </li>
            </ul>
            <p>
              We may need to keep some records, such as signed agreements and payment history, even after a deletion request, where the law or
              our insurance requires it.
            </p>

            <h2>Security</h2>
            <p>
              The site uses encrypted connections, payments are handled by Stripe, and access to booking records is limited to the owners. No
              website can promise perfect security, so please contact us right away if you think your information has been misused.
            </p>

            <h2>Children</h2>
            <p>The site is intended for adults. You must be at least 18 to book. We do not knowingly collect information from children under 13.</p>

            <h2>Changes to this policy</h2>
            <p>If we change this policy we will post the new version here and update the date at the top.</p>

            <h2>Contact us</h2>
            <p>
              {BOOKING.businessName}, Dayton, Ohio
              <br />
              <a href={`mailto:${BOOKING.businessEmail}`}>{BOOKING.businessEmail}</a> &middot; <a href={phoneHref}>{BOOKING.businessPhone}</a>
            </p>
            <p>
              See also our <Link href="/terms">Terms of Service</Link>.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
