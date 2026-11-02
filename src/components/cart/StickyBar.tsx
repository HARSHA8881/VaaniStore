"use client";

import { ChevronRight, Phone, ShoppingBag } from "lucide-react";
import { itemCount, t, type UiLang } from "@/lib/i18n";
import { formatInr } from "@/lib/whatsapp";
import { ActionLink } from "../ActionLink";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { useCart } from "./CartProvider";

/**
 * Bottom bar, app style.
 *  - Items in cart: full-width "3 items | ₹160 … View order ›" (every screen size).
 *  - Empty cart: Call + "Chat on WhatsApp" (phone-width layouts only).
 */
export function StickyBar({
  tel,
  chat,
  demo,
  lang,
  barClass,
  cartClass,
  actionClass,
}: {
  tel: string | null;
  chat: string | null;
  demo: boolean;
  lang: UiLang;
  barClass: string;
  cartClass: string;
  actionClass: string;
}) {
  const { count, total, unpriced, setOpen } = useCart();
  const hasCart = count > 0;
  if (!hasCart && !chat) return null;

  return (
    <div
      className={`pointer-events-none sticky bottom-0 z-10 px-3 pb-3 ${hasCart ? "" : "@xl:hidden"}`}
    >
      {hasCart ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`pointer-events-auto mx-auto flex min-h-14 w-full max-w-xl items-center gap-3 rounded-xl px-4 text-left shadow-lg transition-colors ${cartClass}`}
        >
          <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-xs font-medium opacity-85">{itemCount(lang, count)}</span>
            <span className="block font-bold tabular-nums">
              {formatInr(total)}
              {unpriced > 0 && "+"}
            </span>
          </span>
          <span className="flex items-center gap-1 font-bold whitespace-nowrap">
            {t(lang, "viewOrder")}
            <ChevronRight className="h-5 w-5" aria-hidden />
          </span>
        </button>
      ) : (
        <div
          className={`pointer-events-auto mx-auto flex max-w-xl gap-2 rounded-2xl p-2 backdrop-blur-md ${barClass}`}
        >
          {tel && (
            <ActionLink
              href={tel}
              demo={demo}
              lang={lang}
              track="call"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${actionClass}`}
              label={t(lang, "call")}
            >
              <Phone className="h-5 w-5" aria-hidden />
            </ActionLink>
          )}
          {chat && (
            <ActionLink
              href={chat}
              demo={demo}
              lang={lang}
              external
              track="whatsapp"
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-bold ${cartClass}`}
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t(lang, "chatOnWhatsApp")}
            </ActionLink>
          )}
        </div>
      )}
    </div>
  );
}
