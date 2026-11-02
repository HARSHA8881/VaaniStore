import { connection } from "next/server";
import { getAnonSupabase } from "@/lib/supabase/server";
import { SHOPS_TABLE } from "@/lib/supabase/config";

/**
 * Uptime check for monitors (UptimeRobot, Better Stack, Vercel checks).
 * Reports only booleans — never key values or error details.
 * 200 when the database answers; 503 otherwise.
 */
export async function GET() {
  await connection(); // always run at request time, never cached

  const supabase = getAnonSupabase();
  let database = false;
  if (supabase) {
    const { error } = await supabase
      .from(SHOPS_TABLE)
      .select("id", { head: true, count: "exact" })
      .limit(1)
      .abortSignal(AbortSignal.timeout(3000));
    database = !error;
  }

  const checks = {
    database,
    ai: Boolean(process.env.GEMINI_API_KEY),
    speechFallback: Boolean(process.env.GROQ_API_KEY),
    sharedRateLimit: Boolean(process.env.UPSTASH_REDIS_REST_URL),
  };
  return Response.json(
    { ok: database, checks },
    { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
