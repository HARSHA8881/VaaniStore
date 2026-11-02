import { describe, expect, it } from "vitest";
import { checkEnv } from "./env";

const good = {
  GEMINI_API_KEY: "AIza".padEnd(39, "x"),
  GROQ_API_KEY: "gsk_abc",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJ".padEnd(40, "x"),
  NEXT_PUBLIC_SITE_URL: "https://vaanistore.app",
  UPSTASH_REDIS_REST_URL: "https://x.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "tok",
};

describe("checkEnv", () => {
  it("passes a complete production config", () => {
    expect(checkEnv(good, true)).toEqual({ errors: [], warnings: [] });
  });

  it("only warns about missing keys in development", () => {
    const r = checkEnv({}, false);
    expect(r.errors).toEqual([]);
    expect(r.warnings.some((w) => w.startsWith("GEMINI_API_KEY"))).toBe(true);
  });

  it("errors on missing keys in production, treating empty strings as unset", () => {
    const r = checkEnv({ ...good, GEMINI_API_KEY: "" }, true);
    expect(r.errors).toEqual([expect.stringMatching(/^GEMINI_API_KEY is not set/)]);
  });

  it("catches malformed values", () => {
    const r = checkEnv(
      { ...good, NEXT_PUBLIC_SUPABASE_URL: "abc.supabase.co", GROQ_API_KEY: "sk-1" },
      true,
    );
    expect(r.errors.join("\n")).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(r.errors.join("\n")).toMatch(/GROQ_API_KEY: should start with "gsk_"/);
  });

  it("requires both Redis values together", () => {
    const r = checkEnv({ ...good, UPSTASH_REDIS_REST_TOKEN: undefined }, false);
    expect(r.errors).toContain(
      "Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or neither",
    );
  });
});
