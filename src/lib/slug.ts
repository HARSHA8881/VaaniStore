/**
 * "Sharma General Store" → "sharma-general-store".
 * Strips accents and anything non-Latin. Devanagari names come out empty, so
 * the AI is asked for a romanized slug and we pass that through here to sanitize it.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Short random suffix for slug collisions: "sharma-store" → "sharma-store-k3x9". */
export function withSuffix(slug: string, random: () => number = Math.random): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o/1/l — easy to read aloud
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(random() * chars.length)];
  return `${slug.slice(0, 55)}-${suffix}`;
}

/** Best slug we can make: from the AI's romanized slug, else the name, else a random one. */
export function pickSlug(candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    const s = c ? slugify(c) : "";
    if (s) return s;
  }
  return withSuffix("shop");
}
