import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/#top" className="logo">
              <Image src="/logo-icon.png" alt="" width={30} height={35} className="logo-mark" />
              Cedar Soak
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
              <a href="https://www.facebook.com/cedarsoakco" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14 9H16V6H14C12.3 6 11 7.3 11 9V11H9V14H11V21H14V14H16L17 11H14V9Z"
                    stroke="#F5F1E8"
                    strokeWidth="1.3"
                  />
                </svg>
              </a>
              <a href="https://www.instagram.com/cedarsoak" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
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
