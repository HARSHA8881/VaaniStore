import type { MetadataRoute } from "next";

/** Makes the app installable ("Add to Home screen") — owners open it like any other app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VaaniStore – Bolo, dukaan online",
    short_name: "VaaniStore",
    description: "Speak in Hindi, English or Hinglish and get your shop's website.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff7ed",
    theme_color: "#c2410c",
    lang: "en-IN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
