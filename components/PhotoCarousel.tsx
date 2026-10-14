"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const SLIDES = [
  {
    src: "/gallery/built-to-last-rear.jpg",
    alt: "Cedar hot tub at night with the wood-fire chimney against a dusk sky",
  },
  {
    src: "/gallery/built-to-last-front.jpg",
    alt: "Cedar hot tub deck in daylight with steps, a lantern, and a wine table",
  },
];

export default function PhotoCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  };

  return (
    <div className="photo-carousel">
      <div className="pc-track" ref={trackRef} onScroll={handleScroll}>
        {SLIDES.map((slide) => (
          <div className="pc-slide" key={slide.src}>
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              style={{ objectFit: "cover" }}
              sizes="90vw"
            />
          </div>
        ))}
      </div>
      <div className="pc-count">
        {active + 1} / {SLIDES.length}
      </div>
    </div>
  );
}
