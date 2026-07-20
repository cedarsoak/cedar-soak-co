import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/#top" className="logo">
              <svg className="logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M16 3C16 3 8 12 8 19C8 23.4183 11.5817 27 16 27C20.4183 27 24 23.4183 24 19C24 12 16 3 16 3Z"
                  stroke="#C97C3D"
                  strokeWidth="1.6"
                />
                <path
                  d="M16 12C16 12 12 17 12 20.5C12 22.9853 13.7909 25 16 25C18.2091 25 20 22.9853 20 20.5C20 17 16 12 16 12Z"
                  fill="#C97C3D"
                />
              </svg>
              Cedar Soak Co.
            </Link>
            <p>Handcrafted cedar hot tubs, delivered to your backyard, cabin, or celebration across Dayton, Ohio.</p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#heat">Heat options</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/hot-tub-faqs">FAQs</Link>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="tel:9376046399">937-604-6399</a>
            <a href="mailto:cedarsoak@gmail.com">cedarsoak@gmail.com</a>
            <p>Dayton &amp; surrounding communities</p>
          </div>
          <div className="footer-col">
            <h4>Follow along</h4>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14 9H16V6H14C12.3 6 11 7.3 11 9V11H9V14H11V21H14V14H16L17 11H14V9Z"
                    stroke="#F5F1E8"
                    strokeWidth="1.3"
                  />
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="#F5F1E8" strokeWidth="1.3" />
                  <circle cx="12" cy="12" r="4" stroke="#F5F1E8" strokeWidth="1.3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Cedar Soak Co. All rights reserved.</span>
          <span>Veteran owned &middot; Dayton, Ohio</span>
        </div>
      </div>
    </footer>
  );
}
