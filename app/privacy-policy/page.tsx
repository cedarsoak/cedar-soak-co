import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { LEGAL_EFFECTIVE_DATE, privacySections } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Cedar Soak Co.",
  description:
    "How Cedar Soak Co. collects, uses, and protects your personal information when you visit cedarsoak.co or book a hot tub rental.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc
      eyebrow="Privacy policy"
      title="Privacy Policy"
      lead="What we collect when you visit or book, how we use it, and the choices you have."
      meta={`Effective ${LEGAL_EFFECTIVE_DATE}`}
      current="/privacy-policy"
      sections={privacySections()}
    />
  );
}
