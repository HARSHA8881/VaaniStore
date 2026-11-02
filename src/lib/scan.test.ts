import { describe, expect, it } from "vitest";
import { mergeScannedProducts, ScanAnswerSchema } from "./scan";
import type { Product } from "./schema";

const existing: Product[] = [
  {
    id: "p1",
    name: "Parle-G",
    priceInr: 5,
    unit: "packet",
    inStock: false,
    imageUrl: "https://x.supabase.co/a.jpg",
  },
  { id: "p2", name: "Toor Dal", priceInr: 140, unit: "kg", inStock: true },
];

describe("mergeScannedProducts", () => {
  it("updates matching names and adds new ones", () => {
    let n = 0;
    const { products, added, updated } = mergeScannedProducts(
      existing,
      [
        { name: "parle g", priceInr: 10 },
        { name: "Toor dal", priceInr: 140, unit: "kg" },
        { name: "Sugar", priceInr: 45, unit: "kg" },
      ],
      () => `new${++n}`,
    );
    expect(updated).toBe(1); // Toor Dal unchanged
    expect(added).toBe(1);
    // Keeps the photo and stock status of the existing product.
    expect(products[0]).toEqual({ ...existing[0], priceInr: 10 });
    expect(products[2]).toEqual({
      id: "new1",
      name: "Sugar",
      priceInr: 45,
      unit: "kg",
      inStock: true,
    });
  });

  it("does not wipe a price when the scan couldn't read it", () => {
    const { products } = mergeScannedProducts(existing, [{ name: "Toor Dal" }]);
    expect(products[1].priceInr).toBe(140);
  });
});

describe("ScanAnswerSchema", () => {
  it("turns nulls into missing fields and drops unusable rows", () => {
    const parsed = ScanAnswerSchema.parse({
      products: [
        { name: "चीनी", priceInr: 45, unit: "kg" },
        { name: "Maggi", priceInr: null, unit: null },
        { name: "", priceInr: 10, unit: null },
        { name: "Bad", priceInr: -5, unit: null },
      ],
    });
    expect(parsed.products).toEqual([
      { name: "चीनी", priceInr: 45, unit: "kg" },
      { name: "Maggi" },
    ]);
  });
});
