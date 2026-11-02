/** Supabase is optional in dev: /preview and the voice flow work without it. */
export function supabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export const SHOPS_TABLE = "shops";
export const IMAGES_BUCKET = "product-images";

/** Cache tag for a public shop page; bumped when the owner saves. */
export const shopTag = (slug: string) => `shop-${slug}`;
