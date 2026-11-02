import { z } from "zod";
import { generateValidated, type GenerateJson } from "./ai/llm";
import { buildExtractUserPrompt, EXTRACT_SYSTEM_PROMPT } from "./prompts/extract";
import {
  DaySchema,
  ExtractResultSchema,
  LanguageSchema,
  TimeSchema,
  type DayHours,
  type ExtractResult,
  type Product,
} from "./schema";
import { pickSlug } from "./slug";

/**
 * What we ask the model for. Deliberately looser than ShopProfile:
 *  - every field optional (the owner may not mention it)
 *  - no product ids / theme (those are ours to assign, not facts from speech)
 *  - slugRomanized so Hindi names still get a readable URL
 * Our own code then turns this into a clean ExtractResult.
 */
export const LlmExtractSchema = z.object({
  name: z.string().optional(),
  slugRomanized: z.string().optional(),
  tagline: z.string().optional(),
  category: z.string().optional(),
  about: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  upiId: z.string().optional(),
  address: z
    .object({
      line: z.string().optional(),
      city: z.string().optional(),
      pincode: z.string().optional(),
      mapsQuery: z.string().optional(),
    })
    .optional(),
  hours: z
    .array(
      z.object({
        day: DaySchema,
        open: TimeSchema.optional(),
        close: TimeSchema.optional(),
        closed: z.boolean().optional(),
      }),
    )
    .optional(),
  products: z
    .array(
      z.object({
        name: z.string(),
        priceInr: z.number().nonnegative().optional(),
        unit: z.string().optional(),
        inStock: z.boolean().optional(),
      }),
    )
    .optional(),
  language: LanguageSchema.optional(),
});
export type LlmExtract = z.infer<typeof LlmExtractSchema>;

/** Fields the owner should be asked about if empty (keys match i18n `f_<key>`). */
export const IMPORTANT_FIELDS = [
  "name",
  "category",
  "phone",
  "address",
  "hours",
  "products",
] as const;

const clean = (s?: string) => {
  const v = s?.trim();
  return v ? v : undefined;
};

export function newProductId(): string {
  return `p_${crypto.randomUUID().slice(0, 8)}`;
}

/** Deterministic post-processing: we don't trust the model for ids, slugs or "missing". */
export function normalizeExtraction(raw: LlmExtract, makeId = newProductId): ExtractResult {
  const name = clean(raw.name);

  // Last mention of a day wins ("Sunday band... actually Sunday 10 se 2").
  const byDay = new Map<string, DayHours>();
  for (const h of raw.hours ?? []) {
    if (h.closed) byDay.set(h.day, { day: h.day, closed: true });
    else if (h.open && h.close)
      byDay.set(h.day, { day: h.day, open: h.open, close: h.close, closed: false });
  }
  const hours = [...byDay.values()];

  const products: Product[] = (raw.products ?? [])
    .filter((p) => clean(p.name))
    .map((p) => ({
      id: makeId(),
      name: p.name.trim(),
      ...(p.priceInr !== undefined && { priceInr: p.priceInr }),
      ...(clean(p.unit) && { unit: clean(p.unit) }),
      inStock: p.inStock ?? true,
    }));

  const a = raw.address;
  const address =
    a && (clean(a.line) || clean(a.city))
      ? {
          line: clean(a.line) ?? "",
          city: clean(a.city) ?? "",
          ...(clean(a.pincode) && { pincode: clean(a.pincode) }),
          ...(clean(a.mapsQuery) && { mapsQuery: clean(a.mapsQuery) }),
        }
      : undefined;

  const profile: ExtractResult["profile"] = {
    ...(name && { name, slug: pickSlug([raw.slugRomanized, name]) }),
    ...(clean(raw.tagline) && { tagline: clean(raw.tagline) }),
    ...(clean(raw.category) && { category: clean(raw.category) }),
    ...(clean(raw.about) && { about: clean(raw.about) }),
    ...(clean(raw.phone) && { phone: clean(raw.phone) }),
    ...(clean(raw.whatsapp) && { whatsapp: clean(raw.whatsapp) }),
    ...(clean(raw.upiId) && { upiId: clean(raw.upiId) }),
    ...(address && { address }),
    ...(hours.length > 0 && { hours }),
    ...(products.length > 0 && { products }),
    ...(raw.language && { language: raw.language }),
  };

  return ExtractResultSchema.parse({ profile, missing: computeMissing(profile) });
}

/** Which important fields are still empty. Works on extraction results and on drafts. */
export function computeMissing(p: ExtractResult["profile"]): string[] {
  const missing: string[] = [];
  if (!p.name?.trim()) missing.push("name");
  if (!p.category?.trim()) missing.push("category");
  if (!p.phone?.trim() && !p.whatsapp?.trim()) missing.push("phone");
  if (!p.address?.line.trim() || !p.address?.city.trim()) missing.push("address");
  if (!p.hours?.length) missing.push("hours");
  if (!p.products?.length) missing.push("products");
  return missing;
}

/** Transcript → structured shop data (validated, with one self-correcting retry). */
export async function extractShopProfile(
  transcript: string,
  generate: GenerateJson,
): Promise<ExtractResult & { attempts: number }> {
  const { data, attempts } = await generateValidated({
    generate,
    system: EXTRACT_SYSTEM_PROMPT,
    user: buildExtractUserPrompt(transcript),
    schema: LlmExtractSchema,
  });
  return { ...normalizeExtraction(data), attempts };
}
