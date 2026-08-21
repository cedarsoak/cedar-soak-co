"use client";

import { useEffect, useState } from "react";

export default function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const getThreshold = () => {
      const anchor = document.querySelector("#why") as HTMLElement | null;
      return anchor ? anchor.offsetTop : 600;
    };

    const onScroll = () => setShow(window.scrollY > getThreshold());
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
