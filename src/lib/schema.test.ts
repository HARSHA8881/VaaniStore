import { describe, expect, it } from "vitest";
import { ShopProfileSchema, TimeSchema } from "./schema";

const validShop = {
  name: "Sharma General Store",
  slug: "sharma-general-store",
  category: "kirana",
  hours: [{ day: "mon", open: "09:00", close: "22:00", closed: false }],
  products: [{ id: "p1", name: "Parle-G", priceInr: 10, inStock: true }],
  theme: "classic",
  language: "hinglish",
};

describe("ShopProfileSchema", () => {
  it("accepts a valid profile", () => {
    expect(ShopProfileSchema.safeParse(validShop).success).toBe(true);
  });

  it("rejects a slug with spaces or capitals", () => {
    const result = ShopProfileSchema.safeParse({ ...validShop, slug: "Sharma Store" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = ShopProfileSchema.safeParse({
      ...validShop,
      products: [{ id: "p1", name: "Maggi", priceInr: -5, inStock: true }],
    });
    expect(result.success).toBe(false);
  });
});

describe("TimeSchema", () => {
  it.each(["00:00", "09:30", "22:00", "23:59"])("accepts %s", (t) => {
    expect(TimeSchema.safeParse(t).success).toBe(true);
  });

  it.each(["9:00", "24:00", "10 PM", "12:60"])("rejects %s", (t) => {
    expect(TimeSchema.safeParse(t).success).toBe(false);
  });
});
