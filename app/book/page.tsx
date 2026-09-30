import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/booking/BookingWizard";
import BookingSideCopy from "@/components/booking/BookingSideCopy";
import { BOOKING } from "@/lib/booking-config";
import { dollars } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Book Your Dates | Cedar Soak Co. | Dayton, Ohio",
  description:
    `See live availability and reserve a Cedar Soak mobile cedar hot tub rental in the Dayton, Ohio area. Pick your dates and hold them with a ${dollars(BOOKING.depositCents)} deposit.`,
  alternates: { canonical: "/book" },
};

export default async function BookPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Book online</span>
          <h1>Pick your dates.</h1>
          <p>See what&apos;s open and hold your dates with a {dollars(BOOKING.depositCents)} deposit in about two minutes.</p>
        </div>
      </section>
      <section className="form-section" id="book">
        <div className="wrap">
          <div className="form-wrap">
            <BookingSideCopy />
            <BookingWizard cancelled={cancelled === "1"} />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
