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
    </section>
  );
}
