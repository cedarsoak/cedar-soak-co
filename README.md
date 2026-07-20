# Cedar Soak Co. — Website

Next.js 16 (App Router) + TypeScript site for Cedar Soak Co., built for deployment on Vercel with the repo hosted on GitHub.

## What's in here

- `app/page.tsx` — homepage (hero video, quick-capture form, how it works, heat options, why cedar soak, occasions, gallery teaser, pricing, full booking form)
- `app/gallery`, `app/hot-tub-faqs`, `app/contact-cedar-soak` — the other three pages. Gallery uses placeholder tiles until real photos are ready; FAQs and Contact are content-complete.
- `app/api/contact` and `app/api/book` — serverless routes that email form submissions via Resend
- `components/` — all the reusable pieces (header, footer, hero video, forms, etc.)
- `app/globals.css` — all styling, ported directly from the approved design
- `public/` — the hero video files and poster image

## Running it locally

You'll need [Node.js](https://nodejs.org) 20.9 or newer installed.

```bash
npm install
cp .env.example .env.local   # then fill in your real Resend API key
npm run dev
```

Visit `http://localhost:3000`.

**Note:** I wasn't able to run `npm install` or a production build inside my own sandbox (no internet access there), so please run `npm run build` locally at least once before your first deploy, just to confirm everything compiles cleanly on your machine. I did a careful manual review of every file, but a real build is the only way to be 100% sure.

## Setting up email (Resend)

Forms currently email `cedarsoak@gmail.com`. To make that work:

1. Create a free account at [resend.com](https://resend.com) (3,000 emails/month free, no credit card required).
2. Copy your API key from the dashboard.
3. Locally: put it in `.env.local` as `RESEND_API_KEY=...`
4. On Vercel: add `RESEND_API_KEY` under Project Settings → Environment Variables (see deployment steps below).

Emails will initially send from Resend's shared address (`onboarding@resend.dev`) with "reply-to" set to whoever filled out the form, so replying just works. Once you verify the `cedarsoak.co` domain in Resend (a short DNS step, optional for launch), update the `FROM_EMAIL` constant in `lib/resend.ts` to send from your own domain instead.

## Deploying: GitHub + Vercel

### 1. Push this to GitHub

```bash
cd cedar-soak-co
git init
git add .
git commit -m "Initial site build"
```

Then create a new empty repository on [github.com/new](https://github.com/new) (don't initialize it with a README), and:

```bash
git remote add origin https://github.com/YOUR-USERNAME/cedar-soak-co.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (GitHub sign-in is easiest).
2. Import the `cedar-soak-co` repository.
3. Vercel will auto-detect Next.js — no configuration needed.
4. Before clicking deploy, add the environment variable:
   - `RESEND_API_KEY` = your Resend key
   - `CONTACT_TO_EMAIL` = `cedarsoak@gmail.com` (optional — this is the default already)
5. Click **Deploy**. You'll get a live `*.vercel.app` URL within a minute or two.

### 3. Connect your domain

In the Vercel project → Settings → Domains, add `cedarsoak.co` and follow the DNS instructions Vercel gives you (usually just updating a couple of records at your domain registrar).

## Making changes later

Any push to the `main` branch on GitHub automatically triggers a new deployment on Vercel — no manual steps needed after the initial setup.

## Still to do

- Swap the placeholder gallery tiles for real photos
- Swap the logo mark (currently an inline SVG droplet) for your real logo once you send it over
- Verify the `cedarsoak.co` domain in Resend for branded "from" addresses
- When ready, route the quick-capture form's list into Mailchimp instead of (or alongside) the email notification
