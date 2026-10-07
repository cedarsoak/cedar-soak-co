import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { LEGAL_EFFECTIVE_DATE, termsSections } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions | Cedar Soak Co.",
  description:
    "Terms and conditions for using cedarsoak.co and booking a mobile cedar hot tub rental with Cedar Soak Co. in Dayton, Ohio: payment, deposit, delivery, and cancellations.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Terms & conditions"
      title="Terms & Conditions"
      lead="The terms for using this website and booking a rental with Cedar Soak Co."
      meta={`Effective ${LEGAL_EFFECTIVE_DATE}`}
      current="/terms"
      sections={termsSections()}
    />
  );
}
