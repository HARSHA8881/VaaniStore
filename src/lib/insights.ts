/**
 * Turns raw shop events into the numbers on the owner's Insights card.
 * Pure function: the API route fetches rows (RLS limits them to the owner's shop).
 */

export const EVENT_TYPES = ["view", "call", "whatsapp", "directions", "order", "upi"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventRow = {
  type: EventType;
  items: { n: string; q: number }[] | null;
  created_at: string;
};

export type Insights = {
  days: number;
  totals: Record<EventType, number>;
  /** Visits per day, oldest first, dated in IST. */
  daily: { date: string; views: number; orders: number }[];
  topProducts: { name: string; qty: number }[];
  /** Orders per 100 visits, rounded; null with no visits. */
  orderRate: number | null;
};

/** "2026-11-02" in Indian time for a moment. */
export function istDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

export function summarize(rows: EventRow[], now: Date, days = 7): Insights {
  const totals = Object.fromEntries(EVENT_TYPES.map((t) => [t, 0])) as Record<EventType, number>;
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--)
    dayKeys.push(istDate(new Date(now.getTime() - i * 86_400_000)));
  const daily = new Map(dayKeys.map((d) => [d, { date: d, views: 0, orders: 0 }]));
  const products = new Map<string, { name: string; qty: number }>();

  for (const r of rows) {
    if (!(r.type in totals)) continue;
    totals[r.type]++;
    const bucket = daily.get(istDate(new Date(r.created_at)));
    if (bucket && r.type === "view") bucket.views++;
    if (bucket && r.type === "order") bucket.orders++;
    if (r.type === "order" && Array.isArray(r.items)) {
      for (const it of r.items) {
        if (typeof it?.n !== "string" || !Number.isFinite(it.q)) continue;
        const key = it.n.trim().toLowerCase();
        const cur = products.get(key) ?? { name: it.n.trim(), qty: 0 };
        cur.qty += Math.max(0, Math.min(99, Math.round(it.q)));
        products.set(key, cur);
      }
    }
  }

  return {
    days,
    totals,
    daily: [...daily.values()],
    topProducts: [...products.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    orderRate: totals.view ? Math.round((totals.order / totals.view) * 100) : null,
  };
}
