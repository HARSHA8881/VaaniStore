"use client";

import { Languages } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import { t as translate, type MessageKey, type UiLang } from "@/lib/i18n";

/**
 * Owner-facing UI language (English / Hindi), remembered in localStorage.
 * useSyncExternalStore keeps every component in sync without a context provider
 * and renders English on the server, so there's no hydration mismatch.
 */
const KEY = "vaanistore.uiLang";
const listeners = new Set<() => void>();

function read(): UiLang {
  try {
    return localStorage.getItem(KEY) === "hi" ? "hi" : "en";
  } catch {
    return "en"; // private mode / blocked storage
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function setUiLang(lang: UiLang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore — the toggle still works for this page view via listeners */
  }
  listeners.forEach((l) => l());
}

export function useUi() {
  const lang = useSyncExternalStore(subscribe, read, () => "en" as UiLang);
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string>) => translate(lang, key, vars),
    [lang],
  );
  return { lang, t };
}

export function UiLangToggle({ className = "" }: { className?: string }) {
  const { lang } = useUi();
  return (
    <button
      type="button"
      onClick={() => setUiLang(lang === "en" ? "hi" : "en")}
      className={`border-line-strong bg-surface text-ink hover:border-ink/30 inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition ${className}`}
      aria-label="Switch language / भाषा बदलें"
    >
      <Languages className="text-ink-soft h-4 w-4" aria-hidden />
      {lang === "en" ? "हिंदी" : "English"}
    </button>
  );
}
