# Online booking & admin — setup guide

The site now has:

- **`/book`** (and the booking section on the homepage): a live calendar and a $249 deposit (one night) paid through Stripe. Dates are locked the moment the deposit goes through. Right after paying, the customer signs the rental agreement online, or asks for the link by email to sign later.
- **`/account`**: the customer's own page (sign-in by emailed link, no password) to see their rental, pay the balance, change package, extend, cancel, and get a personal share link and QR code.
- **`/admin`**: a password-protected dashboard with the bookings calendar, client info, delivery locations, signed waivers, payments, deposits, refunds and blocked dates.

It needs four accounts connected: a database, Stripe, an admin password, and email (Resend, which you already use for the contact forms). The whole setup takes about 30–45 minutes. **Until it's done, the site keeps working, but the booking page can't take payments.**

---

## 1. Push the new code

In the `cedar-soak-co` folder, open a terminal (or use GitHub Desktop) and run:

```bash
npm install
npm run build        # optional but recommended: confirms everything compiles
git add .
git commit -m "Add online booking, waivers, deposits and admin"
git push
```

`npm install` adds the new packages (Stripe, the database driver, the PDF maker, and the QR code maker) and updates `package-lock.json`. Commit that file too.

## 2. Create the database (free)

1. Go to **vercel.com** → your `cedar-soak-co` project → **Storage** tab → **Create Database**.
2. Choose **Neon (Serverless Postgres)** → the free plan → region **US East** → Create.
3. When it asks which project to connect, pick `cedar-soak-co` and tick all environments. Vercel adds `DATABASE_URL` for you.

That's it — the tables are created automatically the first time someone opens the booking page or the admin.

## 3. Set up Stripe (card payments)

1. Create an account at **stripe.com** and finish the business verification (bank account for payouts, EIN/SSN). Stripe charges 2.9% + 30¢ per card payment.
2. **Start in test mode** (toggle top right in the Stripe dashboard). Go to **Developers → API keys** and copy the **Secret key** (`sk_test_...`).
3. In Vercel → Project → **Settings → Environment Variables**, add:
   - `STRIPE_SECRET_KEY` = the secret key
4. In Stripe → **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://www.cedarsoak.co/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`
   - After saving, click **Reveal** under *Signing secret* and add it in Vercel as `STRIPE_WEBHOOK_SECRET` (`whsec_...`).

When you're ready for real payments, switch Stripe to live mode, repeat steps 2–4 with the **live** keys, replace both values in Vercel, and redeploy.

## 4. Admin password and site address

Add these in Vercel → Settings → Environment Variables:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | A long password you'll both use to sign in at `/admin` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.cedarsoak.co` |
| `ADMIN_SESSION_SECRET` | *(optional)* any long random text — if set, changing it signs everyone out |

## 5. Email (Resend) — verify your domain

Confirmation emails, waiver links and payment links go to **customers**. Resend's shared test sender (`onboarding@resend.dev`) can only email the address that owns the Resend account, so **customer emails won't arrive until you verify `cedarsoak.co`**:

1. Resend → **Domains → Add domain** → `cedarsoak.co` → add the DNS records it shows at your domain registrar.
2. Once it says *Verified*, open `lib/resend.ts` and change `FROM_EMAIL` to  
   `"Cedar Soak Co. <bookings@cedarsoak.co>"`, then commit and push.

(Owner notifications to cedarsoak@gmail.com work even before this step.)

## 6. Redeploy and test

1. Vercel → **Deployments** → the latest one → **⋯ → Redeploy** (environment variables only apply to new deployments).
2. Sign in at `https://www.cedarsoak.co/admin`. The dashboard shows a setup checklist until every item is done.
3. With Stripe in **test mode**, make a booking at `/book` using card `4242 4242 4242 4242`, any future expiry, any CVC. You should:
   - land on the "You're booked" page,
   - see the booking on the admin calendar as *Confirmed* with the signed waiver attached,
   - get the owner notification email.
4. In the admin, open that test booking → Payments → **Refund** the deposit, then **Cancel** and **Delete** it.

---

## Everyday use

**AFTERGLOW promo:** The free bonus night only applies with the code AFTERGLOW (or any other code you add to `bonusNight.promoCodes` in `lib/booking-config.ts`). On the /afterglow page, link the booking button to `https://www.cedarsoak.co/book?promo=AFTERGLOW` and the code is filled in automatically. The code is saved on each booking, so the admin and the spreadsheet export show which bookings came from the Wedding Expo.

**Rental agreement:** Customers sign after paying. The confirmation page has **Sign now** and **Email me the link**, and the confirmation email has a signing button too. The dashboard flags any upcoming booking that still needs a signature; from the booking page you can resend the link or copy it to text.

**Customer accounts:** Every customer email includes a "View my rental" link that signs them in. They can also go to cedarsoak.co/account and enter their email. From there they can:
- pay their balance by card (Stripe),
- switch between The Escape and The Lux (until 48 hours before delivery),
- add nights if the calendar is open after their stay (added to their balance),
- cancel: 48+ hours before delivery refunds the deposit and any card payments automatically; later than that keeps the deposit. You get an email either way, including anything you need to refund by hand (cash, Venmo),
- copy their share link or show the QR code.

**Referral reward ($25 each):** A friend who books with a customer's share link gets $25 off automatically. Once the friend's deposit is paid, the customer who shared the link gets a $25 credit: it comes off their upcoming rental right away, or off their next booking if they don't have one. Both of you get an email. If the friend cancels before the credit is used, it's taken back. Bookings from share links show "Referred by" in the admin and in the spreadsheet export. Change the amounts in `referral` in `lib/booking-config.ts`.

**New online booking:** You get an email. The booking appears in `/admin` with the signed agreement PDF, client info, address (with a directions link), payment status, and the "How did you hear about us?" answer and promo code (for your campaign tracking).

**Address & satellite view:** On a booking's admin page, click the address to open Google's satellite view in a new tab. A satellite map of the property also shows under the booking details, so you can check the driveway and where the trailer will sit.

**Delivery fee:** The site estimates the distance from Oakwood from the customer's address. If it's over 15 miles, the fee shows as an estimate; if the address couldn't be matched, it says "we'll confirm". Open the booking → *Edit booking details* → set **Delivery miles** → Save. The fee and balance update automatically. The dashboard flags bookings where this still needs doing.

**Collecting the balance:** Booking → Billing → *Request a payment* → the amount is pre-filled with the balance → the client gets a Stripe link by email (valid 23 hours). Paid cash or Venmo instead? Use *Record a payment received*.

**After pickup:** Deposit row → **Refund** (goes back to their card), or *Deposit after pickup* → **Kept for damage**. Damage above the $249 deposit → *Request a payment* → Damage charge. Then **Mark completed**.

**Phone/text bookings:** **+ New booking** → fill in → then send the deposit link and the **waiver signing link** from the booking page (or copy the link and text it).

**Paper waivers & guest sheets:** Booking → Waivers & files → Upload (PDF or phone photo, up to 4 MB).

**Blocking dates:** Admin → **Block dates** (maintenance, family trips, events booked elsewhere).

**Google Calendar:** At the bottom of the admin dashboard is a private calendar link. In Google Calendar (cedarsoak@gmail.com): *Other calendars → + → From URL* → paste. Confirmed rentals show up automatically.

**Spreadsheet export:** Admin dashboard → *Download all bookings (CSV)* opens in Excel/Google Sheets for bookkeeping.

## Changing prices and rules

Everything lives in **`lib/booking-config.ts`**: nightly rate ($249), minimum and maximum nights, the bonus-night deal, the deposit amount, delivery radius and per-mile rate, the Lux add-on price, heat options, occasions, how many days ahead people can book, and the maximum tub occupancy printed in the agreement.

Current settings: The Lux is **+$99**, the deposit is **$249** (a refundable damage deposit, returned after pickup if there's no damage), and maximum occupancy is **6 people** (printed in section 3 of the agreement). The agreement's deposit wording in section 8 follows the deposit amount automatically.

The **rental agreement text** is in `lib/agreement.ts`, copied from `Legal/CedarSoak_Rental_Agreement_and_Liability_Release.docx`. If you change the Word document, update this file and change `AGREEMENT_VERSION`. Each signed PDF records the version, date/time, IP address and device of the signer.

## Where things are in the code

| Path | What it is |
|---|---|
| `components/booking/` | The customer booking flow (calendar, agreement signing, signature pad) |
| `app/book/` | `/book` page and the post-payment confirmation page |
| `app/waiver/[token]/` | Signing page for waiver links sent from the admin |
| `app/admin/` | Admin login and dashboard pages; `(panel)/actions.ts` handles every admin button |
| `app/api/` | Availability, quote, checkout, Stripe webhook, calendar feed, file download/upload, CSV export |
| `lib/booking-config.ts` | Prices and rules |
| `lib/bookings.ts`, `lib/booking-service.ts` | Database logic, double-booking protection, payment tracking |
| `lib/waiver-pdf.ts` | Builds the signed agreement PDF |
