"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const SLIDES = [
  {
    src: "/gallery/gallery-08.jpg",
    alt: "Cedar hot tub deck entrance at dusk",
  },
  {
    src: "/gallery/gallery-04.jpg",
    alt: "Close view of the cedar hot tub's stainless bands",
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
