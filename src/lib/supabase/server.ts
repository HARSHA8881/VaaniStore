import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseEnv } from "./config";

/**
 * Per-request client that acts AS the logged-in user (RLS applies).
 * Use in Route Handlers; reads/writes the auth cookies.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  const env = supabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component where cookies are read-only; proxy.ts refreshes them.
        }
      },
    },
  });
}

/**
 * Anonymous client with no cookies. Safe inside "use cache" functions because it
 * doesn't depend on who is asking — RLS only lets it see published shops.
 */
export function getAnonSupabase(): SupabaseClient | null {
  const env = supabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.anonKey, { auth: { persistSession: false } });
}
