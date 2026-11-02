"use client";

import { ArrowRight, AudioLines, Check, LoaderCircle, Sparkles, Undo2, X } from "lucide-react";
import { useState } from "react";
import { applyPatch, diffProfiles, type EditOp } from "@/lib/patch";
import type { DraftProfile } from "@/lib/schema";
import { btn } from "../ui/styles";
import { useUi } from "../UiLang";
import { VoiceRecorder } from "../VoiceRecorder";

/**
 * Speak a change → /api/edit returns operations → we apply them to a COPY and show
 * a before/after diff. Nothing changes until the owner taps Confirm.
 * Also used to answer a single missing field ("Tell me your phone number").
 */
export function VoiceEditPanel({
  draft,
  onConfirm,
  question,
  onClearQuestion,
  undoCount = 0,
  onUndo,
}: {
  draft: DraftProfile;
  onConfirm: (next: DraftProfile) => void;
  /** English question for the AI when the owner is answering a missing-field prompt. */
  question?: { text: string; label: string } | null;
  onClearQuestion?: () => void;
  undoCount?: number;
  onUndo?: () => void;
}) {
  const { t } = useUi();
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<DraftProfile | null>(null);

  async function understand() {
    setError(null);
    setLoading(true);
    const spoken = question
      ? `Question to owner: "${question.text}" Owner's answer: "${instruction}"`
      : instruction;
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: draft, instruction: spoken }),
      });
      const data = (await res.json()) as { operations?: EditOp[]; error?: string };
      if (!res.ok || !data.operations) {
        setError(data.error ?? t("errGeneric"));
        return;
      }
      setPending(applyPatch(draft, data.operations));
    } catch {
      setError(t("errNetwork"));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPending(null);
    setInstruction("");
    onClearQuestion?.();
  }

  const rows = pending
    ? diffProfiles(draft, pending, {
        closed: t("closed"),
        inStock: t("inStock"),
        outOfStock: t("outOfStock"),
      })
    : [];

  return (
    <section
      className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 ${question ? "bg-brand-50 ring-brand-200 ring-2" : "border-line bg-surface shadow-soft border"}`}
    >
      <div className="relative flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${question ? "bg-surface text-brand-600" : "bg-brand-50 text-brand-600"}`}
        >
          <AudioLines className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{question ? question.label : t("voiceEditTitle")}</h2>
          {!question && <p className="text-ink-soft mt-0.5 text-sm">{t("voiceEditHint")}</p>}
        </div>
        {!question && undoCount > 0 && onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="bg-paper-2 text-ink hover:bg-line inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold"
          >
            <Undo2 className="h-4 w-4" aria-hidden />
            {t("undo")} ({undoCount})
          </button>
        )}
        {question && (
          <button
            type="button"
            onClick={reset}
            aria-label={t("discard")}
            className="text-ink-soft hover:bg-surface flex h-9 w-9 items-center justify-center rounded-full"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="relative mt-5">
        {!pending ? (
          <div className={`space-y-4 rounded-xl p-4 ${question ? "bg-surface" : "bg-paper"}`}>
            <VoiceRecorder value={instruction} onChange={setInstruction} compact placeholder="" />
            <button
              type="button"
              onClick={understand}
              disabled={loading || instruction.trim().length < 2}
              className={`${btn.base} ${btn.md} ${btn.primary} w-full`}
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
              {t("applyChange")}
            </button>
          </div>
        ) : (
          <div className="bg-paper text-ink space-y-3 rounded-xl p-4">
            {rows.length === 0 ? (
              <p className="text-ink-soft">{t("noChanges")}</p>
            ) : (
              <>
                <p className="text-ink-faint text-xs font-semibold tracking-[0.14em] uppercase">
                  {t("changes")}
                </p>
                <ul className="divide-line divide-y">
                  {rows.map((r, i) => (
                    <li key={i} className="py-3 first:pt-1 last:pb-1">
                      <p className="text-sm font-semibold">
                        {t(r.labelKey)}
                        {r.labelExtra && (
                          <span className="text-ink-soft font-normal"> · {r.labelExtra}</span>
                        )}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="bg-danger-50 text-danger decoration-danger/40 rounded-lg px-2 py-0.5 line-through">
                          {r.before || "—"}
                        </span>
                        <ArrowRight className="text-ink-faint h-3.5 w-3.5" aria-hidden />
                        <span className="bg-leaf-50 text-leaf-600 rounded-lg px-2 py-0.5 font-semibold">
                          {r.after || "—"}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex gap-2 pt-1">
              {rows.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onConfirm(pending);
                    reset();
                  }}
                  className={`${btn.base} ${btn.md} ${btn.leaf} flex-1`}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {t("confirm")}
                </button>
              )}
              <button
                type="button"
                onClick={reset}
                className={`${btn.base} ${btn.md} ${btn.outline} flex-1`}
              >
                {t("discard")}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="bg-danger-50 text-danger mt-3 rounded-xl px-3 py-2 text-sm">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
