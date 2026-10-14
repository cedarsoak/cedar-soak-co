import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import {
  AGREEMENT_INTRO,
  AGREEMENT_TITLE,
  AGREEMENT_VERSION,
  GUEST_RELEASE_TEXT,
  SIGNATURE_STATEMENT,
  agreementSections,
} from "@/lib/agreement";

export const metadata: Metadata = {
  title: "Liability Waiver & Rental Agreement | Cedar Soak Co.",
  description:
    "Read the Cedar Soak Co. hot tub rental agreement, release of liability, assumption of risk, and towing addendum that every renter signs before delivery.",
  alternates: { canonical: "/liability-waiver" },
};

// Read-only copy of the agreement customers sign after booking. The text comes
// from lib/agreement.ts, so this page always matches what is actually signed.
export default function LiabilityWaiverPage() {
  // The towing checkbox line is filled in on each renter's signed copy, so it is left off this reference copy.
  const sections = agreementSections().map((s) => ({
    title: s.title,
    blocks: s.blocks.filter((b) => !(b.type === "p" && b.text.startsWith("[ ]"))),
  }));
  return (
    <LegalDoc
      eyebrow="Liability waiver"
      title="Rental Agreement & Liability Waiver"
      lead="This is the agreement every renter signs before we deliver. Read it here any time; you sign your own copy online after you book."
      meta={`${AGREEMENT_TITLE} · Version ${AGREEMENT_VERSION}`}
      current="/liability-waiver"
      sections={sections}
      intro={<p className="legal-callout">{AGREEMENT_INTRO}</p>}
    >
      <p className="legal-callout">{SIGNATURE_STATEMENT}</p>
      <section className="legal-section">
        <h2>Guest Acknowledgment and Release</h2>
        <p>{GUEST_RELEASE_TEXT}</p>
      </section>
    </LegalDoc>
  );
}
