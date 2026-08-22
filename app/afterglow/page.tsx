import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import ScrollReveal from "@/components/ScrollReveal";
import PhotoCardCarousel from "@/components/PhotoCardCarousel";

export const metadata: Metadata = {
  title: "The Afterglow | A Newlywed Retreat by Cedar Soak Co.",
  description:
    "A private cedar hot tub retreat for newlyweds, on their own schedule. Book it yourselves or give it as a wedding gift — use code AFTERGLOW for one night free.",
  robots: { index: false, follow: false },
};

const AFTER_CARDS = [
  {
    tag: "Private",
    title: "Just the two of you",
    body: "No guest list, no schedule to keep. Just your own backyard, warm water, and each other.",
  },
  {
    tag: "Effortless",
    title: "Ready whenever you are",
    body: "We deliver, fill, and fire it up on your timeline &mdash; no lifting, no plumbing, no setup on your end.",
  },
  {
    tag: "Romantic",
    title: "Built for slowing down",
    body: "Cedar walls and warm light &mdash; the kind of quiet that's hard to find during wedding season, or any season.",
  },
];

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 3C16 3 8 12 8 19C8 23.4183 11.5817 27 16 27C20.4183 27 24 23.4183 24 19C24 12 16 3 16 3Z"
        stroke="#C97C3D"
        strokeWidth="1.6"
      />
      <path
        d="M16 12C16 12 12 17 12 20.5C12 22.9853 13.7909 25 16 25C18.2091 25 20 22.9853 20 20.5C20 17 16 12 16 12Z"
        fill="#C97C3D"
      />
    </svg>
  );
}

export default function AfterglowPage() {
  return (
    <div className="afterglow-scope">
      <header className="afterglow-header">
        <div className="wrap">
          <Link href="/afterglow" className="logo">
            <LogoMark />
            Cedar Soak Co.
          </Link>
          <a href="#book" className="btn btn-primary">
            Reserve now
          </a>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="afterglow-hero">
        <div className="ring-pattern-bg" aria-hidden="true"></div>
        <div className="wrap">
          <div className="afterglow-hero-content">
            <span className="eyebrow">For newlyweds &middot; Dayton, Ohio</span>
            <h1>
              Married.
              <br />
              Now, exhale.
            </h1>
            <p className="sub">
              A private cedar hot tub, delivered to your own backyard whenever you&apos;re ready to slow down
              together &mdash; the week after the wedding, mid-honeymoon staycation, or the weekend you finally
              unpack the last box.
            </p>

            <div className="promo-chip">
              <span className="amt">+1 night free</span>
              <span className="lbl">book with code AFTERGLOW</span>
            </div>

            <div className="cta-row">
              <a href="#book" className="btn btn-primary">
                Reserve your afterglow
              </a>
              <a href="#why-soak" className="btn btn-ghost" style={{ borderColor: "rgba(30,23,18,0.2)", color: "var(--text-dark)" }}>
                Why newlyweds soak
              </a>
            </div>

            <div className="trust-strip">
              <span>Delivered on your schedule</span>
              <span>Zero setup for you</span>
              <span>Just the two of you</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY NEWLYWEDS SOAK ============ */}
      <section id="why-soak">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Why newlyweds soak</span>
            <h2>The wedding had a hundred guests. This has two.</h2>
            <p className="sub">
              Whether it&apos;s the week after, mid-honeymoon, or the weekend you move in together &mdash; the best
              gift you can give each other is nothing to do and nowhere to be.
            </p>
          </div>

          <PhotoCardCarousel cards={AFTER_CARDS} />
        </div>
      </section>

      {/* ============ PRICING + OFFER ============ */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="promo-band reveal">
            <div className="ring-pattern-bg" aria-hidden="true"></div>
            <div className="left">
              <span className="eyebrow">Newlywed rate</span>
              <div className="big-num">
                $747
                <span className="unit">
                  / <span className="price-strike">3</span>{" "}
                  <span className="price-fix">4</span> nights
                </span>
              </div>
              <p>
                Every escape includes delivery, setup, a personal walkthrough, and pickup &mdash; no plumbing, no
                permits. Book with code AFTERGLOW and we&apos;ll add that fourth night ourselves, completely free,
                whenever you decide to redeem it.
              </p>
            </div>
            <div className="right">
              <div className="promo-code-ticket">
                <span className="lbl">Use code</span>
                <span className="code">AFTERGLOW</span>
              </div>
              <a href="#book" className="btn btn-primary" style={{ width: "100%" }}>
                Reserve now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GIFT IT ============ */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="gift-band reveal">
            <span className="eyebrow">Also a great gift</span>
            <h2>Skip the toaster. Give them a night to breathe.</h2>
            <p>
              Parent of the bride, favorite sibling, the friend who always overdelivers &mdash; if you&apos;re
              hunting for a gift that isn&apos;t already sitting on the registry, this is it. Reach out, mention
              who it&apos;s for, and we&apos;ll coordinate delivery and timing directly with the happy couple.
              Surprise them with it, or let them pick the date &mdash; either way, code AFTERGLOW still gets them
              one night free.
            </p>
            <div className="cta-row">
              <a href="#book" className="btn btn-primary">
                Give the gift
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BOOKING FORM ============ */}
      <section id="book" style={{ background: "var(--blush-light)" }}>
        <div className="wrap">
          <div className="form-wrap">
            <div className="form-side reveal">
              <span className="eyebrow">Reserve your afterglow</span>
              <h2>Tell us who it&apos;s for.</h2>
              <p>
                Booking it for yourselves, or setting it up as a gift &mdash; share your preferred dates and
                we&apos;ll confirm availability and delivery details within one business day.
              </p>
              <div className="form-meta">
                <div className="row">
                  <span className="dot"></span> Serving Dayton, Kettering, Beavercreek, Centerville, Miamisburg, Huber
                  Heights &amp; surrounding communities.
                </div>
                <div className="row">
                  <span className="dot"></span> 937-604-6399 &middot; cedarsoak@gmail.com
                </div>
                <div className="row">
                  <span className="dot"></span> Most weekends book several weeks in advance &mdash; reserve early,
                  redeem whenever you&apos;re ready.
                </div>
              </div>
            </div>

            <BookingForm promoCode="AFTERGLOW" source="Afterglow (wedding) landing page" />
          </div>
        </div>
      </section>

      <Footer />

      <ScrollReveal />
    </div>
  );
}
