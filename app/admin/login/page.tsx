import { redirect } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/admin-auth";
import { login } from "../auth-actions";

export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { e } = await searchParams;
  const configured = isAdminConfigured();
  return (
    <div className="ad ad-login">
      <div className="ad-login-card">
        <h1>Cedar Soak admin</h1>
        <p>Bookings, waivers and payments.</p>
        {!configured || e === "setup" ? (
          <div className="ad-flash is-err">
            Set an <strong>ADMIN_PASSWORD</strong> environment variable in Vercel, then redeploy. See BOOKING-SETUP.md.
          </div>
        ) : (
          <form action={login} className="ad-form">
            {e === "1" && <div className="ad-flash is-err">That password didn&apos;t match.</div>}
            <div className="ad-f">
              <label htmlFor="pw">Password</label>
              <input id="pw" name="password" type="password" autoComplete="current-password" required autoFocus />
            </div>
            <button type="submit" className="ad-btn is-ember">
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
