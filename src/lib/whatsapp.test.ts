import { describe, expect, it } from "vitest";
import { buildTelLink, buildWhatsAppLink, normalizeIndianPhone, orderMessage } from "./whatsapp";

describe("normalizeIndianPhone", () => {
  it.each([
    ["9876543210", "919876543210"],
    ["98765 43210", "919876543210"],
    ["+91-98765-43210", "919876543210"],
    ["098765 43210", "919876543210"],
    ["919876543210", "919876543210"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeIndianPhone(input)).toBe(expected);
  });

  it.each(["12345", "1234567890", "", "abc"])("rejects %s", (input) => {
    expect(normalizeIndianPhone(input)).toBeNull();
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with an encoded message", () => {
    const link = buildWhatsAppLink("98765 43210", "Hi, I want to order: Parle-G & Maggi");
    expect(link).toBe(
      "https://wa.me/919876543210?text=Hi%2C%20I%20want%20to%20order%3A%20Parle-G%20%26%20Maggi",
    );
  });

  it("builds a plain chat link without a message", () => {
    expect(buildWhatsAppLink("9876543210")).toBe("https://wa.me/919876543210");
  });

  it("returns null for an invalid number", () => {
    expect(buildWhatsAppLink("12345", "hi")).toBeNull();
  });
});

describe("orderMessage", () => {
  it("includes price and unit in English", () => {
    expect(orderMessage({ name: "Toor Dal", priceInr: 140, unit: "kg" }, "en")).toBe(
      "Hi, I want to order: Toor Dal (₹140 / kg)",
    );
  });

  it("omits price when unknown", () => {
    expect(orderMessage({ name: "Atta" }, "hinglish")).toBe("Hi, I want to order: Atta");
  });

  it("uses Hindi for Hindi shops", () => {
    expect(orderMessage({ name: "चीनी", priceInr: 45 }, "hi")).toBe(
      "नमस्ते, मुझे यह ऑर्डर करना है: चीनी (₹45)",
    );
  });
});

describe("buildTelLink", () => {
  it("adds +91", () => {
    expect(buildTelLink("9876543210")).toBe("tel:+919876543210");
  });
});
