import { describe, expect, it } from "vitest";
import { applyPatch, diffProfiles, editResponseSchemaFor, type EditOp } from "./patch";
import { sampleShop } from "./sample";
import type { DraftProfile } from "./schema";

const base: DraftProfile = structuredClone(sampleShop);
const words = { closed: "Closed", inStock: "In stock", outOfStock: "Out of stock" };
const fixedId = () => "new1";

describe("applyPatch", () => {
  it("does not mutate the input", () => {
    const before = structuredClone(base);
    applyPatch(base, [{ op: "remove_product", productId: "p1" }]);
    expect(base).toEqual(before);
  });

  it("opens Sunday 10–2", () => {
    const next = applyPatch(base, [
      { op: "set_hours", day: "sun", open: "10:00", close: "14:00", closed: false },
    ]);
    expect(next.hours.find((h) => h.day === "sun")).toEqual({
      day: "sun",
      open: "10:00",
      close: "14:00",
      closed: false,
    });
    expect(next.hours).toHaveLength(7);
  });

  it("adds, updates and removes products", () => {
    const ops: EditOp[] = [
      { op: "add_product", name: "Good Day", priceInr: 30, unit: "packet" },
      { op: "update_product", productId: "p5", priceInr: 12 },
      { op: "remove_product", productId: "p6" },
    ];
    const next = applyPatch(base, ops, fixedId);
    expect(next.products.find((p) => p.id === "new1")).toEqual({
      id: "new1",
      name: "Good Day",
      priceInr: 30,
      unit: "packet",
      inStock: true,
    });
    expect(next.products.find((p) => p.id === "p5")?.priceInr).toBe(12);
    expect(next.products.find((p) => p.id === "p5")?.name).toBe("Parle-G");
    expect(next.products.some((p) => p.id === "p6")).toBe(false);
  });

  it("clears optional text fields with an empty value but keeps name as a string", () => {
    const next = applyPatch(base, [
      { op: "set_field", field: "tagline", value: "" },
      { op: "set_field", field: "phone", value: "91234 56789" },
    ]);
    expect(next.tagline).toBeUndefined();
    expect(next.phone).toBe("91234 56789");
  });

  it("merges address parts and drops the stale maps query", () => {
    const next = applyPatch(base, [{ op: "set_address", pincode: "110025" }]);
    expect(next.address).toEqual({
      line: base.address!.line,
      city: base.address!.city,
      pincode: "110025",
    });
  });

  it("applies ops in order", () => {
    const next = applyPatch(base, [
      { op: "set_theme", value: "bright" },
      { op: "set_theme", value: "minimal" },
    ]);
    expect(next.theme).toBe("minimal");
  });
});

describe("editResponseSchemaFor", () => {
  const schema = editResponseSchemaFor(base);

  it("accepts ops on existing products", () => {
    expect(
      schema.safeParse({ operations: [{ op: "remove_product", productId: "p6" }] }).success,
    ).toBe(true);
  });

  it("rejects unknown product ids (so the model retries)", () => {
    const r = schema.safeParse({ operations: [{ op: "remove_product", productId: "nope" }] });
    expect(r.success).toBe(false);
  });

  it("rejects an open day without times", () => {
    const r = schema.safeParse({ operations: [{ op: "set_hours", day: "sun", closed: false }] });
    expect(r.success).toBe(false);
  });

  it("strips extra keys the flat LLM shape includes", () => {
    const r = schema.parse({
      operations: [{ op: "set_theme", value: "bright", field: "name", day: "mon" }],
    });
    expect(r.operations[0]).toEqual({ op: "set_theme", value: "bright" });
  });
});

describe("diffProfiles", () => {
  it("lists only what changed", () => {
    const after = applyPatch(
      base,
      [
        { op: "set_hours", day: "sun", open: "10:00", close: "14:00", closed: false },
        { op: "update_product", productId: "p6", inStock: true },
        { op: "set_field", field: "phone", value: "91234 56789" },
      ],
      fixedId,
    );
    expect(diffProfiles(base, after, words)).toEqual([
      { labelKey: "f_phone", before: "98765 43210", after: "91234 56789" },
      { labelKey: "day_sun", before: "Closed", after: "10:00 AM – 2:00 PM" },
      {
        labelKey: "f_products",
        labelExtra: "Maggi Noodles",
        before: "₹14 / packet · Out of stock",
        after: "₹14 / packet",
      },
    ]);
  });

  it("shows added and removed products", () => {
    const after = applyPatch(
      base,
      [
        { op: "add_product", name: "Rusk" },
        { op: "remove_product", productId: "p1" },
      ],
      fixedId,
    );
    const rows = diffProfiles(base, after, words);
    expect(rows).toContainEqual({
      labelKey: "f_products",
      labelExtra: "Aashirvaad Atta",
      before: "₹280 / 5 kg",
      after: "",
    });
    expect(rows).toContainEqual({
      labelKey: "f_products",
      labelExtra: "Rusk",
      before: "",
      after: "In stock",
    });
  });

  it("returns nothing for no change", () => {
    expect(diffProfiles(base, applyPatch(base, []), words)).toEqual([]);
  });
});
