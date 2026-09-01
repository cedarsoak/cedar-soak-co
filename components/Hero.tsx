import Image from "next/image";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <div className="hero-img hero-img-desktop">
          <Image src="/hero-desktop.png" alt="Cedar Soak cedar hot tub set up at dusk with string lights" fill style={{ objectFit: "cover" }} sizes="100vw" quality={90} priority />
        </div>
        <div className="hero-img hero-img-mobile">
          <Image src="/hero-mobile.png" alt="Cedar Soak cedar hot tub set up at dusk with string lights" fill style={{ objectFit: "cover" }} sizes="100vw" quality={90} priority />
        </div>
      </div>

      <div className="wrap hero-cta-bar">
        <a href="#book" className="btn btn-primary">
          Request to book
        </a>
        <a href="#how-it-works" className="btn btn-ghost" style={{ borderColor: "rgba(30,23,18,0.25)", color: "var(--text-dark)" }}>
          See how it works
        </a>
      </div>
    </section>
  );
}
