// Adds website inquiries to Brevo. Never throws: a Brevo problem must not
// stop the form from working. Needs BREVO_API_KEY (and the list IDs below)
// in the environment; if BREVO_API_KEY is missing this does nothing.
//
//   BREVO_INQUIRY_LIST_ID  every website inquiry goes here (service follow-up only)
//   BREVO_BOOKED_LIST_ID   customers whose deposit has been paid (replaces the inquiry list for them)
//   BREVO_OPTIN_LIST_ID    only people who ticked the marketing box also go here;
//                          send marketing campaigns to this list ONLY.

type BrevoLead = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  marketingOptIn: boolean;
  /** True once the deposit is paid: the lead goes on the Booked list instead of the inquiry list. */
  booked?: boolean;
};

// Brevo wants international format. US numbers only; anything else is skipped.
function toBrevoSms(phone?: string): string | undefined {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return undefined;
}

export async function addLeadToBrevo(lead: BrevoLead): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const listIds: number[] = [];
  const inquiryList = Number(lead.booked ? process.env.BREVO_BOOKED_LIST_ID : process.env.BREVO_INQUIRY_LIST_ID);
  const optInList = Number(process.env.BREVO_OPTIN_LIST_ID);
  if (Number.isInteger(inquiryList) && inquiryList > 0) listIds.push(inquiryList);
  if (lead.marketingOptIn && Number.isInteger(optInList) && optInList > 0) listIds.push(optInList);
  if (listIds.length === 0) return;

  const attributes: Record<string, string> = {};
  if (lead.firstName?.trim()) attributes.FIRSTNAME = lead.firstName.trim();
  if (lead.lastName?.trim()) attributes.LASTNAME = lead.lastName.trim();
  // Only store a phone number for texting when the person agreed to marketing.
  const sms = lead.marketingOptIn ? toBrevoSms(lead.phone) : undefined;

  async function send(withSms: boolean) {
    return fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": apiKey as string, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        email: lead.email.trim().toLowerCase(),
        attributes: withSms && sms ? { ...attributes, SMS: sms } : attributes,
        listIds,
        updateEnabled: true,
      }),
    });
  }

  try {
    let res = await send(true);
    // If Brevo rejects the number (already used by another contact, etc.), save the contact without it.
    if (!res.ok && sms) res = await send(false);
    if (!res.ok) console.error("brevo contact error", res.status, await res.text());
  } catch (error) {
    console.error("brevo contact error", error);
  }
}
