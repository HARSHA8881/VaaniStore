import { z } from "zod";

/**
 * Checks environment variables once at server start and logs anything wrong in
 * plain words. We log instead of crashing: the landing page and /preview work
 * without keys, and a crash would hide the message inside a generic 500.
 */
const optionalUrl = z.url({ protocol: /^https?$/ }).optional();

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(20, "looks too short").optional(),
  GROQ_API_KEY: z.string().startsWith("gsk_", 'should start with "gsk_"').optional(),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "looks too short").optional(),
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  AI_DAILY_LIMIT: z.coerce.number().int().positive().optional(),
  ERROR_WEBHOOK_URL: optionalUrl,
});

export type EnvReport = { errors: string[]; warnings: string[] };

export function checkEnv(env: Record<string, string | undefined>, production: boolean): EnvReport {
  // Treat empty strings (e.g. "GEMINI_API_KEY=" copied from .env.example) as unset.
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== ""));
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      errors.push(`${issue.path.join(".")}: ${issue.message}`);
  }

  const has = (k: string) => Boolean(cleaned[k]);
  const need = (k: string, why: string) => {
    if (!has(k)) (production ? errors : warnings).push(`${k} is not set — ${why}`);
  };
  need("GEMINI_API_KEY", "voice-to-profile and voice edits won't work");
  need("NEXT_PUBLIC_SUPABASE_URL", "login, saving and public shop pages won't work");
  need("NEXT_PUBLIC_SUPABASE_ANON_KEY", "login, saving and public shop pages won't work");
  if (!has("GROQ_API_KEY")) {
    warnings.push(
      "GROQ_API_KEY is not set — Firefox and some Android browsers can't use voice input",
    );
  }

  if (production) {
    if (!has("NEXT_PUBLIC_SITE_URL") && !has("VERCEL_PROJECT_PRODUCTION_URL")) {
      errors.push(
        "NEXT_PUBLIC_SITE_URL is not set — share links and QR codes will point to localhost",
      );
    }
    if (!has("UPSTASH_REDIS_REST_URL") || !has("UPSTASH_REDIS_REST_TOKEN")) {
      warnings.push(
        "Upstash Redis is not set — rate limits are per server instance, so the AI budget cap is weak",
      );
    }
  }
  if (has("UPSTASH_REDIS_REST_URL") !== has("UPSTASH_REDIS_REST_TOKEN")) {
    errors.push("Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or neither");
  }
  if (
    cleaned.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    cleaned.SUPABASE_SERVICE_ROLE_KEY === cleaned.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY equals the anon key — check you copied the right keys");
  }
  return { errors, warnings };
}
