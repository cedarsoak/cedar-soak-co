import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import ScrollReveal from "@/components/ScrollReveal";
import PhotoCardCarousel from "@/components/PhotoCardCarousel";

export const metadata: Metadata = {
  title: "The Afterglow | A Newlywed Retreat by Cedar Soak Co.",
  description:
    "A private cedar hot tub delivered to your backyard the day after your wedding. Book with code AFTERGLOW for one additional night free.",
  robots: { index: false, follow: false },
};

const AFTER_CARDS = [
  {
    tag: "Private",
    title: "Just the two of you",
    body: "No toasts, no schedule, no in-laws. Just your own backyard, warm water, and each other.",
  },
  {
    tag: "Effortless",
    title: "Ready before you get home",
    body: "We deliver, fill, and fire it up while you're still at the reception. You won't lift a finger on your wedding night.",
  },
  {
    tag: "Romantic",
    title: "Built for the evening after",
    body: "Cedar walls, warm light, and the kind of quiet that's hard to find during wedding season.",
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
            <span className="eyebrow">An offer for newlyweds &middot; Dayton, Ohio</span>
            <h1>
              Married.
              <br />
              Now, exhale.
            </h1>
            <p className="sub">
              A private cedar hot tub, delivered to your own backyard the day after your wedding &mdash; so the very
              first thing you do as a married couple is absolutely nothing.
            </p>

            <div className="promo-chip">
              <span className="amt">+1 night free</span>
              <span className="lbl">book with code AFTERGLOW</span>
            </div>

            <div className="cta-row">
              <a href="#book" className="btn btn-primary">
                Reserve your afterglow
              </a>
              <a href="#why-after" className="btn btn-ghost" style={{ borderColor: "rgba(30,23,18,0.2)", color: "var(--text-dark)" }}>
                Why the day after
              </a>
            </div>

            <div className="trust-strip">
              <span>Delivered day-after</span>
              <span>Zero setup for you</span>
              <span>Just the two of you</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY THE DAY AFTER ============ */}
      <section id="why-after">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Why the day after</span>
            <h2>The wedding had a hundred guests. This has two.</h2>
            <p className="sub">
              After months of planning and one very big day, the best gift you can give each other is nothing to do
              and nowhere to be.
            </p>
          </div>

          <PhotoCardCarousel cards={AFTER_CARDS} />
        </div>
      </section>

      {/* ============ PROMO BAND ============ */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="promo-band reveal">
            <div className="ring-pattern-bg" aria-hidden="true"></div>
            <div className="left">
              <span className="eyebrow">Newlywed offer</span>
              <div className="headline">One extra night.</div>
              <p>
                Book your post-wedding retreat with code AFTERGLOW and we&apos;ll add a full extra night &mdash;
                completely free. Our gift to your first days as a married couple.
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

      {/* ============ BOOKING FORM ============ */}
      <section id="book" style={{ background: "var(--blush-light)" }}>
        <div className="wrap">
          <div className="form-wrap">
            <div className="form-side reveal">
              <span className="eyebrow">Reserve your afterglow</span>
              <h2>Tell us about your big day.</h2>
              <p>
                Share your wedding date and preferred delivery window, and we&apos;ll confirm availability and
                delivery details within one business day.
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
                  <span className="dot"></span> Most fall wedding weekends book several weeks in advance &mdash;
                  reserve early.
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
