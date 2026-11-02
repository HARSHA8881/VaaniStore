"use client";

import { BarChart3, Eye, Phone, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import type { Insights } from "@/lib/insights";
import { card } from "../ui/styles";
import { useUi } from "../UiLang";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";

/** Last 7 days of anonymous activity on the owner's published page. */
export function InsightsCard({ refreshKey }: { refreshKey: string }) {
  const { t, lang } = useUi();
  const [data, setData] = useState<Insights | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/shop/insights", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { insights: Insights | null } | null) => active && setData(d?.insights ?? null))
      .catch(() => active && setData(null));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (data === null) return null; // not published / not available
  const loading = data === undefined;
  const max = Math.max(1, ...(data?.daily.map((d) => d.views) ?? [1]));
  const weekday = (date: string) =>
    new Date(`${date}T12:00:00+05:30`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
      weekday: "short",
      timeZone: "Asia/Kolkata",
    });

  const tiles = [
    { label: t("visits"), value: data?.totals.view, icon: <Eye className="h-4 w-4" aria-hidden /> },
    {
      label: t("waTaps"),
      value: data?.totals.whatsapp,
      icon: <WhatsAppIcon className="h-4 w-4" />,
    },
    {
      label: t("callsLabel"),
      value: data?.totals.call,
      icon: <Phone className="h-4 w-4" aria-hidden />,
    },
    {
      label: t("ordersLabel"),
      value: data?.totals.order,
      icon: <ShoppingBag className="h-4 w-4" aria-hidden />,
    },
  ];

  return (
    <section className={`${card} p-5 sm:p-6`} aria-labelledby="insights-title" aria-busy={loading}>
      <h2 id="insights-title" className="mb-4 flex items-center gap-2.5 font-semibold">
        <span className="bg-paper-2 text-ink-soft flex h-8 w-8 items-center justify-center rounded-xl">
          <BarChart3 className="h-4 w-4" aria-hidden />
        </span>
        {t("insightsTitle")}
      </h2>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-paper ring-line rounded-2xl p-3.5 ring-1">
            <dt className="text-ink-soft flex items-center gap-1.5 text-xs font-medium">
              {tile.icon}
              {tile.label}
            </dt>
            <dd className="font-display mt-1 text-3xl font-semibold tabular-nums">
              {loading ? (
                <span className="bg-paper-2 inline-block h-8 w-10 animate-pulse rounded" />
              ) : (
                tile.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      {data && (
        <>
          {data.totals.view === 0 ? (
            <p className="bg-paper-2/60 text-ink-soft mt-4 rounded-2xl px-4 py-3 text-sm">
              {t("noVisits")}
            </p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_14rem]">
              <div>
                <div
                  className="flex h-28 items-end gap-2"
                  role="img"
                  aria-label={`${t("visits")}: ${data.daily.map((d) => d.views).join(", ")}`}
                >
                  {data.daily.map((d) => (
                    <div
                      key={d.date}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    >
                      <span className="text-ink-faint text-[0.7rem] tabular-nums">
                        {d.views || ""}
                      </span>
                      <span
                        className="bg-brand-400/80 w-full rounded-t-lg"
                        style={{ height: `${Math.max(4, (d.views / max) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-2">
                  {data.daily.map((d) => (
                    <span key={d.date} className="text-ink-faint flex-1 text-center text-[0.7rem]">
                      {weekday(d.date)}
                    </span>
                  ))}
                </div>
                {data.orderRate !== null && (
                  <p className="text-ink-soft mt-3 text-sm">
                    {t("orderRate", { n: String(data.orderRate) })}
                  </p>
                )}
              </div>
              {data.topProducts.length > 0 && (
                <div>
                  <p className="text-ink-faint mb-2 text-xs font-semibold tracking-[0.14em] uppercase">
                    {t("topOrdered")}
                  </p>
                  <ol className="space-y-1.5">
                    {data.topProducts.map((p, i) => (
                      <li key={p.name} className="flex items-center gap-2 text-sm">
                        <span className="text-ink-faint w-4 tabular-nums">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                        <span className="bg-leaf-50 text-leaf-600 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                          × {p.qty}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
          <p className="text-ink-faint mt-4 text-xs">{t("insightsPrivacy")}</p>
        </>
      )}
    </section>
  );
}
