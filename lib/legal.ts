// Text of the public Terms & Conditions and Privacy Policy pages (/terms and
// /privacy-policy). Prices, deposit and notice periods are read from
// booking-config.ts so these pages stay in step with the booking page.
// The same wording is kept as Google Docs in the Cedar Soak Drive "Legal" folder —
// if you change one, change the other, and update LEGAL_EFFECTIVE_DATE.

import { BOOKING } from "./booking-config";

export const LEGAL_EFFECTIVE_DATE = "October 7, 2026";

export type LegalBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

function money(cents: number): string {
  const d = cents / 100;
  return `$${Number.isInteger(d) ? d : d.toFixed(2)}`;
}

const contactLine = `${BOOKING.businessName}, Dayton, Ohio · ${BOOKING.businessPhone} · ${BOOKING.businessEmail}`;

export function termsSections(): LegalSection[] {
  const d = BOOKING.delivery;
  const s = BOOKING.stays;
  return [
    {
      title: "1. About these terms",
      blocks: [
        {
          type: "p",
          text: `These Terms and Conditions apply when you use cedarsoak.co or book a hot tub rental with ${BOOKING.businessName} (“Cedar Soak,” “we,” “us”). By using the site or placing a booking, you agree to them. If you do not agree, please do not use the site or book a rental.`,
        },
        {
          type: "p",
          text: "Every rental is also covered by our Rental Agreement and Liability Waiver, which the renter signs before delivery. If these terms and the signed Rental Agreement ever conflict, the signed Rental Agreement controls.",
        },
      ],
    },
    {
      title: "2. Booking a rental",
      blocks: [
        {
          type: "ul",
          items: [
            "You must be at least 18 years old to book, and the information you give us (name, contact details, delivery address, dates) must be accurate.",
            "A booking is confirmed once your deposit is paid and you receive a confirmation from us. Dates are held for a short time while you complete payment and are released if payment is not completed.",
            "The renter must sign the Rental Agreement and Liability Waiver before we deliver. We may cancel a booking, and refund what you have paid, if it is not signed.",
            "We may decline or cancel a booking if the delivery location is unsafe, cannot be reached with the trailer, or is outside the area we serve.",
          ],
        },
      ],
    },
    {
      title: "3. Prices and payment",
      blocks: [
        {
          type: "ul",
          items: [
            `Current prices are shown on the booking page. As of the effective date, the ${s.fallSoak.name} is ${s.fallSoak.nights} nights for ${money(s.fallSoak.priceCents)}, the ${s.cedarSoak.name} is ${s.cedarSoak.nights} nights for ${money(s.cedarSoak.priceCents)}, and each additional night is ${money(BOOKING.nightlyRateCents)}. Prices can change, but the price shown when you book is the price you pay for that booking.`,
            `A ${money(BOOKING.depositCents)} deposit is collected online to hold your dates. It is a refundable damage deposit, separate from the rental price.`,
            "The rental balance is due on or before delivery day. We send a secure payment link.",
            "Payments are processed by Stripe. We do not see or store your full card number.",
            "Add-ons, such as packages or firewood, are charged at the price shown when you add them.",
          ],
        },
      ],
    },
    {
      title: "4. Delivery, setup and pickup",
      blocks: [
        {
          type: "ul",
          items: [
            `Delivery is included within ${d.freeRadiusMiles} miles of ${d.originLabel}. Beyond that, a ${money(d.feeCents)} fee plus ${money(d.perMileCents)} per additional mile applies. The online figure is an estimate; we confirm the final delivery fee with you before it is charged.`,
            "We deliver, level and set up the tub and walk you through how to use it. At the end of the rental we drain it and haul it away.",
            "You provide a firm, level spot the trailer can reach, a water source such as a garden hose, and, for electric heat, a standard 15-amp outlet nearby.",
            "You confirm that you own the property or have permission from the owner, landlord, venue or HOA for the tub to be placed and used there.",
            "Delivery and pickup times are scheduled windows. An adult must be present at delivery for the walkthrough.",
          ],
        },
      ],
    },
    {
      title: "5. Cancellations, changes and refunds",
      blocks: [
        {
          type: "ul",
          items: [
            `Cancel at least ${BOOKING.cancellationNoticeHours} hours before your delivery date and your deposit is refunded in full. With less than ${BOOKING.cancellationNoticeHours} hours' notice, the deposit is forfeited.`,
            "To change your dates, contact us as early as you can. Changes depend on availability.",
            "Weather before delivery: if severe weather, a burn ban or another safety problem is expected, we will first work with you to reschedule. A refund is a last resort, offered only if we cannot reschedule your rental. Cedar Soak decides, at its sole discretion, whether conditions justify rescheduling or cancelling.",
            "Weather during your rental: once the tub has been delivered, we do not offer refunds for severe weather, a burn ban, or nights you choose not to use. We may, at our discretion, offer a rain check toward a future rental.",
            "After pickup, the damage deposit is refunded, less the cost of any loss or damage beyond normal wear, as described in the Rental Agreement. Refunds go back to the original payment method; your bank may take several business days to show them.",
          ],
        },
      ],
    },
    {
      title: "6. Promo codes and referrals",
      blocks: [
        {
          type: "ul",
          items: [
            "Promo codes and offers have no cash value, apply only to the booking they are used on, and are limited to one use per person unless we say otherwise.",
            `Referral rewards (currently ${money(BOOKING.referral.friendDiscountCents)} for the friend and ${money(BOOKING.referral.referrerCreditCents)} for the person who referred them) are applied as a credit to a rental once the friend's deposit is paid.`,
            "We may change or end any offer at any time. Bookings already confirmed keep the offer they were booked with.",
          ],
        },
      ],
    },
    {
      title: "7. Safe use and your responsibilities",
      blocks: [
        {
          type: "p",
          text: "Hot tubs and wood fires carry real risks. You agree to follow the Rules of Safe Use in the Rental Agreement, to supervise everyone who uses the tub, and to be responsible for your guests and for loss of or damage to the equipment during your rental. The full rules, the assumption of risk and the release of liability are set out in the Rental Agreement and Liability Waiver.",
        },
      ],
    },
    {
      title: "8. Emails and text messages",
      blocks: [
        {
          type: "p",
          text: "When you book or contact us, we send messages about your rental, such as confirmations, payment links and delivery details. If you have given us your contact details for offers, we may also send occasional marketing emails or texts. You can unsubscribe from marketing emails using the link in any email, and stop marketing texts by replying STOP. Message and data rates may apply. Consent to marketing messages is not a condition of booking.",
        },
      ],
    },
    {
      title: "9. Using this website",
      blocks: [
        {
          type: "ul",
          items: [
            "The text, photos, video, logo and design on this site belong to Cedar Soak Co. and may not be copied or reused without our permission.",
            "Do not misuse the site: no attempts to break, overload or gain unauthorized access to it, and no false or fraudulent bookings.",
            "We work to keep the site accurate and available, but it is provided “as is.” Availability shown online can change until your deposit is paid.",
            "Links to other websites are provided for convenience. We are not responsible for their content.",
          ],
        },
      ],
    },
    {
      title: "10. Limits on our liability",
      blocks: [
        {
          type: "p",
          text: "To the fullest extent permitted by Ohio law, Cedar Soak Co. is not liable for indirect, incidental or consequential losses arising from your use of this website or from a booking, and our total liability relating to a booking is limited to the amount you paid us for that booking. Nothing in these terms limits liability that cannot be limited by law. Liability relating to use of the hot tub and trailer is governed by the Rental Agreement and Liability Waiver.",
        },
      ],
    },
    {
      title: "11. Governing law",
      blocks: [
        {
          type: "p",
          text: "These terms are governed by the laws of the State of Ohio. Any dispute will be brought in the courts of Montgomery County, Ohio. If any part of these terms is found unenforceable, the rest remains in effect.",
        },
      ],
    },
    {
      title: "12. Changes to these terms",
      blocks: [
        {
          type: "p",
          text: "We may update these terms from time to time. The version posted on this page, with its effective date, applies to bookings made after that date.",
        },
      ],
    },
    {
      title: "13. Contact us",
      blocks: [{ type: "p", text: contactLine }],
    },
  ];
}

export function privacySections(): LegalSection[] {
  return [
    {
      title: "1. Who we are",
      blocks: [
        {
          type: "p",
          text: `${BOOKING.businessName} (“Cedar Soak,” “we,” “us”) rents mobile cedar hot tubs in the Dayton, Ohio area. This policy explains what personal information we collect through cedarsoak.co and our bookings, how we use it, and the choices you have.`,
        },
      ],
    },
    {
      title: "2. Information we collect",
      blocks: [
        {
          type: "ul",
          items: [
            "Contact details: your name, email address and phone number, when you book, fill out a form, enter a giveaway or contact us.",
            "Booking details: delivery address, rental dates, package and add-ons, heat option, occasion, expected number of guests, how you heard about us, and any notes you send us.",
            "Rental agreement records: your typed initials, drawn signature, the date and time you signed, and the version of the agreement you signed.",
            "Payment information: the amounts you pay and the status of each payment. Card details are entered on Stripe's secure pages and are handled by Stripe; we do not receive or store your full card number.",
            "Messages: emails, texts and form submissions you send us.",
            "Sign-in information: if you use “My rental,” we email you a sign-in link and set a cookie that keeps you signed in.",
            "Website usage information: we use Google Analytics, which uses cookies to collect information such as the pages you visit, how you arrived at the site, your approximate location (city level), and your device and browser type.",
            "Basic technical information that our hosting provider logs automatically, such as IP address, browser type and the pages requested.",
          ],
        },
      ],
    },
    {
      title: "3. How we use your information",
      blocks: [
        {
          type: "ul",
          items: [
            "To take, confirm and manage your booking, and to deliver, set up and pick up the tub.",
            "To estimate delivery distance and any delivery fee from your address.",
            "To collect payments and deposits and to issue refunds.",
            "To keep a record of signed rental agreements.",
            "To send you messages about your rental, and to answer your questions.",
            "To send occasional offers and news by email or text, where you have given us your details for that purpose. You can opt out at any time.",
            "To understand how visitors find and use the website so we can improve it.",
            "To apply promo codes and referral rewards, prevent fraud, keep the site secure, and meet our legal, tax and insurance obligations.",
          ],
        },
      ],
    },
    {
      title: "4. Who we share it with",
      blocks: [
        {
          type: "p",
          text: "We do not sell your personal information. We share it only with the service providers that help us run the business, and only as needed for the work they do for us:",
        },
        {
          type: "ul",
          items: [
            "Stripe, for payment processing.",
            "Resend, for sending booking and sign-in emails.",
            "Brevo, for sending marketing emails and text messages.",
            "Vercel and Neon, which host this website and its booking database.",
            "Google, which provides Google Analytics and receives website usage information.",
            "The U.S. Census Bureau geocoding service, which receives the delivery address (and nothing else) so we can estimate distance.",
          ],
        },
        {
          type: "p",
          text: "We may also disclose information when the law requires it, to our insurer or legal advisers in connection with a claim, or to a successor if the business is sold. Mobile phone numbers and text-message consent are not shared with third parties for their own marketing.",
        },
      ],
    },
    {
      title: "5. Cookies",
      blocks: [
        {
          type: "p",
          text: "This site uses cookies that are needed for it to work, such as the cookie that keeps you signed in to “My rental,” and Google Analytics cookies that help us measure how the site is used. Stripe may set its own cookies on its payment pages to process payments and prevent fraud. We do not use advertising cookies. You can block cookies in your browser settings, or opt out of Google Analytics with Google's opt-out browser add-on at tools.google.com/dlpage/gaoptout.",
        },
      ],
    },
    {
      title: "6. Text messages",
      blocks: [
        {
          type: "p",
          text: "If you give us your mobile number, we may text you about your rental and, where you have agreed, send occasional offers. Message frequency varies. Message and data rates may apply. Reply STOP to stop marketing texts or HELP for help. Opting out of marketing texts does not stop messages needed to carry out a rental you have booked.",
        },
      ],
    },
    {
      title: "7. How long we keep it",
      blocks: [
        {
          type: "p",
          text: "We keep booking, payment and signed-agreement records for as long as we need them for the rental and afterwards for legal, tax and insurance purposes. Marketing contact details are kept until you unsubscribe or ask us to remove them.",
        },
      ],
    },
    {
      title: "8. Your choices",
      blocks: [
        {
          type: "ul",
          items: [
            "Unsubscribe from marketing emails with the link in any email, or reply STOP to a marketing text.",
            "Ask us for a copy of the information we hold about you, or ask us to correct or delete it. We will do so unless we need to keep it for a legal reason, such as a signed rental agreement or a payment record.",
            `To make a request, email ${BOOKING.businessEmail} or call or text ${BOOKING.businessPhone}.`,
          ],
        },
      ],
    },
    {
      title: "9. Security",
      blocks: [
        {
          type: "p",
          text: "We use reputable providers, encrypted connections and access controls to protect your information. No website or online service can be guaranteed completely secure, so please contact us right away if you think your information has been misused.",
        },
      ],
    },
    {
      title: "10. Children",
      blocks: [
        {
          type: "p",
          text: "This website and our rentals are for adults. We do not knowingly collect personal information from children under 13. If you believe a child has given us information, contact us and we will delete it.",
        },
      ],
    },
    {
      title: "11. Changes to this policy",
      blocks: [
        {
          type: "p",
          text: "We may update this policy from time to time. The version posted on this page, with its effective date, is the current one.",
        },
      ],
    },
    {
      title: "12. Contact us",
      blocks: [{ type: "p", text: contactLine }],
    },
  ];
}
