"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#heat", label: "Heat options" },
  { href: "/#why", label: "Why us" },
  { href: "/gallery", label: "Gallery" },
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

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header id="siteHeader" className={scrolled ? "scrolled" : ""}>
        <div className="wrap">
          <Link href="/#top" className="logo">
            <LogoMark />
            Cedar Soak Co.
          </Link>
          <nav className="primary-nav">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <a href="/#book" className="nav-cta">
              Request to book
            </a>
          </nav>
          <button
            className={`hamburger${menuOpen ? " open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
        <a href="/contact-cedar-soak" onClick={() => setMenuOpen(false)}>
          Contact
        </a>
        <a href="/#book" className="mm-cta" onClick={() => setMenuOpen(false)}>
          Request to book
        </a>
      </div>
    </>
  );
}
