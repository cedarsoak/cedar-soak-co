import Link from "next/link";
import { createManualBooking } from "../../actions";
import BookingFields from "../../BookingFields";
import { Flash } from "../../ui";

export const dynamic = "force-dynamic";

export default async function NewBooking({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <>
      <Link href="/admin" className="ad-crumb">
        ← All bookings
      </Link>
      <div className="ad-head">
        <div>
          <h1>New booking</h1>
          <p>For phone, text or in-person bookings. After saving you can send the client a deposit link and a waiver signing link.</p>
        </div>
      </div>
      <Flash err={err} />
      <div className="ad-card" style={{ maxWidth: 760 }}>
        <form action={createManualBooking} className="ad-form">
          <BookingFields b={null} />
          <div className="ad-btns">
            <button type="submit" className="ad-btn is-ember">
              Create booking
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
