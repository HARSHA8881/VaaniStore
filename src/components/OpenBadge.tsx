"use client";

import { useEffect, useState } from "react";
import { formatTime12, getOpenStatus, type OpenStatus } from "@/lib/hours";
import { t, type UiLang } from "@/lib/i18n";
import type { DayHours } from "@/lib/schema";

/**
 * Computed in the browser, not on the server: the public page is cached, so a
 * server-computed "Open now" would go stale. Re-checks every minute.
 */
export function OpenBadge({
  hours,
  lang,
  openClass,
  closedClass,
}: {
  hours: DayHours[];
  lang: UiLang;
  openClass: string;
  closedClass: string;
}) {
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    const update = () => setStatus(getOpenStatus(hours, new Date()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  // Reserve the space before the first client render so the layout doesn't jump.
  if (!status) return <span className="inline-block h-8" aria-hidden />;

  const detail = status.isOpen
    ? status.closesAt && t(lang, "closesAt", { time: formatTime12(status.closesAt) })
    : status.opensAt && t(lang, "opensAt", { time: formatTime12(status.opensAt) });

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-sm font-semibold ${
        status.isOpen ? openClass : closedClass
      }`}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        {status.isOpen && (
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
        )}
        <span
          className={`relative h-2 w-2 rounded-full ${status.isOpen ? "bg-emerald-500" : "bg-current opacity-50"}`}
        />
      </span>
      {t(lang, status.isOpen ? "openNow" : "closedNow")}
      {detail && <span className="font-medium">· {detail}</span>}
    </span>
  );
}
