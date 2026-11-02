import type { Day, DayHours } from "./schema";

/** Week order used everywhere we display hours (Indian shops think Monday-first). */
export const DAYS: Day[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const SHOP_TIME_ZONE = "Asia/Kolkata";

/**
 * Day + minutes-since-midnight for a moment, in Indian time.
 * We can't use date.getDay()/getHours() because the server (Vercel) and
 * some visitors run in UTC or other zones — the shop's clock is what matters.
 */
export function shopClock(now: Date): { day: Day; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = get("weekday").toLowerCase().slice(0, 3) as Day;
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function previousDay(day: Day): Day {
  return DAYS[(DAYS.indexOf(day) + 6) % 7];
}

export type OpenStatus = { isOpen: true; closesAt?: string } | { isOpen: false; opensAt?: string };

/**
 * Is the shop open at `now`?
 * Handles three real-world cases:
 *  - normal day:       09:00–22:00
 *  - past midnight:    18:00–02:00 (close < open → spills into next day)
 *  - 24 hours:         open === close
 */
export function getOpenStatus(hours: DayHours[], now: Date): OpenStatus {
  const { day, minutes } = shopClock(now);
  const byDay = new Map(hours.map((h) => [h.day, h]));

  // A late-night shop from yesterday may still be open after midnight.
  const y = byDay.get(previousDay(day));
  if (y && !y.closed && y.open && y.close) {
    const [o, c] = [toMinutes(y.open), toMinutes(y.close)];
    if (c < o && minutes < c) return { isOpen: true, closesAt: y.close };
  }

  const t = byDay.get(day);
  if (!t || t.closed || !t.open || !t.close) return { isOpen: false };

  const [o, c] = [toMinutes(t.open), toMinutes(t.close)];
  if (o === c) return { isOpen: true };
  const isOpen = c > o ? minutes >= o && minutes < c : minutes >= o;
  if (isOpen) return { isOpen: true, closesAt: t.close };
  return minutes < o ? { isOpen: false, opensAt: t.open } : { isOpen: false };
}

/** "21:30" → "9:30 PM". Owners and customers read 12-hour time. */
export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Hours list sorted Mon→Sun with every day present (missing days shown as unknown). */
export function normalizeHours(hours: DayHours[]): (DayHours | { day: Day; unknown: true })[] {
  const byDay = new Map(hours.map((h) => [h.day, h]));
  return DAYS.map((day) => byDay.get(day) ?? { day, unknown: true as const });
}
