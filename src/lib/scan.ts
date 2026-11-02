import { z } from "zod";
import { newProductId, stripNulls } from "./extract";
import { LIMITS, type Product } from "./schema";

/** Response schema sent to Gemini: required-but-nullable so it never skips fields. */
export const ScanResponseShape = z.object({
  products: z.array(
    z.object({
      name: z.string(),
      priceInr: z.number().nullable(),
      unit: z.string().nullable(),
    }),
  ),
});

export const ScannedProductSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.name),
  priceInr: z.number().nonnegative().max(LIMITS.maxPriceInr).optional(),
  unit: z.string().trim().max(30).optional(),
});
export type ScannedProduct = z.infer<typeof ScannedProductSchema>;

/** Validation for the model's answer (nulls → absent, junk rows dropped). */
export const ScanAnswerSchema = z.preprocess(
  stripNulls,
  z.object({
    products: z
      .array(z.unknown())
      .max(150)
      .transform((rows) =>
        rows.flatMap((r) => {
          const ok = ScannedProductSchema.safeParse(r);
          return ok.success ? [ok.data] : [];
        }),
      ),
  }),
);

const key = (name: string) =>
  name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * Merge scanned items into the owner's products:
 *  - same name (ignoring case/spaces/punctuation) → update price/unit, keep photo & stock
 *  - new name → add as in stock
 * Returns the new list plus counts for the confirmation message.
 */
export function mergeScannedProducts(
  existing: Product[],
  scanned: ScannedProduct[],
  makeId: () => string = newProductId,
): { products: Product[]; added: number; updated: number } {
  const products = [...existing];
  let added = 0;
  let updated = 0;
  for (const s of scanned) {
    const i = products.findIndex((p) => key(p.name) === key(s.name));
    if (i >= 0) {
      const before = products[i];
      const next = {
        ...before,
        ...(s.priceInr !== undefined && { priceInr: s.priceInr }),
        ...(s.unit && { unit: s.unit }),
      };
      if (next.priceInr !== before.priceInr || next.unit !== before.unit) updated++;
      products[i] = next;
    } else if (products.length < LIMITS.products) {
      products.push({
        id: makeId(),
        name: s.name,
        ...(s.priceInr !== undefined && { priceInr: s.priceInr }),
        ...(s.unit && { unit: s.unit }),
        inStock: true,
      });
      added++;
    }
  }
  return { products, added, updated };
}

/** Which scanned rows match an existing product (to label them "update" in the review). */
export function existingNames(existing: Product[]): Set<string> {
  return new Set(existing.map((p) => key(p.name)));
}
export const nameKey = key;
