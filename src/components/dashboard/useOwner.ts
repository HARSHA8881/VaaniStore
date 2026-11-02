"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Current logged-in owner (null = logged out, undefined = still checking). */
export function useOwner() {
  const supabase = getBrowserSupabase();
  const [user, setUser] = useState<User | null | undefined>(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => active && setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, supabase };
}
