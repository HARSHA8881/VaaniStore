import { connection } from "next/server";
import { summarize, type EventRow } from "@/lib/insights";
import { SHOPS_TABLE } from "@/lib/supabase/config";
import { getServerSupabase } from "@/lib/supabase/server";

/** GET → last 7 days of the logged-in owner's shop activity (RLS-scoped). */
export async function GET() {
  await connection();
  const supabase = await getServerSupabase();
  if (!supabase) return Response.json({ error: "Database not configured." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Please log in." }, { status: 401 });

  const { data: shop } = await supabase
    .from(SHOPS_TABLE)
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle<{ id: string }>();
  if (!shop) return Response.json({ insights: null });

  const days = 7;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("shop_events")
    .select("type, items, created_at")
    .eq("shop_id", shop.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20_000);
  if (error) {
    console.error("insights query failed", error.message);
    return Response.json({ error: "Could not load insights." }, { status: 500 });
  }
  return Response.json(
    { insights: summarize((data ?? []) as EventRow[], new Date(), days) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
