"use client";

import { input } from "../ui/styles";
import { useUi } from "../UiLang";

/** Labelled input with a big touch target; highlights fields the AI didn't hear. */
export function Field({
  label,
  value,
  onChange,
  missing = false,
  multiline = false,
  inputMode,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  missing?: boolean;
  multiline?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}) {
  const { t } = useUi();
  const cls = `${input} ${missing ? "border-marigold bg-[#fffaf0]" : ""}`;
  return (
    <label className="block">
      <span className="text-ink-soft mb-1.5 flex items-center gap-2 text-sm font-medium">
        {label}
        {missing && (
          <span className="bg-marigold/15 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold text-[#9a5b00]">
            {t("needed")}
          </span>
        )}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className={`${cls} resize-none py-3 leading-relaxed`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          placeholder={placeholder}
          className={`${cls} min-h-12`}
        />
      )}
    </label>
  );
}
