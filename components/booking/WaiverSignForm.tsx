"use client";

import "./booking.css";
import { useState } from "react";
import AgreementSigner, { emptyWaiver, waiverProblem, WaiverState } from "./AgreementSigner";

interface Props {
  token: string;
  alreadySigned: boolean;
  details: { label: string; value: string }[];
  accountUrl?: string;
}

export default function WaiverSignForm({ token, alreadySigned, details, accountUrl }: Props) {
  const [waiver, setWaiver] = useState<WaiverState>(emptyWaiver);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    const problem = waiverProblem(waiver);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/waiver/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiver }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="bk">
        <div className="bk-done">
          <h2>Signed — thank you!</h2>
          <p>We&apos;ve saved your signed rental agreement and emailed you a copy. See you on delivery day.</p>
          {accountUrl && (
            <p style={{ marginTop: 18 }}>
              <a className="btn btn-primary" href={accountUrl}>
                View my rental
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bk">
      {alreadySigned && (
        <p className="bk-fine" style={{ marginTop: 0, marginBottom: 16 }}>
          We already have a signed agreement on file for this booking. You only need to sign again if we asked you to.
        </p>
      )}
      <AgreementSigner value={waiver} onChange={setWaiver} details={details} />
      {error && (
        <p className="bk-error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="btn btn-primary bk-next" style={{ width: "100%" }} onClick={submit} disabled={busy}>
        {busy ? "Saving…" : "Sign agreement"}
      </button>
    </div>
  );
}
