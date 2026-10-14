import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { logout } from "../auth-actions";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="ad">
      <header className="ad-top">
        <div className="ad-top-in">
          <Link href="/admin" className="ad-brand">
            Cedar Soak<span>Admin</span>
          </Link>
          <nav className="ad-nav">
            <Link href="/admin">Bookings</Link>
            <Link href="/admin/bookings/new">+ New booking</Link>
            <Link href="/admin/availability">Block dates</Link>
            <a href="/" target="_blank" rel="noreferrer">
              View site ↗
            </a>
          </nav>
          <form action={logout}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <main className="ad-main">{children}</main>
    </div>
  );
}
