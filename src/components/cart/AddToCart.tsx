"use client";

import { Minus, Plus } from "lucide-react";
import { t, type UiLang } from "@/lib/i18n";
import { useCart } from "./CartProvider";

/** App-style "ADD" button that turns into a − qty + stepper once in the cart. */
export function AddToCart({
  productId,
  productName,
  lang,
  addClass,
  activeClass,
}: {
  productId: string;
  productName: string;
  lang: UiLang;
  addClass: string;
  activeClass: string;
}) {
  const { qtyOf, setQty } = useCart();
  const qty = qtyOf(productId);

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => setQty(productId, 1)}
        className={`min-h-9 w-[4.75rem] rounded-lg text-[0.8rem] font-bold tracking-wide uppercase transition-colors ${addClass}`}
      >
        {t(lang, "add")}
        <span className="sr-only"> {productName}</span>
      </button>
    );
  }

  return (
    <div
      className={`flex min-h-9 w-[4.75rem] items-center justify-between rounded-lg ${activeClass}`}
      role="group"
      aria-label={productName}
    >
      <button
        type="button"
        onClick={() => setQty(productId, qty - 1)}
        aria-label={`${t(lang, "decrease")}: ${productName}`}
        className="flex h-9 w-6 items-center justify-center"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </button>
      <span className="text-sm font-bold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => setQty(productId, qty + 1)}
        aria-label={`${t(lang, "increase")}: ${productName}`}
        className="flex h-9 w-6 items-center justify-center"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </button>
    </div>
  );
}
