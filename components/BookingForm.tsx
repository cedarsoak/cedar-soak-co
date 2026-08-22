"use client";

import { FormEvent, useState } from "react";
import DateRangePicker from "./DateRangePicker";

type Status = "idle" | "loading" | "success" | "error";

type BookingFormProps = {
  promoCode?: string;
  source?: string;
};

export default function BookingForm({ promoCode, source }: BookingFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("loading");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          dates: formData.get("dates"),
          heatPreference: formData.get("heatPreference"),
          location: formData.get("location"),
          message: formData.get("message"),
          website: formData.get("website"), // honeypot
          promoCode,
          source,
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
      <div className="booking booking-success reveal in" role="status">
        <h3>Request received.</h3>
        <p>Thanks for reaching out &mdash; we&apos;ll confirm availability and delivery details within one business day.</p>
      </div>
    );
  }

  return (
    <form className="booking reveal" onSubmit={handleSubmit}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="fname">First name</label>
          <input type="text" id="fname" name="firstName" placeholder="Jamie" required />
        </div>
        <div className="field">
          <label htmlFor="lname">Last name</label>
          <input type="text" id="lname" name="lastName" placeholder="Rivera" required />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="jamie@email.com" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input type="tel" id="phone" name="phone" placeholder="(937) 555-0148" required />
        </div>
      </div>
      <div className="field-row">
        <DateRangePicker name="dates" label="Preferred dates" />
        <div className="field">
          <label htmlFor="heat-select">Heat preference</label>
          <select id="heat-select" name="heatPreference" defaultValue="Wood-fire">
            <option>Wood-fire</option>
            <option>Electric</option>
            <option>Hybrid / not sure yet</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="location">Delivery location (city)</label>
        <input type="text" id="location" name="location" placeholder="Kettering, OH" />
      </div>
      <div className="field">
        <label htmlFor="msg">Anything else we should know?</label>
        <textarea id="msg" name="message" placeholder="Occasion, group size, questions..." />
      </div>
      {/* Honeypot field — hidden from real users, catches basic bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />
      {promoCode && (
        <div className="promo-applied">
          Promo code <span className="code">{promoCode}</span>{" "}
          is applied — you&apos;ll get one additional night free.
        </div>
      )}
      {status === "error" && (
        <p style={{ color: "var(--ember)", fontSize: 14, marginBottom: 14 }}>{errorMessage}</p>
      )}
      <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Request to book"}
      </button>
    </form>
  );
}
