import { describe, expect, it } from "vitest";
import { istDate, summarize, type EventRow } from "./insights";

const now = new Date("2026-11-02T12:00:00+05:30");
const at = (iso: string) => new Date(iso).toISOString();

describe("istDate", () => {
  it("uses Indian dates, not UTC", () => {
    // 20:00 UTC on Nov 1 is 01:30 IST on Nov 2
    expect(istDate(new Date("2026-11-01T20:00:00Z"))).toBe("2026-11-02");
  });
});

describe("summarize", () => {
  const rows: EventRow[] = [
    { type: "view", items: null, created_at: at("2026-11-02T10:00:00+05:30") },
    { type: "view", items: null, created_at: at("2026-11-02T11:00:00+05:30") },
    { type: "view", items: null, created_at: at("2026-11-01T09:00:00+05:30") },
    { type: "whatsapp", items: null, created_at: at("2026-11-02T10:01:00+05:30") },
    {
      type: "order",
      items: [
        { n: "Parle-G", q: 2 },
        { n: "Toor Dal", q: 1 },
      ],
      created_at: at("2026-11-02T10:05:00+05:30"),
    },
    {
      type: "order",
      items: [{ n: "parle-g ", q: 3 }],
      created_at: at("2026-10-31T18:00:00+05:30"),
    },
  ];

  it("counts totals, daily views/orders and top products", () => {
    const s = summarize(rows, now, 7);
    expect(s.totals).toMatchObject({ view: 3, whatsapp: 1, order: 2, call: 0 });
    expect(s.daily).toHaveLength(7);
    expect(s.daily.at(-1)).toEqual({ date: "2026-11-02", views: 2, orders: 1 });
    expect(s.daily.at(-2)).toEqual({ date: "2026-11-01", views: 1, orders: 0 });
    expect(s.topProducts).toEqual([
      { name: "Parle-G", qty: 5 },
      { name: "Toor Dal", qty: 1 },
    ]);
    expect(s.orderRate).toBe(67);
  });

  it("handles a shop with no activity", () => {
    const s = summarize([], now);
    expect(s.orderRate).toBeNull();
    expect(s.topProducts).toEqual([]);
    expect(s.daily.every((d) => d.views === 0)).toBe(true);
  });

  it("ignores malformed order items", () => {
    const s = summarize(
      [
        {
          type: "order",
          items: [{ n: 5, q: "x" }] as never,
          created_at: at("2026-11-02T10:00:00+05:30"),
        },
      ],
      now,
    );
    expect(s.topProducts).toEqual([]);
  });
});
