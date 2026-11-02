"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./config";

let client: SupabaseClient | null = null;

/** Browser client (stores the session in cookies so the server can read it too). */
export function getBrowserSupabase(): SupabaseClient | null {
  const env = supabaseEnv();
  if (!env) return null;
  client ??= createBrowserClient(env.url, env.anonKey);
  return client;
}
