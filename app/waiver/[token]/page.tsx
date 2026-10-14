import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WaiverSignForm from "@/components/booking/WaiverSignForm";
import { getBookingByWaiverToken } from "@/lib/bookings";
import { formatDate } from "@/lib/dates";
import { packageLabel } from "@/lib/pricing";
import { accountLink } from "@/lib/customer-auth";

export const metadata: Metadata = {
  title: "Sign Your Rental Agreement | Cedar Soak Co.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function WaiverPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByWaiverToken(token);
  if (!booking || booking.status === "cancelled" || booking.status === "expired") notFound();

  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Booking {booking.ref}</span>
          <h1>Rental agreement</h1>
          <p>
            For your Cedar Soak rental on {formatDate(booking.startDate)}. Please read, initial each section, and sign at the bottom.
          </p>
        </div>
      </section>
      <section className="form-section">
        <div className="wrap" style={{ maxWidth: 820 }}>
          <WaiverSignForm
            token={token}
            alreadySigned={Boolean(booking.waiverSignedAt)}
            accountUrl={accountLink(booking.email)}
            details={[
              { label: "Renter", value: `${booking.firstName} ${booking.lastName}` },
              { label: "Phone / Email", value: `${booking.phone} / ${booking.email}` },
              { label: "Rental address", value: [booking.address, booking.city, booking.state, booking.zip].filter(Boolean).join(", ") },
              { label: "Rental start", value: formatDate(booking.startDate) },
              { label: "Rental end", value: formatDate(booking.endDate) },
              { label: "Package", value: packageLabel(booking.package) },
            ]}
          />
        </div>
      </section>
      <Footer />
    </>
  );
}
