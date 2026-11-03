"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Camera, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { newProductId } from "@/lib/extract";
import { uploadProductPhoto } from "@/lib/photos";
import type { Product } from "@/lib/schema";
import { btn, card, input } from "../ui/styles";
import { useUi } from "../UiLang";

/**
 * The shopkeeper's daily screen: every product in one list.
 *  - flip the switch when something runs out / comes back
 *  - change a price right in the row
 *  - tap a product to rename it, change unit/photo, or delete it
 *  - big "+ Add product" button
 * Every change calls onChange; the dashboard auto-saves it.
 */
export function ProductsManager({
  products,
  onChange,
  supabase,
  userId,
}: {
  products: Product[];
  onChange: (p: Product[]) => void;
  supabase: SupabaseClient | null;
  userId: string | null;
}) {
  const { t } = useUi();
  const [q, setQ] = useState("");
  const [onlyOut, setOnlyOut] = useState(false);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const outCount = products.filter((p) => !p.inStock).length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(
      (p) => (!onlyOut || !p.inStock) && (!needle || p.name.toLowerCase().includes(needle)),
    );
  }, [products, q, onlyOut]);

  const update = (id: string, changes: Partial<Product>) =>
    onChange(products.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  function saveFromSheet(p: Product) {
    const exists = products.some((x) => x.id === p.id);
    onChange(exists ? products.map((x) => (x.id === p.id ? p : x)) : [p, ...products]);
    setEditing(null);
  }

  return (
    <section aria-labelledby="pm-title" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="pm-title" className="text-xl font-bold">
            {t("tabProducts")}
          </h2>
          <p className="text-ink-soft text-sm">
            {t("productsSummary", { n: String(products.length), m: String(outCount) })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className={`${btn.base} ${btn.md} ${btn.primary} max-sm:hidden`}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("addProductTitle")}
        </button>
      </div>

      {products.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="border-line-strong bg-surface focus-within:border-brand-500 focus-within:ring-brand-100 flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 focus-within:ring-4">
            <Search className="text-ink-faint h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchProducts")}
              aria-label={t("searchProducts")}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
          <div className="bg-paper-2 flex rounded-xl p-1 text-sm">
            {[false, true].map((out) => (
              <button
                key={String(out)}
                type="button"
                onClick={() => setOnlyOut(out)}
                aria-pressed={onlyOut === out}
                className="text-ink-soft aria-pressed:bg-surface aria-pressed:text-ink min-h-9 rounded-lg px-3 font-medium whitespace-nowrap aria-pressed:shadow-sm"
              >
                {out ? `${t("filterOut")} (${outCount})` : t("filterAll")}
              </button>
            ))}
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <p className={`${card} text-ink-soft p-6 text-center`}>{t("emptyProducts")}</p>
      ) : (
        <ul className={`${card} divide-line divide-y overflow-hidden`}>
          {shown.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-label={`${t("editProductTitle")}: ${p.name}`}
              >
                <Thumb product={p} />
                <span className="min-w-0">
                  <span
                    className={`block truncate font-semibold ${p.inStock ? "" : "text-ink-faint line-through"}`}
                  >
                    {p.name || "—"}
                  </span>
                  <span className="text-ink-soft block truncate text-xs">
                    {p.unit || (p.inStock ? t("inStock") : t("outOfStock"))}
                  </span>
                </span>
              </button>
              <label className="relative shrink-0">
                <span className="sr-only">
                  {t("price")} {p.name}
                </span>
                <span className="text-ink-faint pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={p.priceInr ?? ""}
                  onChange={(e) =>
                    update(p.id, {
                      priceInr:
                        e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="border-line-strong bg-surface focus:border-brand-500 focus:ring-brand-100 min-h-10 w-[5.5rem] rounded-lg border pr-2 pl-6 text-right font-semibold tabular-nums focus:ring-4 focus:outline-none"
                />
              </label>
              <StockSwitch
                checked={p.inStock}
                onChange={(v) => update(p.id, { inStock: v })}
                label={`${t("inStock")}: ${p.name}`}
              />
            </li>
          ))}
          {shown.length === 0 && (
            <li className="text-ink-soft px-4 py-6 text-center text-sm">
              {t("noResults", { q: q.trim() })}
            </li>
          )}
        </ul>
      )}

      {/* Phones: big add button pinned above the bottom tabs. */}
      <div className="sticky bottom-20 z-10 sm:hidden">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className={`${btn.base} ${btn.lg} ${btn.primary} shadow-lift w-full`}
        >
          <Plus className="h-5 w-5" aria-hidden />
          {t("addProductTitle")}
        </button>
      </div>

      {editing && (
        <ProductSheet
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          onSave={saveFromSheet}
          onDelete={(id) => {
            onChange(products.filter((p) => p.id !== id));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
          supabase={supabase}
          userId={userId}
        />
      )}
    </section>
  );
}

function Thumb({ product }: { product: Product }) {
  return product.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.imageUrl}
      alt=""
      className={`h-12 w-12 shrink-0 rounded-xl object-cover ${product.inStock ? "" : "grayscale"}`}
    />
  ) : (
    <span
      className="bg-paper-2 text-ink-faint flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
      aria-hidden
    >
      {product.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Big, thumb-friendly on/off switch. */
function StockSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-line-strong"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`}
        aria-hidden
      />
    </button>
  );
}

/** Add / edit form as a bottom sheet (native <dialog>: focus trap + Esc for free). */
function ProductSheet({
  product,
  onSave,
  onDelete,
  onClose,
  supabase,
  userId,
}: {
  product: Product | null;
  onSave: (p: Product) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  supabase: SupabaseClient | null;
  userId: string | null;
}) {
  const { t } = useUi();
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Product>(
    () => product ?? { id: newProductId(), name: "", inStock: true },
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  async function pickPhoto(file: File) {
    if (!supabase || !userId) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductPhoto(supabase, userId, draft.id, file);
      setDraft((d) => ({ ...d, imageUrl: url }));
    } catch {
      setError(t("errGeneric"));
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setError(t("productNameRequired"));
      return;
    }
    onSave({ ...draft, name, unit: draft.unit?.trim() || undefined });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="ps-title"
      className="bg-surface text-ink m-0 mt-auto max-h-[92vh] w-full max-w-none overflow-y-auto rounded-t-3xl p-0 shadow-2xl backdrop:bg-black/40 sm:m-auto sm:max-w-md sm:rounded-3xl"
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 id="ps-title" className="text-lg font-bold">
            {product ? t("editProductTitle") : t("addProductTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeSheet")}
            className="hover:bg-paper flex h-10 w-10 items-center justify-center rounded-full"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {userId && (
          <label className="border-line-strong hover:border-brand-400 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-3">
            {draft.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <span className="bg-paper text-ink-faint flex h-16 w-16 items-center justify-center rounded-xl">
                {uploading ? (
                  <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden />
                ) : (
                  <Camera className="h-6 w-6" aria-hidden />
                )}
              </span>
            )}
            <span className="text-brand-600 font-semibold">
              {draft.imageUrl ? t("changePhoto") : t("addPhoto")}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickPhoto(f);
                e.target.value = "";
              }}
            />
          </label>
        )}

        <label className="block">
          <span className="text-ink-soft mb-1.5 block text-sm font-medium">{t("productName")}</span>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Parle-G"
            autoFocus={!product}
            className={`${input} min-h-12`}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-ink-soft mb-1.5 block text-sm font-medium">{t("price")}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={draft.priceInr ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  priceInr: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
                })
              }
              className={`${input} min-h-12 tabular-nums`}
            />
          </label>
          <label className="block">
            <span className="text-ink-soft mb-1.5 block text-sm font-medium">{t("unit")}</span>
            <input
              value={draft.unit ?? ""}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
              placeholder="kg / packet"
              className={`${input} min-h-12`}
            />
          </label>
        </div>
        <div className="bg-paper flex items-center justify-between rounded-xl px-4 py-3">
          <span className="font-medium">{t("inStock")}</span>
          <StockSwitch
            checked={draft.inStock}
            onChange={(v) => setDraft({ ...draft, inStock: v })}
            label={t("inStock")}
          />
        </div>

        {error && (
          <p role="alert" className="bg-danger-50 text-danger rounded-xl px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {product && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("deleteProductConfirm", { name: product.name }))) {
                  onDelete(product.id);
                }
              }}
              className={`${btn.base} ${btn.md} border-danger/30 bg-surface text-danger hover:bg-danger-50 border`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t("deleteProduct")}
            </button>
          )}
          <button type="submit" className={`${btn.base} ${btn.md} ${btn.primary} flex-1`}>
            {t("save")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
