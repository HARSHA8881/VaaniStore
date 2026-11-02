import { DAYS } from "./hours";
import type { ShopProfile } from "./schema";
import { normalizeIndianPhone } from "./whatsapp";

const SCHEMA_DAY: Record<(typeof DAYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** One-line description for search results / link previews. */
export function shopDescription(p: ShopProfile): string {
  const where = p.address
    ? ` in ${[p.address.line, p.address.city].filter(Boolean).join(", ")}`
    : "";
  const base = p.about || p.tagline || `${p.category}${where}.`;
  const items = p.products
    .slice(0, 4)
    .map((x) => x.name)
    .join(", ");
  const text = items ? `${base} ${items} and more. Order on WhatsApp.` : base;
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

/**
 * schema.org LocalBusiness so Google can show hours, phone and address directly
 * in search results ("Sharma General Store near me").
 */
export function localBusinessJsonLd(p: ShopProfile, url: string) {
  const phone = p.phone ? normalizeIndianPhone(p.phone) : null;
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: p.name,
    url,
    description: shopDescription(p),
    ...(phone && { telephone: `+${phone}` }),
    ...(p.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: p.address.line,
        addressLocality: p.address.city,
        ...(p.address.pincode && { postalCode: p.address.pincode }),
        addressCountry: "IN",
      },
    }),
    openingHoursSpecification: p.hours
      .filter((h) => !h.closed && h.open && h.close)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${SCHEMA_DAY[h.day]}`,
        opens: h.open,
        closes: h.close,
      })),
    ...(p.products.length > 0 && {
      makesOffer: p.products.map((x) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Product", name: x.name },
        ...(x.priceInr !== undefined && { price: x.priceInr, priceCurrency: "INR" }),
        availability: `https://schema.org/${x.inStock ? "InStock" : "OutOfStock"}`,
      })),
    }),
  };
}

/** JSON for a <script> tag: escape "<" so a product named "</script>" can't break out. */
export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
