"use client";

import { useEffect, useState } from "react";
import { formatTime12, normalizeHours, shopClock } from "@/lib/hours";
import { t, type MessageKey, type UiLang } from "@/lib/i18n";
import type { Day, DayHours } from "@/lib/schema";

/**
 * Weekly hours table. Today's row is highlighted after mount (in IST) — done in
 * the browser because the public page is cached and "today" changes daily.
 */
export function StorefrontHours({
  hours,
  lang,
  todayClass,
  mutedClass,
  dividerClass,
}: {
  hours: DayHours[];
  lang: UiLang;
  todayClass: string;
  mutedClass: string;
  dividerClass: string;
}) {
  const [today, setToday] = useState<Day | null>(null);
  useEffect(() => {
    const update = () => setToday(shopClock(new Date()).day);
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <table className="w-full text-left text-[0.95rem]">
      <tbody>
        {normalizeHours(hours).map((h) => {
          const isToday = h.day === today;
          return (
            <tr
              key={h.day}
              className={`border-b last:border-0 ${dividerClass} ${isToday ? todayClass : ""}`}
            >
              <th scope="row" className="rounded-l-xl py-2.5 pl-3 font-medium">
                {t(lang, `day_${h.day}` as MessageKey)}
                {isToday && (
                  <span className="ml-2 rounded-full bg-current/10 px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase">
                    {t(lang, "today")}
                  </span>
                )}
              </th>
              <td
                className={`rounded-r-xl py-2.5 pr-3 text-right tabular-nums ${isToday ? "" : mutedClass}`}
              >
                {formatHours(h, lang)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatHours(h: ReturnType<typeof normalizeHours>[number], lang: UiLang): string {
  if ("unknown" in h) return t(lang, "notGiven");
  if (h.closed) return t(lang, "closed");
  if (!h.open || !h.close) return t(lang, "notGiven");
  return `${formatTime12(h.open)} – ${formatTime12(h.close)}`;
}
