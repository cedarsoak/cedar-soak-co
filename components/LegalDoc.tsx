import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type DocBlock = { type: "p"; text: string } | { type: "ul"; items: string[] } | { type: "h"; text: string };

export interface DocSection {
  title: string;
  blocks: DocBlock[];
}

const LEGAL_LINKS = [
  { href: "/liability-waiver", label: "Liability Waiver" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

/** Shared layout for the Liability Waiver, Terms & Conditions and Privacy Policy pages. */
export default function LegalDoc({
  eyebrow,
  title,
  lead,
  meta,
  current,
  sections,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  meta: string;
  current: string;
  sections: DocSection[];
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <article className="legal-doc">
            <p className="legal-meta">{meta}</p>
            {intro}
            {sections.map((s) => (
              <section key={s.title} className="legal-section">
                <h2>{s.title}</h2>
                {s.blocks.map((b, i) =>
                  b.type === "ul" ? (
                    <ul key={i}>
                      {b.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}>{b.text}</p>
                  )
                )}
              </section>
            ))}
            {children}
            <nav className="legal-nav" aria-label="Legal pages">
              {LEGAL_LINKS.filter((l) => l.href !== current).map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </article>
        </div>
      </section>

      <Footer />
    </>
  );
}
