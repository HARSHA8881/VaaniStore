/**
 * Rate limiting for the AI routes (they cost money per call).
 *
 * Storage:
 *  - Upstash Redis (if UPSTASH_REDIS_REST_URL/TOKEN are set): shared by every
 *    serverless instance, so limits are real in production. Plain REST, no SDK.
 *  - In-memory fallback: fine for local dev and a single server. On Vercel each
 *    instance would count separately, which is why production should set Redis.
 *
 * Rules (fixed windows):
 *  - per IP: 10 / minute and 100 / day
 *  - whole app: AI_DAILY_LIMIT calls / day (default 3000) — a hard budget cap so a
 *    bot farm can't run up the Gemini/Groq bill.
 */

export type HitResult = { count: number; resetMs: number };
export interface CounterStore {
  hit(key: string, windowMs: number): Promise<HitResult>;
}

export function memoryStore(now: () => number = Date.now): CounterStore {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return {
    async hit(key, windowMs) {
      const t = now();
      let w = windows.get(key);
      if (!w || w.resetAt <= t) {
        w = { count: 0, resetAt: t + windowMs };
        windows.set(key, w);
      }
      w.count++;
      // Keep memory bounded on long-lived servers.
      if (windows.size > 10_000) {
        for (const [k, v] of windows) if (v.resetAt <= t) windows.delete(k);
      }
      return { count: w.count, resetMs: w.resetAt - t };
    },
  };
}

export function redisStore(url: string, token: string): CounterStore {
  return {
    async hit(key, windowMs) {
      const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["PEXPIRE", key, String(windowMs), "NX"], // set expiry only on the first hit
          ["PTTL", key],
        ]),
        signal: AbortSignal.timeout(2000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Redis ${res.status}`);
      const [incr, , ttl] = (await res.json()) as { result: number }[];
      return { count: incr.result, resetMs: Math.max(ttl.result, 0) };
    },
  };
}

/** Uses Redis when configured; falls back to memory if Redis is down (fail open, logged). */
export function defaultStore(): CounterStore {
  const memory = memoryStore();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return memory;
  const redis = redisStore(url, token);
  return {
    async hit(key, windowMs) {
      try {
        return await redis.hit(key, windowMs);
      } catch (e) {
        console.error("rate limit store unavailable, using memory", (e as Error).message);
        return memory.hit(key, windowMs);
      }
    },
  };
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export type QuotaResult = { ok: true } | { ok: false; retryAfterSeconds: number; scope: string };

export function createAiQuota(
  store: CounterStore,
  { perMinute = 10, perDay = 100, globalPerDay = 3000 } = {},
) {
  const rules = [
    {
      scope: "ip-minute",
      key: (ip: string) => `rl:ai:ip:${ip}:m`,
      limit: perMinute,
      windowMs: MINUTE,
    },
    { scope: "ip-day", key: (ip: string) => `rl:ai:ip:${ip}:d`, limit: perDay, windowMs: DAY },
    { scope: "global-day", key: () => "rl:ai:global:d", limit: globalPerDay, windowMs: DAY },
  ];

  return async function check(ip: string): Promise<QuotaResult> {
    // Check rules in order and stop at the first one that's exceeded, so a blocked
    // client doesn't keep using up the global budget.
    for (const rule of rules) {
      const { count, resetMs } = await store.hit(rule.key(ip), rule.windowMs);
      if (count > rule.limit) {
        return { ok: false, retryAfterSeconds: Math.ceil(resetMs / 1000), scope: rule.scope };
      }
    }
    return { ok: true };
  };
}

let shared: ReturnType<typeof createAiQuota> | null = null;
export function aiQuota() {
  shared ??= createAiQuota(defaultStore(), {
    globalPerDay: Number(process.env.AI_DAILY_LIMIT) || 3000,
  });
  return shared;
}

/**
 * Best-effort client IP. On Vercel, x-real-ip / x-forwarded-for are set by the platform.
 * (Self-hosting behind your own proxy: make sure it overwrites these headers.)
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function tooManyRequests(retryAfterSeconds: number, scope?: string) {
  const message =
    scope === "global-day"
      ? "VaaniStore is very busy today. Please try again tomorrow or fill in the form by hand."
      : "Too many requests. Please wait a minute and try again.";
  return Response.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
