import { z } from "zod";

/**
 * Single source of truth for shop data.
 * Every AI response and every DB read/write is validated against these schemas,
 * so the rest of the app can trust the shape without defensive checks.
 */

/** 24-hour "HH:MM" (00:00–23:59). Spoken times like "raat 10 baje" are converted to this by the AI. */
/**
 * Length caps on every free-text field. Profiles are user-controlled and stored as
 * JSON, so without limits one request could save megabytes or break the page layout.
 */
export const LIMITS = {
  name: 100,
  short: 160,
  about: 1000,
  phone: 20,
  products: 200,
  maxPriceInr: 10_000_000,
} as const;
const text = (max: number) => z.string().trim().max(max);

export const TimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM in 24-hour format");

export const DaySchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const DayHoursSchema = z.object({
  day: DaySchema,
  open: TimeSchema.optional(),
  close: TimeSchema.optional(),
  closed: z.boolean(),
});

export const AddressSchema = z.object({
  line: text(LIMITS.short).min(1),
  city: text(LIMITS.name).min(1),
  pincode: text(10).optional(),
  /** Text we pass to Google Maps search; lets owners skip exact coordinates. */
  mapsQuery: text(300).optional(),
});

export const ProductSchema = z.object({
  id: text(40).min(1),
  name: text(LIMITS.name).min(1),
  priceInr: z.number().nonnegative().max(LIMITS.maxPriceInr).optional(),
  /** e.g. "kg", "packet", "piece" — free text because shops use many units. */
  unit: text(30).optional(),
  /** https only, so a page can't embed javascript: or plain-http (mixed content) URLs. */
  imageUrl: z
    .url({ protocol: /^https$/ })
    .max(500)
    .optional(),
  inStock: z.boolean(),
});

export const ThemeSchema = z.enum(["classic", "bright", "minimal"]);
export const LanguageSchema = z.enum(["en", "hi", "hinglish"]);

export const ShopProfileSchema = z.object({
  name: text(LIMITS.name).min(1),
  /** URL-safe id used in /s/<slug>: lowercase letters, digits and single hyphens. */
  slug: z
    .string()
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase-with-hyphens"),
  tagline: text(LIMITS.short).optional(),
  category: text(LIMITS.name).min(1),
  about: text(LIMITS.about).optional(),
  phone: text(LIMITS.phone).optional(),
  whatsapp: text(LIMITS.phone).optional(),
  upiId: text(60).optional(),
  address: AddressSchema.optional(),
  hours: z.array(DayHoursSchema).max(7),
  products: z.array(ProductSchema).max(LIMITS.products),
  theme: ThemeSchema,
  language: LanguageSchema,
});

/**
 * What the AI extraction step returns. The profile can be partial because the
 * owner may not mention everything; `missing` lists the fields the UI should ask about.
 */
export const PartialShopProfileSchema = ShopProfileSchema.partial();

/**
 * While drafting, the owner may have said the market name but not the city (or vice versa).
 * The draft keeps what we have (city may be ""); publishing uses the strict AddressSchema.
 */
export const DraftAddressSchema = AddressSchema.extend({
  line: text(LIMITS.short),
  city: text(LIMITS.name),
});

export const ExtractResultSchema = z.object({
  profile: PartialShopProfileSchema.extend({ address: DraftAddressSchema.optional() }),
  missing: z.array(z.string()),
});

export type Day = z.infer<typeof DaySchema>;
export type DayHours = z.infer<typeof DayHoursSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type ShopProfile = z.infer<typeof ShopProfileSchema>;
export type PartialShopProfile = z.infer<typeof PartialShopProfileSchema>;
export type ExtractResult = z.infer<typeof ExtractResultSchema>;

/**
 * A profile while the owner is still building it: same shape, but name/category/slug
 * may be empty and the address may be incomplete. Only publishing requires ShopProfileSchema.
 */
export const DraftProfileSchema = ShopProfileSchema.extend({
  name: text(LIMITS.name),
  slug: z.string().max(60),
  category: text(LIMITS.name),
  address: DraftAddressSchema.optional(),
});
export type DraftProfile = z.infer<typeof DraftProfileSchema>;
