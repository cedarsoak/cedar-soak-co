import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroVideo from "@/components/HeroVideo";
import QuickCaptureForm from "@/components/QuickCaptureForm";
import BookingForm from "@/components/BookingForm";
import StickyCta from "@/components/StickyCta";
import ScrollReveal from "@/components/ScrollReveal";

const STEPS = [
  {
    num: "01",
    title: "Reserve your dates",
    body: "Choose your preferred dates and tell us a bit about your location so we can plan delivery.",
  },
  {
    num: "02",
    title: "We deliver & set up",
    body: "We position the Cedar Soak, begin the fresh-water fill from your outdoor spigot, and prepare the heating system.",
  },
  {
    num: "03",
    title: "Personal walkthrough",
    body: "Before we leave, we show you exactly how to operate and maintain the temperature. It's simple, and we make sure you're comfortable.",
  },
  {
    num: "04",
    title: "Relax",
    body: "Enjoy your private cedar retreat for three nights — date night, a birthday, or nothing at all.",
  },
  {
    num: "05",
    title: "We return",
    body: "We drain the tub in an approved area and haul away the entire setup. No cleanup, no hassle.",
  },
];

const HEAT_OPTIONS = [
  {
    tag: "Traditional",
    title: "Wood-fire",
    body: "The crackle, the glow, the smell of cedar smoke on a cool evening. As real as soaking gets.",
    icon: (
      <path
        d="M12 2C12 2 6 10 6 15C6 18.3137 8.68629 21 12 21C15.3137 21 18 18.3137 18 15C18 10 12 2 12 2Z"
        stroke="#E0A468"
        strokeWidth="1.5"
      />
    ),
  },
  {
    tag: "Effortless",
    title: "Electric",
    body: "Consistent temperature at the touch of a button. Just a standard 15-amp outlet required.",
    icon: (
      <path
        d="M13 2L4 14H12L11 22L20 10H12L13 2Z"
        stroke="#E0A468"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    tag: "Best of both",
    title: "Hybrid",
    body: "Start the fire for ambiance, lean on electric to hold steady. No wrong way to soak.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" stroke="#E0A468" strokeWidth="1.5" />
        <path d="M12 3V12L17 15" stroke="#E0A468" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
];

const WHY_CARDS = [
  {
    size: "big",
    title: "Designed for privacy",
    body: "Handcrafted cedar walls, warm lighting, and the atmosphere of a boutique mountain retreat — right where you already live.",
    icon: (
      <>
        <rect x="3" y="6" width="4.5" height="15" rx="1" stroke="#C97C3D" strokeWidth="1.5" />
        <rect x="9.75" y="3" width="4.5" height="18" rx="1" stroke="#C97C3D" strokeWidth="1.5" />
        <rect x="16.5" y="6" width="4.5" height="15" rx="1" stroke="#C97C3D" strokeWidth="1.5" />
      </>
    ),
  },
  {
    size: "small",
    title: "White-glove delivery",
    body: "We deliver, position, fill, and walk you through it — then return for pickup.",
    icon: (
      <>
        <path
          d="M3 16.5V7a1 1 0 0 1 1-1h9v10.5"
          stroke="#C97C3D"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 10.5h3.6L20 13.6v2.9h-7"
          stroke="#C97C3D"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="17.5" r="1.6" stroke="#C97C3D" strokeWidth="1.4" />
        <circle cx="17" cy="17.5" r="1.6" stroke="#C97C3D" strokeWidth="1.4" />
      </>
    ),
  },
  {
    size: "small",
    title: "Fresh every time",
    body: "Every rental begins with fresh water in a professionally cleaned and sanitized tub.",
    icon: (
      <>
        <path
          d="M12 3C12 3 5.5 11 5.5 15.2C5.5 18.85 8.41 21.5 12 21.5C15.59 21.5 18.5 18.85 18.5 15.2C18.5 11 12 3 12 3Z"
          stroke="#C97C3D"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8.7 15.3C8.7 17.1 10 18.2 11.5 18.2" stroke="#C97C3D" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  },
  {
    size: "small",
    title: "Wood fire + electric",
    body: "Real fire ambiance, electric convenience, or run both together.",
    icon: (
      <>
        <path
          d="M12 21C8.7 21 6.2 18.6 6.2 15.2C6.2 12.4 8.1 11 8.1 8.3C8.1 8.3 10 9.7 10 11.5C10 9.2 9 6.4 12 3.2C12 6.1 13.9 7.1 14.9 9.4C15.5 10.8 15.9 11.9 15.9 14.9C15.9 18.3 15.3 21 12 21Z"
          stroke="#C97C3D"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12.8 12.5L10.6 15.6H12.9L11.2 18.3"
          stroke="#C97C3D"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    size: "big",
    title: "Made for moments that matter",
    body: "Date nights, anniversaries, birthdays, staycations — weekends you'll remember long after the water cools.",
    icon: (
      <path
        d="M12 20.3C12 20.3 4.2 15.4 4.2 9.9C4.2 6.96 6.56 4.7 9.3 4.7C10.68 4.7 11.94 5.36 12 6.4C12.06 5.36 13.32 4.7 14.7 4.7C17.44 4.7 19.8 6.96 19.8 9.9C19.8 15.4 12 20.3 12 20.3Z"
        stroke="#C97C3D"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
];

const OCCASIONS = [
  "Date nights",
  "Birthdays",
  "Anniversaries",
  "Graduations",
  "Girls' weekends",
  "Staycations",
  "Family gatherings",
];

export default function HomePage() {
  return (
    <>
      <Header />

      <HeroVideo />

      {/* ============ QUICK CAPTURE ============ */}
      <section className="quick-capture">
        <div className="wrap">
          <div className="qc-copy">
            <h3>Check availability in 30 seconds.</h3>
            <p>Leave your name and email and we&apos;ll follow up with dates, pricing, and delivery details.</p>
          </div>
          <QuickCaptureForm />
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">The process</span>
            <h2>Five steps between you and the water.</h2>
            <p className="sub">
              No plumbing, no permits, no guesswork &mdash; we handle the setup so your weekend starts the moment we
              drive away.
            </p>
          </div>

          <div className="steps">
            {STEPS.map((step, i) => (
              <div className="step reveal" key={step.num}>
                {i < STEPS.length - 1 && <div className="step-line"></div>}
                <div className="step-num">{step.num}</div>
                <div className="step-body">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HEAT OPTIONS ============ */}
      <section id="heat" className="section-dark on-dark">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Choose your heat</span>
            <h2>Wood fire, electric, or both.</h2>
            <p className="sub" style={{ color: "var(--text-light-soft)" }}>
              Every rental is built the same way &mdash; how you bring it to temperature is up to you.
            </p>
          </div>

          <div className="heat-grid">
            {HEAT_OPTIONS.map((opt) => (
              <div className="heat-card reveal" key={opt.title}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {opt.icon}
                </svg>
                <span className="tag">{opt.tag}</span>
                <h3>{opt.title}</h3>
                <p>{opt.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY CEDAR SOAK ============ */}
      <section id="why">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Why cedar soak</span>
            <h2>More than a hot tub &mdash; a retreat delivered to you.</h2>
            <p className="sub">
              From the handcrafted cedar atmosphere to the personalized setup, every detail is designed to make your
              weekend feel effortless.
            </p>
          </div>

          <div className="why-grid">
            {WHY_CARDS.map((card) => (
              <div className={`why-card ${card.size} reveal`} key={card.title}>
                <div className="icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {card.icon}
                  </svg>
                </div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ OCCASIONS ============ */}
      <section className="section-pine on-dark" style={{ padding: "64px 0" }}>
        <div className="wrap">
          <span className="eyebrow" style={{ color: "var(--ember-light)", marginBottom: 20, display: "inline-flex" }}>
            Perfect for
          </span>
          <div className="occasion-scroll" style={{ marginTop: 18 }}>
            {OCCASIONS.map((occasion) => (
              <span className="occasion-chip" key={occasion}>
                {occasion}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GALLERY TEASER ============ */}
      <section id="gallery">
        <div className="wrap">
          <div
            className="section-head reveal"
            style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20, maxWidth: "100%" }}
          >
            <div>
              <span className="eyebrow">Made for the moment</span>
              <h2 style={{ marginTop: 14 }}>See it in a backyard near you.</h2>
            </div>
            <a href="/gallery" className="btn btn-ghost" style={{ borderColor: "rgba(30,23,18,0.25)", color: "var(--text-dark)" }}>
              View full gallery
            </a>
          </div>
          <div className="gallery-grid reveal">
            <div className="g-item">
              <Image src="/gallery/gallery-10.jpg" alt="Aerial view of the steaming cedar hot tub at dusk with string lights" fill className="g-item-img" style={{ objectFit: "cover" }} sizes="(max-width: 640px) 100vw, 50vw" />
            </div>
            <div className="g-item">
              <Image src="/gallery/gallery-02.jpg" alt="Cedar hot tub with wood-fire stove chimney" fill className="g-item-img" style={{ objectFit: "cover" }} sizes="(max-width: 640px) 50vw, 25vw" />
            </div>
            <div className="g-item">
              <Image src="/gallery/gallery-01.jpg" alt="Cedar Soak hot tub deck set up at dusk with string lights" fill className="g-item-img" style={{ objectFit: "cover" }} sizes="(max-width: 640px) 50vw, 25vw" />
            </div>
            <div className="g-item">
              <Image src="/gallery/gallery-06.jpg" alt="Cedar hot tub deck seating area with lanterns and pillows" fill className="g-item-img" style={{ objectFit: "cover" }} sizes="(max-width: 640px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICE BAND ============ */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="price-band reveal">
            <div className="left">
              <span className="eyebrow" style={{ color: "var(--ember-light)" }}>
                Starting rate
              </span>
              <div className="big-num">
                $747<sup>/ 3 nights</sup>
              </div>
              <p>Every escape includes delivery, setup, a personal walkthrough, and pickup. No hidden fees, no plumbing required.</p>
            </div>
            <div className="right">
              <a href="#book" className="btn btn-primary">
                Request to book
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BOOKING FORM ============ */}
      <section id="book" className="form-section">
        <div className="wrap">
          <div className="form-wrap">
            <div className="form-side reveal">
              <span className="eyebrow">Get in touch</span>
              <h2>Tell us about your escape.</h2>
              <p>Share your preferred dates and location, and we&apos;ll confirm availability and delivery details within one business day.</p>
              <div className="form-meta">
                <div className="row">
                  <span className="dot"></span> Serving Dayton, Kettering, Beavercreek, Centerville, Miamisburg, Huber
                  Heights &amp; surrounding communities.
                </div>
                <div className="row">
                  <span className="dot"></span> 937-604-6399 &middot; cedarsoak@gmail.com
                </div>
                <div className="row">
                  <span className="dot"></span> Most weekends book 1&ndash;2 weeks in advance.
                </div>
              </div>
            </div>

            <BookingForm />
          </div>
        </div>
      </section>

      <Footer />

      <StickyCta />
      <ScrollReveal />
    </>
  );
}
