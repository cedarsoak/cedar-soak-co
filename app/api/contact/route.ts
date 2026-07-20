import { NextResponse } from "next/server";
import { resend, CONTACT_TO_EMAIL, FROM_EMAIL, renderNotificationEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, email, website } = body as {
      firstName?: string;
      email?: string;
      website?: string; // honeypot field — real users never fill this in
    };

    // Silently succeed on spam bots without sending an email.
    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!firstName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { ok: false, error: "First name and email are required." },
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
      subject: `Quick inquiry from ${firstName} — Cedar Soak Co. site`,
      html: renderNotificationEmail("New quick inquiry", {
        "First name": firstName,
        Email: email,
        Source: "Homepage quick-capture form",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("quick-capture form error", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again or call/text us directly." },
      { status: 500 }
    );
  }
}
