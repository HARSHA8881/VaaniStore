import { describe, expect, it } from "vitest";
import { emptyDraft, mergeExtraction, toPreviewProfile } from "./draft";
import { ShopProfileSchema } from "./schema";

describe("mergeExtraction", () => {
  it("keeps draft fields the AI didn't mention", () => {
    const draft = { ...emptyDraft(), phone: "9876543210", theme: "bright" as const };
    const merged = mergeExtraction(draft, { name: "Gupta Mobiles", slug: "gupta-mobiles" });
    expect(merged).toMatchObject({ name: "Gupta Mobiles", phone: "9876543210", theme: "bright" });
  });
});

describe("toPreviewProfile", () => {
  it("always produces a renderable, valid profile from an empty draft", () => {
    expect(ShopProfileSchema.safeParse(toPreviewProfile(emptyDraft())).success).toBe(true);
  });
});
