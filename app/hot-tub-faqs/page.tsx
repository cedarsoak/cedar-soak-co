import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyCta from "@/components/StickyCta";

export const metadata: Metadata = {
  title: "FAQs | Cedar Soak Co.",
  description: "Everything you need to know about renting a wood-fired or electric cedar hot tub from Cedar Soak Co.",
};

const FAQS = [
  {
    q: "What types of hot tubs do you offer for rental?",
    a: "We offer three types: Wood-Fire hot tubs for a rustic, eco-friendly experience with traditional wood-burning heating; Electric hot tubs for modern, energy-efficient convenience that heat up at the touch of a button; and Hybrid models that combine both wood and electric options. All are built on trailers for easy mobile delivery.",
  },
  {
    q: "How much does it cost to rent a hot tub?",
    a: "The daily rate is $249, with a 3-day minimum. Understand that the first day will require roughly 2.5 hours to fill the unit and another 6–10 hours to heat, depending on the external temperature and water temperature.",
  },
  {
    q: "How far does Cedar Soak Co. deliver in Ohio?",
    a: "We deliver throughout the Dayton metro area, including Kettering, Beavercreek, Centerville, Miamisburg, Huber Heights, and surrounding communities. Contact us to confirm delivery availability to your location.",
  },
  {
    q: "How does the delivery and setup process work?",
    a: "We'll deliver the hot tub to your specified location, set it up (drop-off and level), and fill it with water from an on-site source (like a garden hose). At the end of your rental, we drain the water on-site and haul it away — no hassle for you. We do ask that the last burn is done the night before to give time to cool before draining.",
  },
  {
    q: "Do I need special hookups for the hot tub?",
    a: "For our electric setup, you'll need a standard 15-amp outlet nearby. Our wood-fired hot tub requires no electricity at all — just wood and water.",
  },
  {
    q: "How many people fit in the hot tub?",
    a: "Our hot tub comfortably fits 4–6 people, making it perfect for couples, small groups, and family gatherings.",
  },
  {
    q: "What is the minimum or maximum rental period?",
    a: "We offer flexible short-term rentals starting from a weekend up to a week or more. Perfect for romantic getaways, parties, or weekends. There's no strict maximum, but longer rentals may require special arrangements — contact us for options.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Cancellations made at least 7 days before your delivery date will receive a full refund of your deposit. For cancellations within 7 days, the deposit may be forfeited or partially refunded depending on circumstances. Please notify us as soon as possible to discuss.",
  },
  {
    q: "Are your hot tubs safe to use?",
    a: "Absolutely. All our hot tubs are designed with safety in mind. We recommend supervising children at all times, avoiding use if you have certain medical conditions (consult a doctor), and not exceeding recommended temperatures (typically 100–104°F). Follow basic guidelines like no glass near the tub and limiting alcohol consumption. We provide safety tips upon delivery.",
  },
  {
    q: "Is the hot tub clean and sanitary?",
    a: "Absolutely. Every hot tub is thoroughly drained, scrubbed, and sanitized between every single rental. We take cleanliness seriously so you can relax without worry.",
  },
  {
    q: "What happens if the weather is bad during my rental?",
    a: "Our hot tubs are built to withstand outdoor conditions, and many customers enjoy them in cooler weather. If severe weather (e.g., storms) affects delivery or safety, we'll work with you to reschedule without penalty. Wood-fire models can even provide extra warmth in chilly conditions.",
  },
  {
    q: "Do you offer any add-ons or accessories with rentals?",
    a: "Yes — options may include extra firewood for wood-fire models, aromatherapy scents, LED lighting upgrades, or even delivery of towels and robes. Mention any add-ons when booking for pricing and availability.",
  },
  {
    q: "Can I rent a hot tub for a party or event in Dayton?",
    a: "Yes! We love helping make events special. We've delivered for birthdays, graduation parties, bachelorette weekends, anniversary dinners, and corporate events across Dayton.",
  },
];

export default function FaqPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">FAQs</span>
          <h1>Answers before you soak.</h1>
          <p>Everything people usually ask before booking. Don&apos;t see your question? Reach out directly.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="faq-list">
            {FAQS.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>
                  {item.q}
                  <span className="plus" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="price-band">
            <div className="left">
              <span className="eyebrow" style={{ color: "var(--ember-light)" }}>
                Still have questions?
              </span>
              <div className="big-num" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
                We&apos;re happy to help.
              </div>
              <p>937-604-6399 &middot; cedarsoak@gmail.com</p>
            </div>
            <div className="right">
              <a href="/#book" className="btn btn-primary">
                Request to book
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <StickyCta />
    </>
  );
}
