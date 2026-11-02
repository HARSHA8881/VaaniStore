import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** Magic-link and Google sign-in both land here with ?code=… (PKCE flow). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await getServerSupabase();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/dashboard", url.origin));
    console.error("auth callback failed", error.message);
  }
  return NextResponse.redirect(new URL("/login?error=1", url.origin));
}
