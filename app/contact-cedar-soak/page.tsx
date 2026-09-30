import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import StickyCta from "@/components/StickyCta";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Contact | Cedar Soak Co.",
  description: "Get in touch with Cedar Soak Co. to check availability and book a cedar hot tub delivery in Dayton, Ohio.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Contact</span>
          <h1>We look forward to assisting you.</h1>
          <p>Reach out directly, or fill out the form below and we&apos;ll confirm availability within one business day.</p>
        </div>
      </section>

      <section style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="contact-info-grid">
            <div className="contact-info-card">
              <h4>Phone</h4>
              <a href="tel:9376046399">937-604-6399</a>
            </div>
            <div className="contact-info-card">
              <h4>Email</h4>
              <a href="mailto:cedarsoak@gmail.com">cedarsoak@gmail.com</a>
            </div>
            <div className="contact-info-card">
              <h4>Service area</h4>
              <p>Dayton, Kettering, Beavercreek, Centerville, Miamisburg, Huber Heights &amp; surrounding communities</p>
            </div>
          </div>
        </div>
      </section>

      <section className="form-section" id="book" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="form-wrap">
            <div className="form-side reveal">
              <span className="eyebrow">Send us a message</span>
              <h2>Have a question first?</h2>
              <p>Send us a note and we&apos;ll get back to you within one business day. Ready now? <a href="/book" style={{ color: "var(--ember-dark)", fontWeight: 600, textDecoration: "underline" }}>See live availability and book online</a>.</p>
              <div className="form-meta">
                <div className="row">
                  <span className="dot"></span> Most weekends book 1&ndash;2 weeks in advance.
                </div>
                <div className="row">
                  <span className="dot"></span> Fall Soak: 2 nights, $549 &middot; Cedar Soak: 3 nights, $747.
                </div>
                <div className="row">
                  <span className="dot"></span> Standard minimum is 3 nights; seasonal offers and promotions may allow shorter stays.
                </div>
              </div>
            </div>
            <BookingForm />
          </div>
        </div>
      </section>

      <Footer />
      <StickyCta />
      <ScrollReveal />
    </>
  );
}
