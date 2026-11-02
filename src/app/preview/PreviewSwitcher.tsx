"use client";

import Link from "next/link";
import { useState } from "react";
import { StorefrontView } from "@/components/StorefrontView";
import { themes } from "@/components/themes";
import { Logo } from "@/components/ui/Logo";
import { sampleShop } from "@/lib/sample";
import type { Language, Theme } from "@/lib/schema";

const THEMES = Object.keys(themes) as Theme[];
const LANGS: { id: Language; label: string }[] = [
  { id: "hinglish", label: "Hinglish" },
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
];

/** Sample shop with a floating toolbar to try every theme and language. */
export function PreviewSwitcher() {
  const [theme, setTheme] = useState<Theme>("classic");
  const [language, setLanguage] = useState<Language>("hinglish");

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <div className="border-line bg-paper/85 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <Link href="/" aria-label="VaaniStore home" className="mr-auto">
            <Logo />
          </Link>
          <div className="bg-surface ring-line flex items-center gap-1 rounded-full p-1 ring-1">
            {THEMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTheme(name)}
                aria-pressed={theme === name}
                className="text-ink-soft aria-pressed:bg-ink aria-pressed:text-paper flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-sm font-medium transition"
              >
                <span
                  className="h-6 w-6 rounded-full ring-1 ring-black/10"
                  style={{ background: themes[name].swatch }}
                  aria-hidden
                />
                {themes[name].label}
              </button>
            ))}
          </div>
          <div className="bg-surface ring-line flex items-center gap-1 rounded-full p-1 ring-1">
            {LANGS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setLanguage(id)}
                aria-pressed={language === id}
                className="text-ink-soft aria-pressed:bg-ink aria-pressed:text-paper rounded-full px-3 py-1 text-sm font-medium transition"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-5xl flex-1 sm:px-4 sm:py-8">
        <div className="sm:shadow-lift sm:ring-line overflow-clip sm:rounded-[2rem] sm:ring-1">
          <StorefrontView profile={{ ...sampleShop, theme, language }} demo />
        </div>
      </div>
    </div>
  );
}
