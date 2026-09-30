import { NextResponse } from "next/server";
import { startCustomerSession, verifyLoginToken } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// The link in "Your Cedar Soak sign-in link" emails lands here.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = verifyLoginToken(url.searchParams.get("t"));
  if (!email) return NextResponse.redirect(new URL("/account?expired=1", request.url), 303);
  await startCustomerSession(email);
  return NextResponse.redirect(new URL("/account", request.url), 303);
}
