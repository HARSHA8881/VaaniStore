import { z } from "zod";
import { formatTime12 } from "./hours";
import type { MessageKey } from "./i18n";
import {
  DaySchema,
  LIMITS,
  LanguageSchema,
  ThemeSchema,
  TimeSchema,
  type DayHours,
  type DraftProfile,
} from "./schema";
import { formatInr } from "./whatsapp";

/**
 * Voice edits are expressed as a small list of typed operations instead of a full
 * new profile. Why:
 *  - the model can't silently drop or rewrite fields it wasn't asked to touch
 *  - each op is validated on its own and shown to the owner as a diff
 *  - undo is trivial (we keep the previous profile)
 * It's "JSON-Patch-like" but domain-specific, so ops are readable and safe.
 */

export const TEXT_FIELDS = [
  "name",
  "tagline",
  "category",
  "about",
  "phone",
  "whatsapp",
  "upiId",
] as const;

const ProductChanges = {
  name: z.string().trim().min(1).max(LIMITS.name).optional(),
  priceInr: z.number().nonnegative().max(LIMITS.maxPriceInr).optional(),
  unit: z.string().trim().max(30).optional(),
  inStock: z.boolean().optional(),
};

export const EditOpSchema = z.discriminatedUnion("op", [
  // value "" clears the field
  z.object({
    op: z.literal("set_field"),
    field: z.enum(TEXT_FIELDS),
    value: z.string().trim().max(LIMITS.about),
  }),
  z.object({ op: z.literal("set_theme"), value: ThemeSchema }),
  z.object({ op: z.literal("set_language"), value: LanguageSchema }),
  z.object({
    op: z.literal("set_address"),
    line: z.string().trim().max(LIMITS.short).optional(),
    city: z.string().trim().max(LIMITS.name).optional(),
    pincode: z.string().trim().max(10).optional(),
  }),
  z.object({
    op: z.literal("set_hours"),
    day: DaySchema,
    open: TimeSchema.optional(),
    close: TimeSchema.optional(),
    closed: z.boolean(),
  }),
  z.object({ op: z.literal("add_product"), ...ProductChanges, name: z.string().min(1) }),
  z.object({ op: z.literal("update_product"), productId: z.string(), ...ProductChanges }),
  z.object({ op: z.literal("remove_product"), productId: z.string() }),
]);
export type EditOp = z.infer<typeof EditOpSchema>;

/**
 * Flat shape we give Gemini as its response schema (models handle one flat object
 * type more reliably than a union). Zod's discriminated union above is what we
 * actually validate against.
 */
export const LlmEditResponseShape = z.object({
  operations: z.array(
    z.object({
      op: z.enum([
        "set_field",
        "set_theme",
        "set_language",
        "set_address",
        "set_hours",
        "add_product",
        "update_product",
        "remove_product",
      ]),
      field: z.enum(TEXT_FIELDS).optional(),
      value: z.string().optional(),
      line: z.string().optional(),
      city: z.string().optional(),
      pincode: z.string().optional(),
      day: DaySchema.optional(),
      open: z.string().optional(),
      close: z.string().optional(),
      closed: z.boolean().optional(),
      productId: z.string().optional(),
      name: z.string().optional(),
      priceInr: z.number().optional(),
      unit: z.string().optional(),
      inStock: z.boolean().optional(),
    }),
  ),
});

/** Validation schema bound to the current profile: product ids must exist, open needs times. */
export function editResponseSchemaFor(profile: DraftProfile) {
  const ids = new Set(profile.products.map((p) => p.id));
  return z.object({
    operations: z.array(
      EditOpSchema.superRefine((op, ctx) => {
        if ((op.op === "update_product" || op.op === "remove_product") && !ids.has(op.productId)) {
          ctx.addIssue({
            code: "custom",
            message: `Unknown productId "${op.productId}". Use one of: ${[...ids].join(", ") || "(no products)"}`,
          });
        }
        if (op.op === "set_hours" && !op.closed && (!op.open || !op.close)) {
          ctx.addIssue({
            code: "custom",
            message: "set_hours needs open and close unless closed is true",
          });
        }
      }),
    ),
  });
}

/** Pure function: returns a NEW profile with ops applied (never mutates the input). */
export function applyPatch(
  profile: DraftProfile,
  ops: EditOp[],
  makeId: () => string = () => `p_${crypto.randomUUID().slice(0, 8)}`,
): DraftProfile {
  let next: DraftProfile = {
    ...profile,
    hours: [...profile.hours],
    products: [...profile.products],
  };

  for (const op of ops) {
    switch (op.op) {
      case "set_field": {
        const value = op.value.trim();
        if (op.field === "name" || op.field === "category") next = { ...next, [op.field]: value };
        else next = { ...next, [op.field]: value || undefined };
        break;
      }
      case "set_theme":
        next = { ...next, theme: op.value };
        break;
      case "set_language":
        next = { ...next, language: op.value };
        break;
      case "set_address": {
        const current = next.address ?? { line: "", city: "" };
        const merged = {
          ...current,
          ...(op.line !== undefined && { line: op.line.trim() }),
          ...(op.city !== undefined && { city: op.city.trim() }),
          ...(op.pincode !== undefined && { pincode: op.pincode.trim() || undefined }),
        };
        // Changing the address invalidates the old maps search text.
        delete merged.mapsQuery;
        next = { ...next, address: merged };
        break;
      }
      case "set_hours": {
        const entry: DayHours = op.closed
          ? { day: op.day, closed: true }
          : { day: op.day, open: op.open, close: op.close, closed: false };
        next.hours = [...next.hours.filter((h) => h.day !== op.day), entry];
        break;
      }
      case "add_product":
        next.products = [
          ...next.products,
          {
            id: makeId(),
            name: op.name.trim(),
            ...(op.priceInr !== undefined && { priceInr: op.priceInr }),
            ...(op.unit && { unit: op.unit }),
            inStock: op.inStock ?? true,
          },
        ];
        break;
      case "update_product":
        next.products = next.products.map((p) => {
          if (p.id !== op.productId) return p;
          const { op: _op, productId: _id, ...changes } = op;
          void _op;
          void _id;
          return { ...p, ...stripUndefined(changes) };
        });
        break;
      case "remove_product":
        next.products = next.products.filter((p) => p.id !== op.productId);
        break;
    }
  }
  return next;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export type DiffRow = {
  labelKey: MessageKey;
  /** Extra label text, e.g. the product name. */
  labelExtra?: string;
  before: string;
  after: string;
};

/** Human-readable before/after rows for the confirm screen. */
export function diffProfiles(
  before: DraftProfile,
  after: DraftProfile,
  words: { closed: string; inStock: string; outOfStock: string },
): DiffRow[] {
  const rows: DiffRow[] = [];
  const push = (labelKey: MessageKey, b: string, a: string, labelExtra?: string) => {
    if (b !== a) rows.push({ labelKey, labelExtra, before: b, after: a });
  };

  for (const f of TEXT_FIELDS) push(`f_${f}` as MessageKey, before[f] ?? "", after[f] ?? "");
  push("theme", before.theme, after.theme);
  push("f_language", before.language, after.language);

  const addr = (p: DraftProfile) =>
    p.address ? [p.address.line, p.address.city, p.address.pincode].filter(Boolean).join(", ") : "";
  push("f_address", addr(before), addr(after));

  const hoursText = (p: DraftProfile, day: string) => {
    const h = p.hours.find((x) => x.day === day);
    if (!h) return "";
    if (h.closed) return words.closed;
    return h.open && h.close ? `${formatTime12(h.open)} – ${formatTime12(h.close)}` : "";
  };
  for (const day of DaySchema.options) {
    push(`day_${day}` as MessageKey, hoursText(before, day), hoursText(after, day));
  }

  const productText = (p: DraftProfile["products"][number] | undefined) =>
    p
      ? [
          p.priceInr !== undefined ? formatInr(p.priceInr) + (p.unit ? ` / ${p.unit}` : "") : "",
          p.inStock ? "" : words.outOfStock,
        ]
          .filter(Boolean)
          .join(" · ") || words.inStock
      : "";
  const ids = new Set([...before.products, ...after.products].map((p) => p.id));
  for (const id of ids) {
    const b = before.products.find((p) => p.id === id);
    const a = after.products.find((p) => p.id === id);
    const nameChanged = b && a && b.name !== a.name;
    const label = nameChanged ? `${b.name} → ${a.name}` : (a ?? b)!.name;
    const bt = productText(b);
    const at = productText(a);
    if (bt !== at || nameChanged)
      rows.push({ labelKey: "f_products", labelExtra: label, before: bt, after: at });
  }
  return rows;
}
