import { describe, expect, it } from "vitest";
import { formatTime12, getOpenStatus, shopClock } from "./hours";
import type { DayHours } from "./schema";

// Build a Date for a given IST wall-clock time. IST is UTC+5:30 with no DST.
// 2026-11-02 is a Monday.
function ist(dateIso: string, time: string): Date {
  return new Date(`${dateIso}T${time}:00+05:30`);
}
const MON = "2026-11-02";
const TUE = "2026-11-03";
const SUN = "2026-11-08";

const regular: DayHours[] = [
  { day: "mon", open: "09:00", close: "22:00", closed: false },
  { day: "tue", open: "09:00", close: "22:00", closed: false },
  { day: "sun", closed: true },
];

describe("shopClock", () => {
  it("uses Indian time regardless of the machine's time zone", () => {
    // 20:00 UTC Sunday = 01:30 IST Monday
    expect(shopClock(new Date("2026-11-01T20:00:00Z"))).toEqual({ day: "mon", minutes: 90 });
  });
});

describe("getOpenStatus", () => {
  it("is open during hours and reports closing time", () => {
    expect(getOpenStatus(regular, ist(MON, "12:00"))).toEqual({ isOpen: true, closesAt: "22:00" });
  });

  it("is closed before opening and reports opening time", () => {
    expect(getOpenStatus(regular, ist(MON, "08:30"))).toEqual({ isOpen: false, opensAt: "09:00" });
  });

  it("treats closing time as closed (exclusive end)", () => {
    expect(getOpenStatus(regular, ist(MON, "22:00")).isOpen).toBe(false);
  });

  it("is closed on a closed day", () => {
    expect(getOpenStatus(regular, ist(SUN, "12:00"))).toEqual({ isOpen: false });
  });

  it("is closed on a day with no hours given", () => {
    expect(getOpenStatus(regular, ist("2026-11-04", "12:00")).isOpen).toBe(false);
  });

  it("handles shops open past midnight", () => {
    const late: DayHours[] = [{ day: "mon", open: "18:00", close: "02:00", closed: false }];
    expect(getOpenStatus(late, ist(MON, "23:00")).isOpen).toBe(true);
    // 01:00 Tuesday is still Monday's shift
    expect(getOpenStatus(late, ist(TUE, "01:00"))).toEqual({ isOpen: true, closesAt: "02:00" });
    expect(getOpenStatus(late, ist(TUE, "03:00")).isOpen).toBe(false);
  });

  it("treats open === close as 24 hours", () => {
    const allDay: DayHours[] = [{ day: "mon", open: "00:00", close: "00:00", closed: false }];
    expect(getOpenStatus(allDay, ist(MON, "03:00")).isOpen).toBe(true);
  });
});

describe("formatTime12", () => {
  it.each([
    ["00:00", "12:00 AM"],
    ["09:05", "9:05 AM"],
    ["12:00", "12:00 PM"],
    ["22:30", "10:30 PM"],
  ])("%s → %s", (input, expected) => {
    expect(formatTime12(input)).toBe(expected);
  });
});
