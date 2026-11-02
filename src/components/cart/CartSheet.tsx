"use client";

import { Minus, Plus, ShoppingBag, Trash2, Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { t, type UiLang } from "@/lib/i18n";
import { buildOrderMessage, buildUpiLink } from "@/lib/order";
import type { Language } from "@/lib/schema";
import { buildWhatsAppLink, formatInr } from "@/lib/whatsapp";
import { ActionLink } from "../ActionLink";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";
import { useCart } from "./CartProvider";

/**
 * Order review as a native <dialog> (focus trap + Esc for free). Bottom sheet on
 * phones, centred card on wider screens. Sends one WhatsApp message with every
 * line and the total; optionally opens the customer's UPI app for that amount.
 */
export function CartSheet({
  shopName,
  orderNumber,
  upiId,
  language,
  lang,
  demo,
  primaryClass,
}: {
  shopName: string;
  orderNumber?: string;
  upiId?: string;
  language: Language;
  lang: UiLang;
  demo: boolean;
  primaryClass: string;
}) {
  const { lines, total, unpriced, setQty, clear, open, setOpen } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Close automatically if the cart empties while open.
  useEffect(() => {
    if (open && lines.length === 0) setOpen(false);
  }, [open, lines.length, setOpen]);

  const message = buildOrderMessage(shopName, lines, language, { customerName: name, note });
  const sendLink = orderNumber ? buildWhatsAppLink(orderNumber, message) : null;
  const upiLink =
    upiId && !unpriced ? buildUpiLink(upiId, shopName, total, `Order ${shopName}`) : null;

  return (
    <dialog
      ref={ref}
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      aria-labelledby="cart-title"
      className="m-0 mt-auto max-h-[88vh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] bg-white p-0 text-neutral-950 shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-[2px] sm:m-auto sm:max-w-md sm:rounded-[1.75rem]"
    >
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-100 bg-white/95 px-5 py-4 backdrop-blur">
        <ShoppingBag className="h-5 w-5 text-neutral-500" aria-hidden />
        <h2 id="cart-title" className="flex-1 text-lg font-semibold">
          {t(lang, "yourOrder")}
        </h2>
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm text-neutral-500 hover:bg-neutral-100"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {t(lang, "clearCart")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t(lang, "closeSheet")}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <ul className="divide-y divide-neutral-100 px-5">
        {lines.map(({ product: p, qty }) => (
          <li key={p.id} className="flex items-center gap-3 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-sm text-neutral-500">
                {p.priceInr !== undefined
                  ? `${formatInr(p.priceInr)}${p.unit ? ` / ${p.unit}` : ""}`
                  : t(lang, "priceToConfirm")}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1">
              <button
                type="button"
                onClick={() => setQty(p.id, qty - 1)}
                aria-label={`${t(lang, "decrease")}: ${p.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="w-7 text-center font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(p.id, qty + 1)}
                aria-label={`${t(lang, "increase")}: ${p.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="w-16 text-right font-semibold tabular-nums">
              {p.priceInr !== undefined ? formatInr(p.priceInr * qty) : "—"}
            </p>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-neutral-100 px-5 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="font-medium text-neutral-600">{t(lang, "total")}</span>
          <span className="text-2xl font-bold tabular-nums">
            {formatInr(total)}
            {unpriced > 0 && <span className="text-sm font-normal text-neutral-500"> +</span>}
          </span>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-600">{t(lang, "yourName")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            autoComplete="name"
            className="min-h-11 w-full rounded-xl border border-neutral-300 px-3 focus:border-neutral-900 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-neutral-600">{t(lang, "orderNote")}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 140))}
            placeholder={t(lang, "orderNotePlaceholder")}
            className="min-h-11 w-full rounded-xl border border-neutral-300 px-3 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
          />
        </label>
      </div>

      <div className="sticky bottom-0 space-y-2 bg-white px-5 pt-4 pb-5">
        {sendLink && (
          <ActionLink
            href={sendLink}
            demo={demo}
            lang={lang}
            external
            track="order"
            trackItems={JSON.stringify(lines.map((l) => ({ n: l.product.name, q: l.qty })))}
            className={`flex min-h-13 w-full items-center justify-center gap-2 rounded-full text-base font-semibold ${primaryClass}`}
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t(lang, "sendOrder")}
          </ActionLink>
        )}
        {upiLink && (
          <>
            <ActionLink
              href={upiLink}
              demo={demo}
              lang={lang}
              track="upi"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-neutral-300 font-semibold hover:bg-neutral-50"
            >
              <Wallet className="h-5 w-5" aria-hidden />
              {t(lang, "payUpi", { amount: formatInr(total) })}
            </ActionLink>
            <p className="text-center text-xs text-neutral-500">{t(lang, "upiHint")}</p>
          </>
        )}
      </div>
    </dialog>
  );
}
