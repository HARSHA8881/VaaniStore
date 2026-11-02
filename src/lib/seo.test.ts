import { describe, expect, it } from "vitest";
import { sampleShop } from "./sample";
import { localBusinessJsonLd, safeJson, shopDescription } from "./seo";

describe("localBusinessJsonLd", () => {
  const ld = localBusinessJsonLd(sampleShop, "https://x.app/s/sharma-general-store");

  it("has phone in international format and Indian address", () => {
    expect(ld.telephone).toBe("+919876543210");
    expect(ld.address).toMatchObject({ addressLocality: "New Delhi", addressCountry: "IN" });
  });

  it("lists only open days", () => {
    expect(ld.openingHoursSpecification).toHaveLength(6);
    expect(ld.openingHoursSpecification[0]).toMatchObject({
      dayOfWeek: "https://schema.org/Monday",
      opens: "09:00",
      closes: "22:00",
    });
  });

  it("marks out-of-stock offers", () => {
    const maggi = ld.makesOffer!.find((o) => o.itemOffered.name === "Maggi Noodles");
    expect(maggi?.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("safeJson", () => {
  it("escapes < to prevent closing the script tag", () => {
    expect(safeJson({ name: "</script><b>" })).not.toContain("</script>");
  });
});

describe("shopDescription", () => {
  it("stays under 160 chars", () => {
    expect(shopDescription({ ...sampleShop, about: "x".repeat(300) }).length).toBeLessThanOrEqual(
      160,
    );
  });
});
