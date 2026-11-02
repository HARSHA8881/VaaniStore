import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontView } from "@/components/StorefrontView";
import { localBusinessJsonLd, safeJson, shopDescription } from "@/lib/seo";
import { getPublishedShop, listPublishedSlugs } from "@/lib/shops";
import { shopPath, siteUrl } from "@/lib/site";

/**
 * Public storefront. Server-rendered from cache (see getPublishedShop), so customers
 * scanning the QR code get a fast page, and Google sees full HTML + metadata.
 */

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublishedShop(slug);
  if (!shop) notFound();

  const title = shop.tagline ? `${shop.name} – ${shop.tagline}` : `${shop.name} · ${shop.category}`;
  const description = shopDescription(shop);
  const url = `${siteUrl()}${shopPath(slug)}`;
  const image = shop.products.find((p) => p.imageUrl)?.imageUrl;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "VaaniStore",
      locale: shop.language === "hi" ? "hi_IN" : "en_IN",
      ...(image && { images: [{ url: image }] }),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

/**
 * Prerender recently published shops at build time so the first QR scan is instant;
 * other slugs render on first request and are then cached.
 * Unknown slugs show the not-found page with a `noindex` tag (streamed pages always
 * start with HTTP 200). A true 404 status would need a DB check in proxy.ts on every
 * request — not worth the latency for the MVP.
 * Next.js needs at least one sample param, hence the placeholder.
 */
export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "sample-shop" }];
}

export default async function StorefrontPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const shop = await getPublishedShop(slug);
  if (!shop) notFound();

  const jsonLd = localBusinessJsonLd(shop, `${siteUrl()}${shopPath(slug)}`);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <StorefrontView profile={shop} />
    </>
  );
}
