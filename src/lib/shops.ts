import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ShopProfileSchema, type ShopProfile } from "./schema";
import { SHOPS_TABLE, shopTag } from "./supabase/config";
import { getAnonSupabase } from "./supabase/server";

/**
 * Published shop by slug, cached. Shop pages change rarely and get most traffic
 * from QR scans, so serving from cache keeps them fast and cheap. The owner's
 * save calls revalidateTag(shopTag(slug)) so edits show up right away.
 */
export async function getPublishedShop(slug: string): Promise<ShopProfile | null> {
  "use cache";
  cacheTag(shopTag(slug));
  cacheLife("hours");

  const supabase = getAnonSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SHOPS_TABLE)
    .select("profile")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) {
    console.error("getPublishedShop failed", error.message);
    return null;
  }
  // Validate on read too: old rows may predate a schema change.
  const parsed = ShopProfileSchema.safeParse(data?.profile);
  return parsed.success ? parsed.data : null;
}

/** Most recently updated published slugs, for prerendering popular shops at build time. */
export async function listPublishedSlugs(limit = 100): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  const supabase = getAnonSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from(SHOPS_TABLE)
    .select("slug")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: { slug: string }) => r.slug);
}
