"use client";

import { CircleCheck, Mic } from "lucide-react";
import { IMPORTANT_FIELDS } from "@/lib/extract";
import type { MessageKey } from "@/lib/i18n";
import { card } from "../ui/styles";
import { useUi } from "../UiLang";

/** English questions sent to the AI alongside the owner's spoken answer. */
const QUESTIONS: Record<string, string> = {
  name: "What is the name of your shop?",
  category: "What kind of shop is it?",
  phone: "What is your phone number? Is it also on WhatsApp?",
  address: "What is your shop's address (market/street, city, pincode)?",
  hours: "What are your opening hours on each day, and which days are you closed?",
  products: "Which products do you sell, and at what prices?",
};

/**
 * Readiness meter + "Tell me your ___" chips for each field the AI didn't hear.
 * Turns "what's missing" into one-tap voice questions instead of a scary form.
 */
export function MissingPrompts({
  missing,
  onAsk,
}: {
  missing: string[];
  onAsk: (q: { text: string; label: string }) => void;
}) {
  const { t } = useUi();
  const total = IMPORTANT_FIELDS.length;
  const done = total - missing.length;
  const pct = Math.round((done / total) * 100);

  return (
    <section className={`${card} p-5`}>
      <div className="flex items-center gap-4">
        {/* Progress ring */}
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90" aria-hidden>
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-paper-2"
              strokeWidth="4"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className={missing.length ? "stroke-kesar-500" : "stroke-leaf"}
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
            {missing.length ? `${done}/${total}` : <CircleCheck className="text-leaf h-6 w-6" />}
          </span>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">
            {missing.length ? t("readyTitle") : t("readyDone")}
          </h2>
          <p className="text-ink-soft text-sm">
            {missing.length
              ? `${t("readyCount", { n: String(done), total: String(total) })} · ${t("readyHint")}`
              : t("readyCount", { n: String(done), total: String(total) })}
          </p>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {missing.map((field) => {
            const label = t("tellMe", { field: t(`f_${field}` as MessageKey).toLowerCase() });
            return (
              <button
                key={field}
                type="button"
                onClick={() => onAsk({ text: QUESTIONS[field] ?? field, label })}
                className="bg-kesar-50 text-kesar-700 ring-kesar-200 hover:bg-kesar-100 inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 transition"
              >
                <Mic className="h-3.5 w-3.5" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
