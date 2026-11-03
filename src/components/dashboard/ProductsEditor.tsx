"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ImagePlus, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { newProductId } from "@/lib/extract";
import { uploadProductPhoto } from "@/lib/photos";
import type { Product } from "@/lib/schema";
import { useUi } from "../UiLang";

const small =
  "min-h-10 rounded-xl border border-line-strong bg-surface px-3 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none";

export function ProductsEditor({
  products,
  onChange,
  supabase,
  userId,
}: {
  products: Product[];
  onChange: (p: Product[]) => void;
  supabase: SupabaseClient | null;
  /** Photos need a logged-in owner (they're stored under the owner's folder). */
  userId: string | null;
}) {
  const { t } = useUi();
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (id: string, changes: Partial<Product>) =>
    onChange(products.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  async function upload(id: string, file: File) {
    if (!supabase || !userId) return;
    setError(null);
    setUploading(id);
    try {
      update(id, { imageUrl: await uploadProductPhoto(supabase, userId, id, file) });
    } catch (e) {
      console.error(e);
      setError(t("errGeneric"));
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-2.5">
      {products.map((p) => (
        <div key={p.id} className="bg-surface ring-line flex gap-3 rounded-2xl p-3 ring-1">
          {/* Photo / upload tile */}
          <label
            className={`bg-paper-2 text-ink-faint relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-xl ${userId ? "hover:text-brand-600 cursor-pointer" : ""}`}
            title={userId ? t("photo") : undefined}
          >
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : uploading === p.id ? (
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
            ) : userId ? (
              <ImagePlus className="h-5 w-5" aria-hidden />
            ) : (
              <span className="font-display text-ink-faint text-2xl" aria-hidden>
                {p.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
            {userId && (
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={`${t("photo")}: ${p.name}`}
                disabled={uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(p.id, file);
                  e.target.value = "";
                }}
              />
            )}
          </label>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                aria-label={t("f_products")}
                value={p.name}
                onChange={(e) => update(p.id, { name: e.target.value })}
                placeholder="Parle-G"
                className={`${small} min-w-0 flex-1 font-medium`}
              />
              <button
                type="button"
                onClick={() => onChange(products.filter((x) => x.id !== p.id))}
                aria-label={`${t("remove")}: ${p.name}`}
                className="text-ink-faint hover:bg-danger-50 hover:text-danger flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">{t("price")}</span>
                <span className="text-ink-faint pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
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
                  className={`${small} w-24 pl-7 tabular-nums`}
                />
              </label>
              <label>
                <span className="sr-only">{t("unit")}</span>
                <input
                  value={p.unit ?? ""}
                  onChange={(e) => update(p.id, { unit: e.target.value || undefined })}
                  placeholder={t("unit")}
                  className={`${small} w-24`}
                />
              </label>
              <label className="text-ink-soft ml-auto flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={p.inStock}
                  onChange={(e) => update(p.id, { inStock: e.target.checked })}
                  className="accent-leaf h-5 w-5 rounded"
                />
                {t("inStock")}
              </label>
            </div>
          </div>
        </div>
      ))}
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => onChange([...products, { id: newProductId(), name: "", inStock: true }])}
        className="border-line-strong text-ink-soft hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed font-semibold transition"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t("addProduct")}
      </button>
    </div>
  );
}
