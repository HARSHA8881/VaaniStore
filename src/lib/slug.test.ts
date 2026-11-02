import { describe, expect, it } from "vitest";
import { pickSlug, slugify, withSuffix } from "./slug";

describe("slugify", () => {
  it.each([
    ["Sharma General Store", "sharma-general-store"],
    ["  Gupta's  Mobile & Repair!! ", "gupta-s-mobile-and-repair"],
    ["Café Mumbai", "cafe-mumbai"],
    ["शर्मा स्टोर", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe("withSuffix", () => {
  it("adds a 4-char suffix", () => {
    expect(withSuffix("sharma-store", () => 0)).toBe("sharma-store-aaaa");
  });
});

describe("pickSlug", () => {
  it("falls back from a Hindi name to the romanized candidate", () => {
    expect(pickSlug(["शर्मा स्टोर", "Sharma Store"])).toBe("sharma-store");
  });

  it("makes a random shop slug when nothing usable exists", () => {
    expect(pickSlug(["शर्मा"])).toMatch(/^shop-[a-z2-9]{4}$/);
  });
});
