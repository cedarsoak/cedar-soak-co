import { Resend } from "resend";

// Reads RESEND_API_KEY from the environment. Set this in Vercel's
// Project Settings -> Environment Variables (never commit the real key).
export const resend = new Resend(process.env.RESEND_API_KEY);

export const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || "cedarsoak@gmail.com";

// Using Resend's shared sending domain to start. Once cedarsoak.co is
// verified in the Resend dashboard, change this to something like
// "Cedar Soak Co. <hello@cedarsoak.co>" for better deliverability.
export const FROM_EMAIL = "Cedar Soak Co. Website <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderNotificationEmail(title: string, fields: Record<string, string | undefined>) {
  const rows = Object.entries(fields)
    .filter(([, value]) => value && value.trim().length > 0)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#5B5147;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(
          label
        )}</td><td style="padding:8px 12px;color:#1E1712;font-size:14px;">${escapeHtml(String(value))}</td></tr>`
    )
    .join("");

  return `
  <div style="font-family:'Work Sans', Arial, sans-serif; background:#EFEBE1; padding:32px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4dfd1;">
      <div style="background:#221812;padding:20px 24px;">
        <span style="color:#F5F1E8;font-size:18px;font-weight:600;">Cedar Soak Co.</span>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 16px;color:#1E1712;font-size:18px;">${escapeHtml(title)}</h2>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
      </div>
    </div>
  </div>`;
}
