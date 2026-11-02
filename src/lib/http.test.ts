import { describe, expect, it } from "vitest";
import { assertSameOrigin, HttpError, readJson } from "./http";

const req = (headers: Record<string, string>, body = "{}") =>
  new Request("http://localhost:3000/api/x", { method: "POST", headers, body });

describe("assertSameOrigin", () => {
  it("allows same-origin browser requests", () => {
    expect(() =>
      assertSameOrigin(req({ origin: "http://localhost:3000", host: "localhost:3000" })),
    ).not.toThrow();
  });

  it("allows requests without an Origin header", () => {
    expect(() => assertSameOrigin(req({ host: "localhost:3000" }))).not.toThrow();
  });

  it("blocks other websites", () => {
    expect(() =>
      assertSameOrigin(req({ origin: "https://evil.example", host: "vaanistore.app" })),
    ).toThrow(HttpError);
  });

  it("uses x-forwarded-host behind a proxy", () => {
    expect(() =>
      assertSameOrigin(
        req({
          origin: "https://vaanistore.app",
          host: "internal:3000",
          "x-forwarded-host": "vaanistore.app",
        }),
      ),
    ).not.toThrow();
  });
});

describe("readJson", () => {
  it("parses JSON", async () => {
    await expect(readJson(req({}, '{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it("rejects bodies over the limit", async () => {
    await expect(
      readJson(req({}, JSON.stringify({ a: "x".repeat(100) })), 50),
    ).rejects.toMatchObject({
      status: 413,
    });
  });

  it("rejects invalid JSON", async () => {
    await expect(readJson(req({}, "nope"))).rejects.toMatchObject({ status: 400 });
  });
});
