import { describe, expect, it } from "vitest";
import transcripts from "./transcripts.json";
import { f1, fuzzyEqual, scoreCase, type EvalCase } from "./score";

const cases = transcripts as EvalCase[];
const byId = (id: string) => cases.find((c) => c.id === id)!;

describe("eval dataset", () => {
  it("has 30 cases, 10 per language, unique ids", () => {
    expect(cases).toHaveLength(30);
    for (const lang of ["en", "hi", "hinglish"]) {
      expect(cases.filter((c) => c.language === lang)).toHaveLength(10);
    }
    expect(new Set(cases.map((c) => c.id)).size).toBe(30);
  });

  it("covers all five shop types", () => {
    expect(new Set(cases.map((c) => c.shopType))).toEqual(
      new Set(["kirana", "medical", "mobile_repair", "boutique", "sweet_shop"]),
    );
  });
});

describe("fuzzyEqual", () => {
  it.each([
    ["Parle-G", "parle g", true],
    ["Toor Dal", "toor dal (1 kg)", true],
    ["चीनी", "चीनी", true],
    ["Maggi", "Atta", false],
    ["ab", "abc", false],
  ])("%s ~ %s = %s", (a, b, expected) => {
    expect(fuzzyEqual(a, b)).toBe(expected);
  });
});

describe("scoreCase", () => {
  it("gives a perfect score for a perfect extraction", () => {
    const c = byId("hl-01");
    const s = scoreCase(c, {
      name: "Sharma General Store",
      phone: "98765 43210",
      hours: Object.entries(c.expected.hours!).map(([day, v]) =>
        v === "closed"
          ? { day: day as "sun", closed: true }
          : { day: day as "mon", open: v.split("-")[0], close: v.split("-")[1], closed: false },
      ),
      products: [
        { id: "1", name: "Atta 5 kg", priceInr: 280, inStock: true },
        { id: "2", name: "Maggi", priceInr: 14, inStock: true },
        { id: "3", name: "Parle-G", priceInr: 10, inStock: true },
      ],
    });
    expect(Object.values(s.correct).every(Boolean)).toBe(true);
    expect(s.notes).toEqual([]);
  });

  it("counts invented fields as hallucinations", () => {
    const s = scoreCase(byId("hl-06"), {
      name: "Malad Kirana Store",
      phone: "9999999999",
      products: [{ id: "1", name: "Milk", priceInr: 66, inStock: true }],
    });
    expect(s.counts.name.hallucinations).toBe(1);
    expect(s.counts.phone.hallucinations).toBe(1);
    expect(s.correct.products).toBe(true); // "Milk" matches alias of "Doodh"
    expect(s.correct.prices).toBe(true);
  });

  it("accepts a romanized name for a Hindi shop", () => {
    const s = scoreCase(byId("hi-01"), { name: "Gupta Kirana Store", slug: "gupta-kirana-store" });
    expect(s.correct.name).toBe(true);
  });

  it("flags a wrong price", () => {
    const s = scoreCase(byId("hl-04"), {
      products: [{ id: "1", name: "Dupatta", priceInr: 1500, inStock: true }],
    });
    expect(s.counts.prices.fp).toBe(1);
    expect(s.notes).toContain("price Dupatta: expected 150, got 1500");
  });
});

describe("f1", () => {
  it("computes precision/recall/F1", () => {
    expect(f1({ tp: 8, fp: 2, fn: 2 })).toEqual({
      precision: 0.8,
      recall: 0.8,
      f1: 0.8000000000000002,
    });
  });
});
