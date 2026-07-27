import type { Metadata } from "next";
import { Fraunces, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-work-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cedarsoak.co"),
  title: "Cedar Soak Co. | Luxury Mobile Cedar Hot Tub Rentals | Dayton, Ohio",
  description:
    "Cedar Soak Co. delivers handcrafted, wood-fired cedar hot tubs to your backyard, cabin, or celebration across Dayton, Ohio. Reserve your soak.",
  openGraph: {
    title: "Cedar Soak Co. | Luxury Mobile Cedar Hot Tub Rentals",
    description:
      "Handcrafted cedar hot tubs, delivered to your backyard, cabin, or celebration across Dayton, Ohio.",
    url: "https://www.cedarsoak.co",
    siteName: "Cedar Soak Co.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
