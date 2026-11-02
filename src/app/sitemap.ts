import type { MetadataRoute } from "next";
import { listPublishedSlugs } from "@/lib/shops";
import { shopPath, siteUrl } from "@/lib/site";

/** Home page + every published shop, so Google discovers new shops quickly. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const slugs = await listPublishedSlugs(5000);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...slugs.map((slug) => ({
      url: `${base}${shopPath(slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
