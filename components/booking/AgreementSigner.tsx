"use client";

import { AGREEMENT_INTRO, AGREEMENT_TITLE, ESIGN_CONSENT, SIGNATURE_STATEMENT, agreementSections } from "@/lib/agreement";
import SignaturePad from "./SignaturePad";

export interface WaiverState {
  initials: Record<string, string>;
  printedName: string;
  signatureDataUrl: string | null;
  adult: boolean;
  agreed: boolean;
}

export const emptyWaiver: WaiverState = { initials: {}, printedName: "", signatureDataUrl: null, adult: false, agreed: false };

export function waiverProblem(w: WaiverState): string | null {
  const missing = agreementSections().filter((s) => s.initials && (w.initials[s.id] || "").replace(/[^A-Za-z]/g, "").length < 2);
  if (missing.length) return `Add your initials to section ${missing.map((s) => s.title.split(".")[0]).join(", ")}.`;
  if (!w.signatureDataUrl) return "Draw your signature in the box.";
  if (w.printedName.trim().length < 3) return "Type your full name under the signature.";
  if (!w.adult) return "Confirm you are at least 18 years old.";
  if (!w.agreed) return "Check the box to agree to the Rental Agreement.";
  return null;
}

interface Props {
  value: WaiverState;
  onChange: (next: WaiverState) => void;
  details?: { label: string; value: string }[];
}

export default function AgreementSigner({ value, onChange, details }: Props) {
  const sections = agreementSections();
  const set = (patch: Partial<WaiverState>) => onChange({ ...value, ...patch });

  return (
    <div className="bk-agreement">
      <div className="bk-doc" tabIndex={0} aria-label="Rental agreement text">
        <p className="bk-doc-brand">CEDARSOAK CO.</p>
        <h3 className="bk-doc-title">{AGREEMENT_TITLE}</h3>
        <p className="bk-doc-intro">{AGREEMENT_INTRO}</p>
        {details && details.length > 0 && (
          <dl className="bk-doc-details">
            {details.map((d) => (
              <div key={d.label}>
                <dt>{d.label}</dt>
                <dd>{d.value || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
        {sections.map((s) => (
          <section key={s.id} className="bk-doc-section">
            <h4>{s.title}</h4>
            {s.blocks.map((b, i) =>
              b.type === "ul" ? (
                <ul key={i}>
                  {b.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={i} className={b.type === "h" ? "bk-doc-h" : undefined}>
                  {b.text}
                </p>
              )
            )}
            {s.initials && (
              <label className="bk-initials">
                <span>Renter initials</span>
                <input
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={4}
                  value={value.initials[s.id] ?? ""}
                  onChange={(e) => set({ initials: { ...value.initials, [s.id]: e.target.value.toUpperCase() } })}
                  aria-label={`Initials for ${s.title}`}
                />
              </label>
            )}
          </section>
        ))}
        <p className="bk-doc-statement">{SIGNATURE_STATEMENT}</p>
      </div>

      <div className="bk-sign">
        <div className="field">
          <label>Renter signature</label>
          <SignaturePad onChange={(url) => set({ signatureDataUrl: url })} />
        </div>
        <div className="field">
          <label htmlFor="bk-printed">Printed name</label>
          <input
            id="bk-printed"
            type="text"
            autoComplete="name"
            value={value.printedName}
            onChange={(e) => set({ printedName: e.target.value })}
            placeholder="Your full legal name"
          />
        </div>
        <label className="bk-check">
          <input type="checkbox" checked={value.adult} onChange={(e) => set({ adult: e.target.checked })} />
          <span>I am at least 18 years old.</span>
        </label>
        <label className="bk-check">
          <input type="checkbox" checked={value.agreed} onChange={(e) => set({ agreed: e.target.checked })} />
          <span>
            I have read and agree to the Rental Agreement and Release of Liability above. {ESIGN_CONSENT}
          </span>
        </label>
      </div>
    </div>
  );
}
