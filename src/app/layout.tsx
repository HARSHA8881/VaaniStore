import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Display serif for headlines: warm, crafted, reads well at large sizes.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

// Geist/Fraunces have no Hindi glyphs; without these, Devanagari falls back to
// whatever the phone has, which looks broken on some cheap Android devices.
// Not preloaded: the browser fetches them only when Hindi text is on screen
// (unicode-range), so English pages don't pay ~200 KB for fonts they never use.
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  preload: false,
});
const devanagariSerif = Noto_Serif_Devanagari({
  variable: "--font-devanagari-serif",
  subsets: ["devanagari"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "VaaniStore – Bolo, dukaan online",
  description:
    "Speak in Hindi, English or Hinglish and get a website for your shop with products, timings, map and WhatsApp ordering.",
  appleWebApp: { capable: true, title: "VaaniStore", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} ${devanagari.variable} ${devanagariSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
