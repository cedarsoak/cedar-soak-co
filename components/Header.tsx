"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#heat", label: "Heat options" },
  { href: "/#why", label: "Why us" },
  { href: "/gallery", label: "Gallery" },
];

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
            <Image src="/logo-icon.png" alt="" width={30} height={35} className="logo-mark" priority />
            Cedar Soak
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
