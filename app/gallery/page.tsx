import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyCta from "@/components/StickyCta";
import GalleryLightbox from "@/components/GalleryLightbox";

export const metadata: Metadata = {
  title: "Gallery | Cedar Soak Co.",
  description: "See Cedar Soak Co.'s handcrafted cedar hot tubs set up in backyards around Dayton, Ohio.",
};

const GALLERY_IMAGES = [
  { src: "/gallery/full/gallery-10.jpg", alt: "Aerial view of the steaming cedar hot tub at dusk with string lights" },
  { src: "/gallery/full/why-cedar-soak-3.jpg", alt: "A couple relaxing together in the cedar hot tub at golden hour" },
  { src: "/gallery/full/built-to-last-front.jpg", alt: "Cedar hot tub deck in daylight with steps, a lantern, and a wine table" },
  { src: "/gallery/full/why-cedar-soak-2.jpg", alt: "Cedar hot tub in daylight surrounded by trees, with a lantern and wine service nearby" },
  { src: "/gallery/full/built-to-last-rear.jpg", alt: "Cedar hot tub at night with the wood-fire chimney against a dusk sky" },
  { src: "/gallery/full/why-cedar-soak-1.jpg", alt: "Cedar hot tub deck at night with string lights, candles, and private lounge seating" },
  { src: "/gallery/full/why-cedar-soak-5.jpg", alt: "Wine and glasses chilling beside the cedar hot tub at night" },
];

export default function GalleryPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Gallery</span>
          <h1>See it in a backyard near you.</h1>
          <p>A look at real Cedar Soak setups — string lights, cedar steam, and quiet evenings. Tap any photo for a closer look.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <GalleryLightbox images={GALLERY_IMAGES} />
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="price-band">
            <div className="left">
              <span className="eyebrow" style={{ color: "var(--ember-light)" }}>
                Ready to book?
              </span>
              <div className="offer-pair">
                <a className="offer" href="/book?nights=2">
                  <span className="offer-name">Fall Soak</span>
                  <span className="offer-nights">2 nights</span>
                  <span className="offer-price">$549</span>
                </a>
                <a className="offer" href="/book?nights=3">
                  <span className="offer-name">Cedar Soak</span>
                  <span className="offer-nights">3 nights</span>
                  <span className="offer-price">$747</span>
                </a>
              </div>
              <p>Both include delivery within 15 miles, setup, a personal walkthrough, and pickup. Extra nights are $249.</p>
            </div>
            <div className="right">
              <a href="/book" className="btn btn-primary">
                Book your dates
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
