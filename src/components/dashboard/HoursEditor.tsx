"use client";

import { Copy } from "lucide-react";
import { DAYS } from "@/lib/hours";
import type { MessageKey } from "@/lib/i18n";
import type { Day, DayHours } from "@/lib/schema";
import { useUi } from "../UiLang";

/** One row per day: open/closed switch + native time pickers (phones show their own wheel). */
export function HoursEditor({
  hours,
  onChange,
}: {
  hours: DayHours[];
  onChange: (h: DayHours[]) => void;
}) {
  const { t } = useUi();
  const get = (day: Day) => hours.find((h) => h.day === day);

  function update(day: Day, entry: DayHours | null) {
    const rest = hours.filter((h) => h.day !== day);
    onChange(entry ? [...rest, entry] : rest);
  }

  function copyMondayToAll() {
    const mon = get("mon");
    if (!mon) return;
    onChange(DAYS.map((day) => ({ ...mon, day })));
  }

  const timeCls =
    "min-h-10 w-[6.6rem] rounded-xl border border-line-strong bg-surface px-2 text-sm tabular-nums focus:border-kesar-500 focus:ring-4 focus:ring-kesar-100 focus:outline-none";

  return (
    <div className="space-y-1.5">
      {DAYS.map((day) => {
        const h = get(day);
        const isOpen = h ? !h.closed : false;
        const dayName = t(`day_${day}` as MessageKey);
        return (
          <div
            key={day}
            className={`flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-3 py-2 ${isOpen ? "bg-surface ring-line ring-1" : "bg-paper-2/60"}`}
          >
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) =>
                  update(
                    day,
                    e.target.checked
                      ? { day, open: h?.open ?? "09:00", close: h?.close ?? "21:00", closed: false }
                      : { day, closed: true },
                  )
                }
                className="peer sr-only"
              />
              {/* Switch */}
              <span
                className="bg-line-strong peer-checked:bg-leaf peer-focus-visible:ring-kesar-100 relative h-6 w-10 shrink-0 rounded-full transition peer-focus-visible:ring-4 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4"
                aria-hidden
              />
              <span className="w-24 font-medium">{dayName}</span>
              {!isOpen && <span className="text-ink-faint text-sm">{t("closed")}</span>}
            </label>
            {isOpen && h && (
              <span className="text-ink-faint flex items-center gap-1.5">
                <input
                  type="time"
                  aria-label={`${dayName} ${t("open")}`}
                  value={h.open ?? ""}
                  onChange={(e) => update(day, { ...h, open: e.target.value })}
                  className={timeCls}
                />
                –
                <input
                  type="time"
                  aria-label={`${dayName} ${t("close")}`}
                  value={h.close ?? ""}
                  onChange={(e) => update(day, { ...h, close: e.target.value })}
                  className={timeCls}
                />
              </span>
            )}
          </div>
        );
      })}
      {get("mon") && (
        <button
          type="button"
          onClick={copyMondayToAll}
          className="text-kesar-600 hover:bg-kesar-50 mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold"
        >
          <Copy className="h-4 w-4" aria-hidden />
          {t("sameEveryDay")}
        </button>
      )}
    </div>
  );
}
