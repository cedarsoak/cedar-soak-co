import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyCta from "@/components/StickyCta";

export const metadata: Metadata = {
  title: "Gallery | Cedar Soak Co.",
  description: "See Cedar Soak Co.'s handcrafted cedar hot tubs set up in backyards around Dayton, Ohio.",
};

export default function GalleryPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Gallery</span>
          <h1>See it in a backyard near you.</h1>
          <p>A look at real Cedar Soak setups — string lights, cedar steam, and quiet evenings.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="gallery-note">
            This page is holding placeholder tiles until real photos are in hand — swap these out
            for actual setup photos as soon as they&apos;re available.
          </div>
          <div className="gallery-full-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div className="g-item" key={i}></div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="price-band">
            <div className="left">
              <span className="eyebrow" style={{ color: "var(--ember-light)" }}>
                Ready to book?
              </span>
              <div className="big-num">
                $747<sup>/ 3 nights</sup>
              </div>
              <p>Every escape includes delivery, setup, a personal walkthrough, and pickup.</p>
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
