import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { addFile, getBooking, touchBooking } from "@/lib/bookings";

export const dynamic = "force-dynamic";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024; // Vercel limits uploads to ~4.5 MB

// Admin upload: attach a paper waiver scan, photo, or other document to a booking.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const back = (msg: string) => NextResponse.redirect(new URL(`/admin/bookings/${id}?msg=${encodeURIComponent(msg)}#files`, request.url), 303);

  const booking = await getBooking(id);
  if (!booking) return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "other");
  if (!(file instanceof File) || file.size === 0) return back("Choose a file to upload.");
  if (file.size > MAX_BYTES) return back("That file is over 4 MB. Try a smaller photo or PDF.");
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", heif: "image/heif", webp: "image/webp" };
  const type = file.type || byExt[ext] || "application/octet-stream";
  if (!ALLOWED.includes(type)) return back("Upload a PDF or a photo (JPG, PNG, HEIC).");

  const data = Buffer.from(await file.arrayBuffer());
  await addFile(id, {
    kind: ["waiver", "guest-waiver", "photo", "other"].includes(kind) ? kind : "other",
    filename: file.name.slice(0, 120) || "upload",
    contentType: type,
    data,
    note: String(form.get("note") || "").slice(0, 200) || null,
  });
  if (kind === "waiver" && !booking.waiverSignedAt) {
    const { sql } = await import("@/lib/db");
    await sql`UPDATE bookings SET waiver_signed_at = now(), waiver_name = ${"Paper copy uploaded"} WHERE id = ${id}`;
  }
  await touchBooking(id);
  return back("File uploaded.");
}
