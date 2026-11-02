"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { cartTotal, MAX_QTY, type CartLine } from "@/lib/order";
import type { Product } from "@/lib/schema";

/**
 * Customer's cart for one shop. Only {productId: qty} is stored (in localStorage),
 * and lines are rebuilt from the shop's current products — so if the owner changes
 * a price or removes a product, the cart never shows stale data.
 *
 * useSyncExternalStore reads localStorage without a hydration mismatch: the server
 * (and first client paint) see an empty cart, then the saved cart appears.
 */
type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  unpriced: number;
  qtyOf: (id: string) => number;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CHANGE = "vaanistore:cart";

export function useCart() {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readRaw(key: string): string {
  try {
    return localStorage.getItem(key) ?? "{}";
  } catch {
    return "{}"; // blocked storage (rare): the cart just won't keep items
  }
}

function parse(raw: string): Record<string, number> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function CartProvider({
  shopKey,
  products,
  children,
}: {
  shopKey: string;
  products: Product[];
  children: React.ReactNode;
}) {
  const storageKey = `vaanistore.cart.${shopKey}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(storageKey),
    () => "{}",
  );
  const qty = useMemo(() => parse(raw), [raw]);
  const [open, setOpen] = useState(false);

  const write = useCallback(
    (next: Record<string, number>) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage full or blocked */
      }
      window.dispatchEvent(new Event(CHANGE));
    },
    [storageKey],
  );

  const setQty = useCallback(
    (id: string, n: number) => {
      const next = { ...parse(readRaw(storageKey)) };
      const clamped = Math.max(0, Math.min(MAX_QTY, Math.round(n)));
      if (clamped === 0) delete next[id];
      else next[id] = clamped;
      write(next);
    },
    [storageKey, write],
  );

  const clear = useCallback(() => {
    write({});
    setOpen(false);
  }, [write]);

  const value = useMemo<CartContextValue>(() => {
    const lines: CartLine[] = products
      .filter((p) => p.inStock && qty[p.id] > 0)
      .map((p) => ({ product: p, qty: qty[p.id] }));
    const { total, unpriced } = cartTotal(lines);
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total,
      unpriced,
      qtyOf: (id) => qty[id] ?? 0,
      setQty,
      clear,
      open,
      setOpen,
    };
  }, [products, qty, setQty, clear, open]);

  return <CartContext value={value}>{children}</CartContext>;
}
