import { BOOKING } from "./booking-config";
import { Booking, BookingTotals } from "./bookings";
import { formatDate, formatRange } from "./dates";
import { dollars, packageLabel } from "./pricing";
import { CONTACT_TO_EMAIL, FROM_EMAIL, getResendClient, renderNotificationEmail } from "./resend";

// All emails go through Resend (already used by the site's contact forms).
// Emails never block a booking: if sending fails, it's logged and skipped.

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderCustomerEmail(opts: {
  title: string;
  intro: string[];
  rows?: [string, string][];
  cta?: { label: string; url: string };
  outro?: string[];
}): string {
  const rows = (opts.rows ?? [])
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 0;color:#5B5147;font-size:13px;vertical-align:top;width:42%;">${esc(k)}</td><td style="padding:7px 0;color:#1E1712;font-size:14px;font-weight:500;">${esc(v)}</td></tr>`
    )
    .join("");
  const p = (t: string) => `<p style="margin:0 0 14px;color:#1E1712;font-size:15px;line-height:1.55;">${esc(t)}</p>`;
  const cta = opts.cta
    ? `<p style="margin:22px 0;"><a href="${esc(opts.cta.url)}" style="display:inline-block;background:#C97C3D;color:#221812;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:100px;font-size:15px;">${esc(opts.cta.label)}</a></p>`
    : "";
  return `
  <div style="font-family:'Work Sans', Arial, sans-serif; background:#EFEBE1; padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4dfd1;">
      <div style="background:#221812;padding:22px 26px;">
        <span style="color:#F5F1E8;font-size:19px;font-weight:600;font-family:Georgia,serif;">Cedar Soak Co.</span>
      </div>
      <div style="padding:28px 26px;">
        <h2 style="margin:0 0 16px;color:#1E1712;font-size:21px;font-family:Georgia,serif;">${esc(opts.title)}</h2>
        ${opts.intro.map(p).join("")}
        ${rows ? `<table style="width:100%;border-collapse:collapse;margin:8px 0 16px;border-top:1px solid #eee;">${rows}</table>` : ""}
        ${cta}
        ${(opts.outro ?? []).map(p).join("")}
        <p style="margin:18px 0 0;color:#5B5147;font-size:13px;">Questions? Call or text ${BOOKING.businessPhone} or reply to this email.</p>
      </div>
    </div>
  </div>`;
}

function canSend(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function send(message: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<boolean> {
  if (!canSend()) {
    console.warn("RESEND_API_KEY not set — skipped email:", message.subject);
    return false;
  }
  try {
    const result = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: message.to,
      subject: message.subject,
      html: message.html,
      replyTo: message.replyTo ?? CONTACT_TO_EMAIL,
      attachments: message.attachments,
    });
    if (result.error) {
      console.error("email send error", message.subject, result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("email send failed", message.subject, err);
    return false;
  }
}

function bookingRows(b: Booking, t: BookingTotals): [string, string][] {
  return [
    ["Booking", b.ref],
    ["Delivery", formatDate(b.startDate)],
    ["Pickup", formatDate(b.endDate)],
    ["Nights", String(b.nights)],
    ["Package", packageLabel(b.package)],
    ["Location", [b.address, b.city, b.state, b.zip].filter(Boolean).join(", ")],
    ["Rental total", t.price.deliveryCents === null ? `${dollars(t.price.totalCents)} + delivery (we'll confirm)` : dollars(t.price.totalCents)],
    ["Deposit paid", t.depositPaidCents ? dollars(t.depositPaidCents) : ""],
    ["Balance due", dollars(Math.max(0, t.balanceDueCents))],
  ];
}

export async function sendBookingConfirmedEmails(
  b: Booking,
  t: BookingTotals,
  waiverPdf: Buffer | null,
  links: { waiverUrl: string | null; accountUrl: string }
): Promise<void> {
  const attachments = waiverPdf ? [{ filename: `CedarSoak-Rental-Agreement-${b.ref}.pdf`, content: waiverPdf }] : undefined;
  const needsWaiver = !b.waiverSignedAt && links.waiverUrl;

  await send({
    to: b.email,
    subject: `You're booked! Cedar Soak ${formatRange(b.startDate, b.endDate)} (${b.ref})`,
    html: renderCustomerEmail({
      title: `You're booked, ${b.firstName}!`,
      intro: [
        `Your dates are reserved and your ${dollars(BOOKING.depositCents)} deposit is received. Here's your booking summary.`,
        ...(needsWaiver
          ? ["One more step: please sign the rental agreement before delivery. It takes about three minutes on your phone."]
          : []),
      ],
      rows: bookingRows(b, t),
      cta: needsWaiver ? { label: "Sign the rental agreement", url: links.waiverUrl! } : { label: "View my rental", url: links.accountUrl },
      outro: [
        BOOKING.balanceDueText,
        needsWaiver
          ? `You can also see your rental, pay your balance, change your package or extend your stay any time: ${links.accountUrl}`
          : `Your signed Rental Agreement is attached. Please share the safety rules with your guests — each adult guest signs the Guest Acknowledgment (last page) before soaking.`,
        `Need to cancel? Give us at least ${BOOKING.cancellationNoticeHours} hours' notice before delivery to get your deposit back.`,
      ],
    }),
    attachments,
  });

  await send({
    to: CONTACT_TO_EMAIL,
    replyTo: b.email,
    subject: `New booking ${b.ref}: ${b.firstName} ${b.lastName} — ${formatRange(b.startDate, b.endDate)}`,
    html: renderNotificationEmail("New confirmed booking (deposit paid)", {
      Booking: b.ref,
      Name: `${b.firstName} ${b.lastName}`,
      Email: b.email,
      Phone: b.phone,
      Dates: `${formatDate(b.startDate)} → ${formatDate(b.endDate)} (${b.nights} nights)`,
      Location: [b.address, b.city, b.state, b.zip].filter(Boolean).join(", "),
      "Delivery miles": b.deliveryMiles !== null ? `${b.deliveryMiles}${b.deliveryMilesEstimated ? " (estimated)" : ""}` : "Not calculated — set in admin",
      Occasion: b.occasion ?? "",
      Heat: b.heat ?? "",
      Package: packageLabel(b.package),
      Guests: b.guests ? String(b.guests) : "",
      Notes: b.notes ?? "",
      "Heard about us": b.referral ?? "",
      "Promo code": b.promoCode ?? "",
      "Referred by": b.referredBy ?? "",
      "Rental agreement": b.waiverSignedAt ? "Signed" : "Not signed yet (customer gets a link)",
      "Rental total": dollars(t.price.totalCents),
      "Balance due": dollars(t.balanceDueCents),
      Admin: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.cedarsoak.co"}/admin/bookings/${b.id}`,
    }),
    attachments,
  });
}

export async function sendPaymentLinkEmail(b: Booking, url: string, amountCents: number, what: string, dueInDays: number | null = null): Promise<boolean> {
  return send({
    to: b.email,
    subject: `Cedar Soak ${dueInDays ? "invoice" : "payment link"} — ${what} (${b.ref})`,
    html: renderCustomerEmail({
      title: `${what}: ${dollars(amountCents)}`,
      intro: [`Hi ${b.firstName}, here's a secure payment link for your Cedar Soak rental (${formatRange(b.startDate, b.endDate)}).`],
      cta: { label: `Pay ${dollars(amountCents)}`, url },
      outro: [
        dueInDays
          ? `This is a secure Stripe invoice, due within ${dueInDays} days. You can pay by card or wallet, and Stripe emails your receipt.`
          : "The link is powered by Stripe and expires in 24 hours. If it expires, just reply and we'll send a new one.",
      ],
    }),
  });
}

export async function sendWaiverLinkEmail(b: Booking, url: string): Promise<boolean> {
  return send({
    to: b.email,
    subject: `Please sign your Cedar Soak rental agreement (${b.ref})`,
    html: renderCustomerEmail({
      title: "One quick step before delivery",
      intro: [
        `Hi ${b.firstName}, please read and sign the Cedar Soak Rental Agreement for your rental on ${formatDate(b.startDate)}. It takes about three minutes on your phone.`,
      ],
      cta: { label: "Review & sign", url },
    }),
  });
}

export async function sendPaymentReceivedOwnerEmail(b: Booking, amountCents: number, what: string): Promise<void> {
  await send({
    to: CONTACT_TO_EMAIL,
    replyTo: b.email,
    subject: `Payment received ${dollars(amountCents)} — ${b.ref} ${b.firstName} ${b.lastName}`,
    html: renderNotificationEmail("Payment received", {
      Booking: b.ref,
      Name: `${b.firstName} ${b.lastName}`,
      For: what,
      Amount: dollars(amountCents),
      Dates: formatRange(b.startDate, b.endDate),
    }),
  });
}

export async function sendWaiverSignedOwnerEmail(b: Booking): Promise<void> {
  await send({
    to: CONTACT_TO_EMAIL,
    replyTo: b.email,
    subject: `Waiver signed — ${b.ref} ${b.firstName} ${b.lastName}`,
    html: renderNotificationEmail("Rental agreement signed", {
      Booking: b.ref,
      Name: `${b.firstName} ${b.lastName}`,
      Dates: formatRange(b.startDate, b.endDate),
    }),
  });
}

export async function sendWaiverSignedCustomerEmail(b: Booking, pdf: Buffer, accountUrl: string): Promise<void> {
  await send({
    to: b.email,
    subject: `Your signed Cedar Soak rental agreement (${b.ref})`,
    html: renderCustomerEmail({
      title: "Thanks — you're all set",
      intro: [
        `Your signed rental agreement for ${formatRange(b.startDate, b.endDate)} is attached for your records.`,
        "Please share the safety rules with your guests. Each adult guest signs the Guest Acknowledgment (last page) before soaking.",
      ],
      cta: { label: "View my rental", url: accountUrl },
    }),
    attachments: [{ filename: `CedarSoak-Rental-Agreement-${b.ref}.pdf`, content: pdf }],
  });
}

export async function sendAccountLinkEmail(email: string, firstName: string | null, url: string): Promise<boolean> {
  return send({
    to: email,
    subject: "Your Cedar Soak sign-in link",
    html: renderCustomerEmail({
      title: firstName ? `Hi ${firstName}` : "Your sign-in link",
      intro: ["Use the button below to see your rental, pay your balance, change your package, extend or cancel, and get your share link."],
      cta: { label: "Open my rental", url },
      outro: ["The link works for 14 days. If you didn't ask for it, you can ignore this email."],
    }),
  });
}

export async function sendBookingChangedEmails(b: Booking, t: BookingTotals, summary: string, accountUrl: string): Promise<void> {
  await send({
    to: b.email,
    subject: `Your Cedar Soak booking was updated (${b.ref})`,
    html: renderCustomerEmail({
      title: "Your booking was updated",
      intro: [summary],
      rows: bookingRows(b, t),
      cta: { label: "View my rental", url: accountUrl },
    }),
  });
  await send({
    to: CONTACT_TO_EMAIL,
    replyTo: b.email,
    subject: `Booking changed by customer — ${b.ref} ${b.firstName} ${b.lastName}`,
    html: renderNotificationEmail("Customer changed their booking", {
      Booking: b.ref,
      Name: `${b.firstName} ${b.lastName}`,
      Change: summary,
      Dates: `${formatDate(b.startDate)} → ${formatDate(b.endDate)} (${b.nights} nights)`,
      Package: packageLabel(b.package),
      "Balance due": dollars(t.balanceDueCents),
    }),
  });
}

export async function sendCancellationEmails(b: Booking, summary: string, needsOwnerAction: string | null): Promise<void> {
  await send({
    to: b.email,
    subject: `Your Cedar Soak booking is cancelled (${b.ref})`,
    html: renderCustomerEmail({
      title: "Your booking is cancelled",
      intro: [`Your rental for ${formatRange(b.startDate, b.endDate)} has been cancelled.`, summary],
      outro: ["We hope to see you another time."],
    }),
  });
  await send({
    to: CONTACT_TO_EMAIL,
    replyTo: b.email,
    subject: `Cancelled by customer — ${b.ref} ${b.firstName} ${b.lastName}`,
    html: renderNotificationEmail("Customer cancelled their booking", {
      Booking: b.ref,
      Name: `${b.firstName} ${b.lastName}`,
      Dates: formatRange(b.startDate, b.endDate),
      Result: summary,
      "Needs your action": needsOwnerAction ?? "",
    }),
  });
}

export async function sendReferralCreditEmails(referrer: Booking, friend: Booking, amountCents: number, appliedToRef: string | null): Promise<void> {
  await send({
    to: referrer.email,
    subject: `You earned ${dollars(amountCents)} off your Cedar Soak rental`,
    html: renderCustomerEmail({
      title: `Thanks for sharing, ${referrer.firstName}!`,
      intro: [
        `${friend.firstName} just booked Cedar Soak with your link, so you've earned ${dollars(amountCents)} off.`,
        appliedToRef
          ? `We've taken it off your upcoming rental (${appliedToRef}). You'll see it on your balance.`
          : "It'll come off your next rental automatically when you book with this email.",
      ],
    }),
  });
  await send({
    to: CONTACT_TO_EMAIL,
    subject: `Referral: ${friend.firstName} ${friend.lastName} booked with ${referrer.firstName} ${referrer.lastName}'s link`,
    html: renderNotificationEmail("Referral credit issued", {
      "New booking": `${friend.ref} — ${friend.firstName} ${friend.lastName}`,
      "Referred by": `${referrer.ref} — ${referrer.firstName} ${referrer.lastName} (${referrer.email})`,
      "Friend's discount": dollars(friend.creditCents),
      "Referrer's credit": `${dollars(amountCents)}${appliedToRef ? ` (applied to ${appliedToRef})` : " (waiting for their next booking)"}`,
    }),
  });
}
