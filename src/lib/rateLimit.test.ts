import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, createAiQuota, memoryStore, redisStore } from "./rateLimit";

describe("memoryStore", () => {
  it("counts within a window and resets after it", async () => {
    let t = 0;
    const store = memoryStore(() => t);
    expect(await store.hit("k", 1000)).toEqual({ count: 1, resetMs: 1000 });
    t = 400;
    expect(await store.hit("k", 1000)).toEqual({ count: 2, resetMs: 600 });
    t = 1000;
    expect((await store.hit("k", 1000)).count).toBe(1);
  });
});

describe("createAiQuota", () => {
  it("blocks an IP after its per-minute limit", async () => {
    const check = createAiQuota(
      memoryStore(() => 0),
      { perMinute: 2 },
    );
    expect((await check("1.1.1.1")).ok).toBe(true);
    expect((await check("1.1.1.1")).ok).toBe(true);
    expect(await check("1.1.1.1")).toEqual({
      ok: false,
      retryAfterSeconds: 60,
      scope: "ip-minute",
    });
    // Other users are unaffected.
    expect((await check("2.2.2.2")).ok).toBe(true);
  });

  it("enforces the global daily budget across IPs", async () => {
    const check = createAiQuota(
      memoryStore(() => 0),
      { globalPerDay: 2 },
    );
    await check("a");
    await check("b");
    expect(await check("c")).toMatchObject({ ok: false, scope: "global-day" });
  });

  it("does not spend the global budget for an IP that is already blocked", async () => {
    const check = createAiQuota(
      memoryStore(() => 0),
      { perMinute: 1, globalPerDay: 3 },
    );
    await check("a"); // global 1
    await check("a"); // blocked at ip-minute, global untouched
    await check("a");
    expect((await check("b")).ok).toBe(true); // global 2
    expect((await check("c")).ok).toBe(true); // global 3
  });
});

describe("redisStore", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends INCR + PEXPIRE NX + PTTL in one pipeline", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([{ result: 3 }, { result: 0 }, { result: 45_000 }])),
      );
    vi.stubGlobal("fetch", fetchMock);
    const res = await redisStore("https://redis.example/", "tok").hit("k", 60_000);
    expect(res).toEqual({ count: 3, resetMs: 45_000 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://redis.example/pipeline");
    expect(JSON.parse(init.body)).toEqual([
      ["INCR", "k"],
      ["PEXPIRE", "k", "60000", "NX"],
      ["PTTL", "k"],
    ]);
  });
});

describe("clientIp", () => {
  it("prefers x-real-ip", () => {
    const req = new Request("http://x", {
      headers: { "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.2.3.4" },
    });
    expect(clientIp(req)).toBe("9.9.9.9");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });
});
