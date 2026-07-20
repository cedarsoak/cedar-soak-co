import { NextResponse } from "next/server";
import { resend, CONTACT_TO_EMAIL, FROM_EMAIL, renderNotificationEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dates,
      heatPreference,
      location,
      message,
      website,
    } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dates?: string;
      heatPreference?: string;
      location?: string;
      message?: string;
      website?: string; // honeypot field
    };

    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { ok: false, error: "First name, last name, email, and phone are required." },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `Booking request from ${firstName} ${lastName} — Cedar Soak Co. site`,
      html: renderNotificationEmail("New booking request", {
        Name: `${firstName} ${lastName}`,
        Email: email,
        Phone: phone,
        "Preferred dates": dates,
        "Heat preference": heatPreference,
        "Delivery location": location,
        Message: message,
        Source: "Homepage Request to Book form",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("booking form error", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again or call/text us directly." },
      { status: 500 }
    );
  }
}
