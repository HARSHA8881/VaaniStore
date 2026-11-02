import { describe, expect, it, vi } from "vitest";
import { AiValidationError, generateValidated, toGeminiSchema } from "./ai/llm";
import {
  computeMissing,
  extractShopProfile,
  LlmExtractAnswerSchema,
  LlmExtractResponseShape,
  LlmExtractSchema,
  normalizeExtraction,
} from "./extract";

let n = 0;
const fakeId = () => `p${++n}`;

describe("normalizeExtraction", () => {
  it("builds a clean profile, slug, product ids and missing list", () => {
    n = 0;
    const result = normalizeExtraction(
      {
        name: " शर्मा जनरल स्टोर ",
        slugRomanized: "Sharma General Store",
        category: "Kirana",
        hours: [
          { day: "mon", open: "09:00", close: "22:00" },
          { day: "sun", closed: true },
          { day: "tue", open: "09:00" }, // incomplete → dropped
        ],
        products: [{ name: "Parle-G", priceInr: 10, unit: "packet" }, { name: "  " }],
        language: "hi",
      },
      fakeId,
    );

    expect(result.profile).toEqual({
      name: "शर्मा जनरल स्टोर",
      slug: "sharma-general-store",
      category: "Kirana",
      hours: [
        { day: "mon", open: "09:00", close: "22:00", closed: false },
        { day: "sun", closed: true },
      ],
      products: [{ id: "p1", name: "Parle-G", priceInr: 10, unit: "packet", inStock: true }],
      language: "hi",
    });
    expect(result.missing).toEqual(["phone", "address"]);
  });

  it("lets a later mention of the same day win", () => {
    const { profile } = normalizeExtraction({
      hours: [
        { day: "sun", closed: true },
        { day: "sun", open: "10:00", close: "14:00" },
      ],
    });
    expect(profile.hours).toEqual([{ day: "sun", open: "10:00", close: "14:00", closed: false }]);
  });

  it("keeps a partial address so the owner can complete it", () => {
    const { profile, missing } = normalizeExtraction({ address: { line: "Lajpat Nagar market" } });
    expect(profile.address).toEqual({ line: "Lajpat Nagar market", city: "" });
    expect(missing).toContain("address");
  });

  it("returns everything as missing for an empty transcript result", () => {
    expect(normalizeExtraction({}).missing).toEqual([
      "name",
      "category",
      "phone",
      "address",
      "hours",
      "products",
    ]);
  });
});

describe("computeMissing", () => {
  it("accepts WhatsApp in place of phone", () => {
    expect(computeMissing({ whatsapp: "9876543210" })).not.toContain("phone");
  });
});

describe("generateValidated", () => {
  const schema = LlmExtractSchema;

  it("returns on first valid answer", async () => {
    const generate = vi.fn().mockResolvedValue('{"name":"A"}');
    const res = await generateValidated({ generate, system: "s", user: "u", schema });
    expect(res).toEqual({ data: { name: "A" }, attempts: 1 });
  });

  it("retries once with the validation error in the prompt", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce('{"hours":[{"day":"mon","open":"9:00","close":"22:00"}]}')
      .mockResolvedValueOnce('{"hours":[{"day":"mon","open":"09:00","close":"22:00"}]}');
    const res = await generateValidated({ generate, system: "s", user: "u", schema });
    expect(res.attempts).toBe(2);
    expect(generate.mock.calls[1][0].user).toContain("Validation error");
    expect(generate.mock.calls[1][0].user).toContain("HH:MM");
  });

  it("throws after two invalid answers", async () => {
    const generate = vi.fn().mockResolvedValue("not json");
    await expect(generateValidated({ generate, system: "s", user: "u", schema })).rejects.toThrow(
      AiValidationError,
    );
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("strips markdown code fences", async () => {
    const generate = vi.fn().mockResolvedValue('```json\n{"name":"A"}\n```');
    const res = await generateValidated({ generate, system: "s", user: "u", schema });
    expect(res.data).toEqual({ name: "A" });
  });
});

describe("extractShopProfile", () => {
  it("wires prompt → model → normalized result", async () => {
    const generate = vi.fn().mockResolvedValue('{"name":"Gupta Mobiles","phone":"9876543210"}');
    const res = await extractShopProfile("Gupta Mobiles, phone 9876543210", generate);
    expect(res.profile.slug).toBe("gupta-mobiles");
    expect(generate.mock.calls[0][0].user).toContain("Gupta Mobiles, phone 9876543210");
  });
});

describe("toGeminiSchema", () => {
  it("removes keys Gemini may reject", () => {
    const json = JSON.stringify(toGeminiSchema(LlmExtractSchema));
    expect(json).not.toContain("$schema");
    expect(json).not.toContain("additionalProperties");
    expect(json).not.toContain("pattern");
  });
});

describe("required-but-nullable model answers", () => {
  it("treats null as 'not said' and validates the rest", () => {
    const answer = {
      name: "Gupta Mobiles",
      slugRomanized: null,
      tagline: null,
      category: "Mobile repair",
      about: null,
      phone: null,
      whatsapp: null,
      upiId: null,
      address: { line: "Sector 18", city: null, pincode: null, mapsQuery: null },
      hours: [{ day: "tue", open: null, close: null, closed: true }],
      products: [{ name: "Tempered glass", priceInr: 150, unit: null, inStock: null }],
      language: "en",
    };
    const parsed = LlmExtractAnswerSchema.parse(answer);
    expect(parsed).toEqual({
      name: "Gupta Mobiles",
      category: "Mobile repair",
      address: { line: "Sector 18" },
      hours: [{ day: "tue", closed: true }],
      products: [{ name: "Tempered glass", priceInr: 150 }],
      language: "en",
    });
    expect(LlmExtractResponseShape.safeParse(answer).success).toBe(true);
  });

  it("tells Gemini every field is required", () => {
    const json = toGeminiSchema(LlmExtractResponseShape) as { required: string[] };
    expect(json.required).toEqual(expect.arrayContaining(["phone", "hours", "products"]));
  });
});
