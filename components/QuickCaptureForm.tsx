"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function QuickCaptureForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          email: formData.get("email"),
          website: formData.get("website"), // honeypot
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="qc-success" role="status">
        <h3>You&apos;re on the list.</h3>
        <p>We&apos;ll follow up by email shortly with pricing and availability.</p>
      </div>
    );
  }

  return (
    <form className="quick-form" onSubmit={handleSubmit}>
      <input
        type="text"
        name="firstName"
        placeholder="First name"
        required
        aria-label="First name"
      />
      <input
        type="email"
        name="email"
        placeholder="Email address"
        required
        aria-label="Email address"
      />
      {/* Honeypot field — hidden from real users, catches basic bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />
      <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Get pricing & availability"}
      </button>
      <span className="qc-fineprint">
        {status === "error" ? (
          <span style={{ color: "var(--ember)" }}>{errorMessage}</span>
        ) : (
          <>
            No spam &mdash; just help planning your soak. You can also skip ahead to the{" "}
            <a href="#book" style={{ color: "var(--ember-light)", textDecoration: "underline" }}>
              full booking form
            </a>
            .
          </>
        )}
      </span>
    </form>
  );
}
