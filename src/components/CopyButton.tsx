"use client";

import { Check } from "lucide-react";
import { useState } from "react";

/** Copies text and briefly shows a confirmation. Used for UPI ID and share links. */
export function CopyButton({
  text,
  label,
  copiedLabel,
  className = "",
  icon,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked on http or old WebViews; selecting the text is the fallback.
      window.prompt(label, text);
    }
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? <Check className="h-4 w-4" aria-hidden /> : icon}
      {copied ? copiedLabel : label}
    </button>
  );
}
