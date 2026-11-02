"use client";

import { ShoppingBag } from "lucide-react";
import { itemCount, t, type UiLang } from "@/lib/i18n";
import { useCart } from "./CartProvider";

/** Header cart icon with a count badge. Opens the order sheet when it has items. */
export function CartButton({
  lang,
  className,
  badgeClass,
}: {
  lang: UiLang;
  className: string;
  badgeClass: string;
}) {
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => count > 0 && setOpen(true)}
      aria-label={`${t(lang, "cart")}: ${itemCount(lang, count)}`}
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${className}`}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden />
      {count > 0 && (
        <span
          className={`absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.7rem] font-bold tabular-nums ${badgeClass}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
