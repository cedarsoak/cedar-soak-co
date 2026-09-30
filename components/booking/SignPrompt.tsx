"use client";

import "./booking.css";
import { useState } from "react";

/** Shown right after payment: sign the rental agreement now, or get the link by email. */
export default function SignPrompt({ token, email }: { token: string; email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function emailMe() {
    setState("sending");
    try {
      const res = await fetch(`/api/waiver/${encodeURIComponent(token)}/email`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "We couldn't send the email.");
      setState("sent");
      setMessage(`Sent to ${data.email || email}. Check your inbox (and spam folder).`);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "We couldn't send the email.");
    }
  }

  return (
    <div className="bk-sign-card">
      <h3>Last step: sign the rental agreement</h3>
      <p>It takes about three minutes on your phone and needs to be done before delivery day.</p>
      <div className="bk-sign-actions">
        <a className="btn btn-primary" href={`/waiver/${encodeURIComponent(token)}`}>
          Sign now
        </a>
        <button type="button" className="bk-ghost-btn" onClick={emailMe} disabled={state === "sending" || state === "sent"}>
          {state === "sending" ? "Sending…" : state === "sent" ? "Link sent" : "Email me the link"}
        </button>
      </div>
      {message && (
        <p className={state === "sent" ? "bk-ok" : "bk-error"} style={{ marginTop: 12, marginBottom: 0 }}>
          {message}
        </p>
      )}
    </div>
  );
}
