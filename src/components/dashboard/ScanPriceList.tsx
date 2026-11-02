"use client";

import { Camera, Check, LoaderCircle, ScanLine, X } from "lucide-react";
import { useRef, useState } from "react";
import { compressImage } from "@/lib/image";
import { existingNames, mergeScannedProducts, nameKey, type ScannedProduct } from "@/lib/scan";
import type { Product } from "@/lib/schema";
import { formatInr } from "@/lib/whatsapp";
import { btn } from "../ui/styles";
import { useUi } from "../UiLang";

type State =
  | { step: "idle" }
  | { step: "reading" }
  | { step: "review"; items: ScannedProduct[]; picked: boolean[] }
  | { step: "error"; message: string };

/**
 * Photo of a rate list → AI reads items + prices → owner ticks what to keep → merged
 * into products (existing names get their price updated, new ones are added).
 */
export function ScanPriceList({
  products,
  onChange,
}: {
  products: Product[];
  onChange: (p: Product[]) => void;
}) {
  const { t } = useUi();
  const [state, setState] = useState<State>({ step: "idle" });
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function read(file: File) {
    setDone(null);
    setState({ step: "reading" });
    try {
      // Phone photos are 3–8 MB; 1600px is plenty for reading text and uploads fast.
      const blob = await compressImage(file, { maxBytes: 1_200_000, maxSide: 1600 });
      const form = new FormData();
      form.set("image", new File([blob], "pricelist.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/scan", { method: "POST", body: form });
      const data = (await res.json()) as { products?: ScannedProduct[]; error?: string };
      if (!res.ok || !data.products) {
        setState({ step: "error", message: data.error ?? t("errGeneric") });
      } else if (data.products.length === 0) {
        setState({ step: "error", message: t("scanNone") });
      } else {
        setState({ step: "review", items: data.products, picked: data.products.map(() => true) });
      }
    } catch {
      setState({ step: "error", message: t("errNetwork") });
    }
  }

  function apply() {
    if (state.step !== "review") return;
    const chosen = state.items.filter((_, i) => state.picked[i]);
    const { products: next, added, updated } = mergeScannedProducts(products, chosen);
    onChange(next);
    setState({ step: "idle" });
    setDone(t("scanDone", { a: String(added), u: String(updated) }));
  }

  const known = existingNames(products);

  return (
    <div className="bg-paper-2/70 rounded-2xl p-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label={t("scanList")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void read(file);
          e.target.value = "";
        }}
      />

      {state.step !== "review" && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-surface text-brand-600 ring-line flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1">
            <ScanLine className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-ink-soft min-w-0 flex-1 text-sm">
            {state.step === "reading" ? t("scanning") : t("scanHint")}
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={state.step === "reading"}
            className={`${btn.base} ${btn.sm} ${btn.dark}`}
          >
            {state.step === "reading" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
            {t("scanList")}
          </button>
        </div>
      )}

      {state.step === "error" && (
        <p role="alert" className="bg-danger-50 text-danger mt-3 rounded-xl px-3 py-2 text-sm">
          {state.message}
        </p>
      )}
      {done && (
        <p
          role="status"
          className="text-leaf-600 mt-3 flex items-center gap-1.5 text-sm font-medium"
        >
          <Check className="h-4 w-4" aria-hidden />
          {done}
        </p>
      )}

      {state.step === "review" && (
        <div>
          <p className="mb-2 text-sm font-medium">
            {t("scanFound", { n: String(state.items.length) })}
          </p>
          <ul className="divide-line bg-surface ring-line max-h-80 divide-y overflow-y-auto rounded-xl ring-1">
            {state.items.map((item, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={state.picked[i]}
                    onChange={(e) =>
                      setState({
                        ...state,
                        picked: state.picked.map((v, j) => (j === i ? e.target.checked : v)),
                      })
                    }
                    className="accent-leaf h-5 w-5"
                  />
                  <span className="line-clamp-2 min-w-0 flex-1 leading-snug font-medium">
                    {item.name}
                  </span>
                  <span className="text-ink-soft shrink-0 text-sm tabular-nums">
                    {item.priceInr !== undefined ? formatInr(item.priceInr) : "—"}
                    {item.unit && ` / ${item.unit}`}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${known.has(nameKey(item.name)) ? "bg-marigold/15 text-[#8a5300]" : "bg-leaf-50 text-leaf-600"}`}
                  >
                    {known.has(nameKey(item.name)) ? t("scanUpdate") : t("scanNew")}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={apply}
              disabled={!state.picked.some(Boolean)}
              className={`${btn.base} ${btn.md} ${btn.leaf} flex-1 whitespace-nowrap`}
            >
              <Check className="h-4 w-4" aria-hidden />
              {t("scanApply", { n: String(state.picked.filter(Boolean).length) })}
            </button>
            <button
              type="button"
              onClick={() => setState({ step: "idle" })}
              className={`${btn.base} ${btn.md} ${btn.outline}`}
            >
              <X className="h-4 w-4" aria-hidden />
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
