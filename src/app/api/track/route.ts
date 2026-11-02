import { z } from "zod";
import { assertSameOrigin, HttpError, readJson } from "@/lib/http";
import { EVENT_TYPES } from "@/lib/insights";
import { clientIp, createAiQuota, defaultStore } from "@/lib/rateLimit";
import { getAnonSupabase } from "@/lib/supabase/server";

/**
 * Records an anonymous event from a public shop page (sent with navigator.sendBeacon).
 * Always answers 204 so a tracking hiccup can never break the customer's page.
 * Defence: same-origin check, per-IP limit here, per-shop cap inside track_event().
 */

const BodySchema = z.object({
  slug: z
    .string()
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum(EVENT_TYPES),
  items: z
    .array(z.object({ n: z.string().trim().min(1).max(100), q: z.number().int().min(1).max(99) }))
    .max(50)
    .optional(),
});

// Generous: a real visitor makes a handful of events per minute.
const limit = createAiQuota(defaultStore(), {
  perMinute: 60,
  perDay: 2000,
  globalPerDay: 1_000_000,
});
const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = BodySchema.safeParse(await readJson(request, 8 * 1024));
    if (!body.success) return noContent();
    if (!(await limit(`track:${clientIp(request)}`)).ok) return noContent();

    const supabase = getAnonSupabase();
    if (!supabase) return noContent();
    const { slug, type, items } = body.data;
    const { error } = await supabase.rpc("track_event", {
      p_slug: slug,
      p_type: type,
      p_items: type === "order" ? (items ?? null) : null,
    });
    if (error) console.error("track_event failed", error.message);
  } catch (e) {
    if (!(e instanceof HttpError)) console.error("track failed", e);
  }
  return noContent();
}
