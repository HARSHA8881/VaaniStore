"use client";

import { Check } from "lucide-react";
import type { Theme } from "@/lib/schema";
import { themes } from "../themes";
import { useUi } from "../UiLang";

/** Theme cards with a tiny mock of each look. */
export function ThemePicker({ value, onChange }: { value: Theme; onChange: (t: Theme) => void }) {
  const { t } = useUi();
  return (
    <div role="radiogroup" aria-label={t("theme")} className="grid grid-cols-2 gap-2.5">
      {(Object.keys(themes) as Theme[]).map((theme) => {
        const selected = value === theme;
        return (
          <button
            key={theme}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(theme)}
            className={`group bg-surface relative overflow-hidden rounded-2xl text-left ring-1 transition ${selected ? "ring-ink ring-2" : "ring-line hover:ring-line-strong"}`}
          >
            <span
              className="block h-14 border-b border-black/5"
              style={{ background: themes[theme].swatch }}
            />
            <span className="block space-y-1 p-2.5" aria-hidden>
              <span className="bg-ink/15 block h-1.5 w-3/4 rounded-full" />
              <span className="bg-ink/10 block h-1.5 w-1/2 rounded-full" />
            </span>
            <span className="block px-2.5 pb-2.5 text-sm font-semibold">
              {t(`theme_${theme}` as "theme_light")}
            </span>
            {selected && (
              <span className="bg-ink text-paper absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full">
                <Check className="h-3.5 w-3.5" aria-hidden />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
