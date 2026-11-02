"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { itemCount, t, type UiLang } from "@/lib/i18n";
import type { Product } from "@/lib/schema";
import { formatInr } from "@/lib/whatsapp";
import { AddToCart } from "./cart/AddToCart";
import type { ThemeClasses } from "./themes";

/** Show the search box only when there are enough products to need it. */
const SEARCH_MIN = 6;

/**
 * App-style product grid: optional search, then cards with image, name, unit,
 * price and an ADD button. Client component so search filters instantly.
 */
export function ProductGrid({
  products,
  shopName,
  lang,
  canOrder,
  th,
}: {
  products: Product[];
  shopName: string;
  lang: UiLang;
  canOrder: boolean;
  th: Pick<
    ThemeClasses,
    | "search"
    | "sectionTitle"
    | "muted"
    | "productCard"
    | "productImage"
    | "productName"
    | "price"
    | "addButton"
    | "addActive"
    | "stockOverlay"
  >;
}) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? products.filter((p) => p.name.toLowerCase().includes(needle)) : products;
  }, [products, q]);

  return (
    <section aria-labelledby="products-title" id="products" className="scroll-mt-20">
      {products.length >= SEARCH_MIN && (
        <label className={`mb-4 flex min-h-12 items-center gap-2.5 rounded-xl px-4 ${th.search}`}>
          <Search className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
          <span className="sr-only">{t(lang, "searchIn", { shop: shopName })}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(lang, "searchIn", { shop: shopName })}
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label={t(lang, "clearCart")}
              className="flex h-8 w-8 items-center justify-center rounded-full opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </label>
      )}

      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="products-title" className={`text-lg font-bold @xl:text-xl ${th.sectionTitle}`}>
          {t(lang, "products")}
        </h2>
        <span className={`text-sm ${th.muted}`}>{itemCount(lang, shown.length)}</span>
      </div>

      {shown.length === 0 ? (
        <p className={`rounded-xl px-4 py-8 text-center text-sm ${th.muted}`}>
          {t(lang, "noResults", { q: q.trim() })}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 @2xl:grid-cols-3 @4xl:grid-cols-4 @5xl:grid-cols-5">
          {shown.map((p) => (
            <li
              key={p.id}
              className={`flex flex-col rounded-2xl p-2 transition-shadow ${th.productCard}`}
            >
              <div className="relative">
                {p.imageUrl ? (
                  // Plain <img>: photos are compressed to <300 KB on upload.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    loading="lazy"
                    className={`aspect-square w-full rounded-xl object-cover ${p.inStock ? "" : "grayscale"}`}
                  />
                ) : (
                  <div
                    className={`flex aspect-square w-full items-center justify-center rounded-xl text-5xl font-extrabold ${th.productImage}`}
                    aria-hidden
                  >
                    {p.name.trim().charAt(0).toUpperCase()}
                  </div>
                )}
                {!p.inStock && (
                  <span
                    className={`absolute inset-x-2 bottom-2 rounded-lg py-1 text-center text-xs font-semibold backdrop-blur ${th.stockOverlay}`}
                  >
                    {t(lang, "outOfStock")}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col px-1 pt-2.5 pb-1">
                <h3
                  className={`line-clamp-2 text-[0.9rem] leading-snug font-semibold ${th.productName}`}
                >
                  {p.name}
                </h3>
                {p.unit && <p className={`mt-0.5 text-xs ${th.muted}`}>{p.unit}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  {p.priceInr !== undefined ? (
                    <span className={`font-bold tabular-nums ${th.price}`}>
                      {formatInr(p.priceInr)}
                    </span>
                  ) : (
                    <span className={`text-xs ${th.muted}`}>{t(lang, "priceToConfirm")}</span>
                  )}
                  {p.inStock && canOrder && (
                    <AddToCart
                      productId={p.id}
                      productName={p.name}
                      lang={lang}
                      addClass={th.addButton}
                      activeClass={th.addActive}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
