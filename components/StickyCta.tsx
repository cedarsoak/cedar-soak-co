"use client";

import { useEffect, useState } from "react";

export default function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".hero") as HTMLElement | null;
    const threshold = hero ? hero.offsetTop + hero.offsetHeight : 400;

    const onScroll = () => setShow(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`sticky-cta${show ? " show" : ""}`}>
      <div className="info">
        Starting at
        <strong>$747 / 3 nights</strong>
      </div>
      <a href="#book" className="btn btn-primary">
        Request to book
      </a>
    </div>
  );
}
