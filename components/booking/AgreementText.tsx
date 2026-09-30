import { AGREEMENT_INTRO, AGREEMENT_TITLE, SIGNATURE_STATEMENT, agreementSections } from "@/lib/agreement";

/** Read-only copy of the rental agreement (preview before paying). */
export default function AgreementText() {
  return (
    <div className="bk-doc" tabIndex={0} aria-label="Rental agreement text">
      <p className="bk-doc-brand">CEDARSOAK CO.</p>
      <h3 className="bk-doc-title">{AGREEMENT_TITLE}</h3>
      <p className="bk-doc-intro">{AGREEMENT_INTRO}</p>
      {agreementSections().map((s) => (
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
              <p key={i}>{b.text}</p>
            )
          )}
        </section>
      ))}
      <p className="bk-doc-statement">{SIGNATURE_STATEMENT}</p>
    </div>
  );
}
