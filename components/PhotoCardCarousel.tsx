"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type CarouselCard = {
  tag?: string;
  title: string;
  body: string;
  image?: { src: string; alt: string };
};

function PhotoPlaceholder() {
  return (
    <div className="cc-photo-placeholder">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4.5" width="18" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8.5" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M3.5 16.5L8.5 12.5L12.3 15.5L16 11.5L20.5 16"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Photo placeholder</span>
    </div>
  );
}

export default function PhotoCardCarousel({ cards }: { cards: CarouselCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  };

  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(cards.length - 1, index));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="card-carousel">
      <div className="cc-track" ref={trackRef} onScroll={handleScroll}>
        {cards.map((card) => (
          <div className="cc-slide" key={card.title}>
            <div className="cc-slide-media">
              {card.image ? (
                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 640px) 90vw, 520px"
                />
              ) : (
                <PhotoPlaceholder />
              )}
            </div>
            <div className="cc-slide-content">
              {card.tag && <span className="tag">{card.tag}</span>}
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="cc-nav">
        <button
          type="button"
          className="cc-arrow"
          aria-label="Previous"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="cc-progress">
          <div
            className="cc-progress-fill"
            style={{
              width: `${100 / cards.length}%`,
              transform: `translateX(${active * 100}%)`,
            }}
          />
        </div>

        <button
          type="button"
          className="cc-arrow"
          aria-label="Next"
          onClick={() => goTo(active + 1)}
          disabled={active === cards.length - 1}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="cc-count">
        {active + 1} / {cards.length}
      </div>
    </div>
  );
}
