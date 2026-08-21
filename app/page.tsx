import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroVideo from "@/components/HeroVideo";
import QuickCaptureForm from "@/components/QuickCaptureForm";
import BookingForm from "@/components/BookingForm";
import StickyCta from "@/components/StickyCta";
import ScrollReveal from "@/components/ScrollReveal";
import PhotoCarousel from "@/components/PhotoCarousel";
import PhotoCardCarousel from "@/components/PhotoCardCarousel";

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
  },
  {
    tag: "Effortless",
    title: "Electric",
    body: "Consistent temperature at the touch of a button. Just a standard 15-amp outlet required.",
  },
  {
    tag: "Best of both",
    title: "Hybrid",
    body: "Start the fire for ambiance, lean on electric to hold steady. No wrong way to soak.",
  },
];

const WHY_CARDS = [
  {
    title: "Designed for privacy",
    body: "Handcrafted cedar walls, warm lighting, and the atmosphere of a boutique mountain retreat — right where you already live.",
  },
  {
    title: "White-glove delivery",
    body: "We deliver, position, fill, and walk you through it — then return for pickup.",
  },
  {
    title: "Fresh every time",
    body: "Every rental begins with fresh water in a professionally cleaned and sanitized tub.",
  },
  {
    title: "Wood fire + electric",
    body: "Real fire ambiance, electric convenience, or run both together.",
  },
  {
    title: "Made for moments that matter",
    body: "Date nights, anniversaries, birthdays, staycations — weekends you'll remember long after the water cools.",
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

          <PhotoCardCarousel cards={WHY_CARDS} />
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

      {/* ============ CRAFTSMANSHIP ============ */}
      <section>
        <div className="wrap">
          <div className="editorial-row reveal">
            <div className="photo-stack">
              <div className="stack-back">
                <Image
                  src="/gallery/gallery-08.jpg"
                  alt="Cedar hot tub deck entrance at dusk"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 900px) 70vw, 30vw"
                />
              </div>
              <div className="stack-front">
                <Image
                  src="/gallery/gallery-04.jpg"
                  alt="Close view of the cedar hot tub's stainless bands"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 900px) 45vw, 18vw"
                />
              </div>
            </div>
                        <PhotoCarousel />
            <div className="editorial-copy">
              <span className="eyebrow">Built to last</span>
              <h2>Handcrafted, banded, and built for the backyard.</h2>
              <p>
                Every Cedar Soak tub is built from solid cedar staves and wrapped in stainless bands,
                then wood-fired to a perfect soak. It&apos;s the same craftsmanship you&apos;d find at
                a boutique mountain retreat &mdash; just delivered to your own backyard.
              </p>
            </div>
          </div>
        </div>
      </section>
            {/* ============ OCCASIONS ============ */}
      <section className="section-sky" style={{ padding: "64px 0" }}>
        <div className="wrap">
          <span className="eyebrow" style={{ color: "var(--ember)", marginBottom: 20, display: "inline-flex" }}>
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
              <a href="#book" className="btn btn-white">
                Request to book
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HEAT OPTIONS ============ */}
           <section id="heat">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Choose your heat</span>
            <h2>Wood fire, electric, or both.</h2>
            <p className="sub">
              Every rental is built the same way &mdash; how you bring it to temperature is up to you.
            </p>
          </div>

          <PhotoCardCarousel cards={HEAT_OPTIONS} />
        </div>
      </section>

      {/* ============ BOOKING FORM ============ */}
      <section id="book" className="section-sky">
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
