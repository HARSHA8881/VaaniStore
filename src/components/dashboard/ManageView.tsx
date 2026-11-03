"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ExternalLink,
  EyeOff,
  LoaderCircle,
  Mic,
  Package,
  Palette,
  Rocket,
  Store,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { SaveStatus } from "@/lib/autosave";
import { toPreviewProfile } from "@/lib/draft";
import type { MessageKey } from "@/lib/i18n";
import type { DraftProfile } from "@/lib/schema";
import { ProfileEditor } from "../ProfileEditor";
import { SharePanel } from "../SharePanel";
import { StorefrontView } from "../StorefrontView";
import { PhoneFrame } from "../ui/PhoneFrame";
import { btn, card } from "../ui/styles";
import { useUi } from "../UiLang";
import { InsightsCard } from "./InsightsCard";
import { MissingPrompts } from "./MissingPrompts";
import { ProductsManager } from "./ProductsManager";
import { ScanPriceList } from "./ScanPriceList";
import { ThemePicker } from "./ThemePicker";
import { VoiceEditPanel } from "./VoiceEditPanel";

export type ManageTab = "products" | "shop" | "insights";

/**
 * Daily-use dashboard for an owner whose shop is saved. Three tabs:
 *   Products  — the list they touch every day (stock, price, add)
 *   Shop      — details, hours, look (rarely changes)
 *   Insights  — visits, orders, share link + QR
 * No Save/Publish to remember: every change auto-saves (see Dashboard).
 */
export function ManageView({
  draft,
  setDraft,
  published,
  shopUrl,
  autoStatus,
  needs,
  onRetry,
  notice,
  onPublish,
  onUnpublish,
  onDelete,
  busy,
  user,
  supabase,
  missing,
  question,
  setQuestion,
  onConfirmVoiceEdit,
  undoCount,
  onUndo,
}: {
  draft: DraftProfile;
  setDraft: (d: DraftProfile) => void;
  published: boolean;
  shopUrl: string | null;
  autoStatus: SaveStatus;
  needs: string[];
  onRetry: () => void;
  /** Message from the last Publish / Hide action (e.g. what's missing). */
  notice: string | null;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  busy: boolean;
  user: User;
  supabase: SupabaseClient | null;
  missing: string[];
  question: { text: string; label: string } | null;
  setQuestion: (q: { text: string; label: string } | null) => void;
  onConfirmVoiceEdit: (next: DraftProfile) => void;
  undoCount: number;
  onUndo: () => void;
}) {
  const { t } = useUi();
  const [tab, setTab] = useState<ManageTab>("products");
  const [voiceOpen, setVoiceOpen] = useState(false);

  const tabs: { id: ManageTab; label: string; icon: React.ReactNode }[] = [
    { id: "products", label: t("tabProducts"), icon: <Package className="h-5 w-5" aria-hidden /> },
    { id: "shop", label: t("tabShop"), icon: <Store className="h-5 w-5" aria-hidden /> },
    {
      id: "insights",
      label: t("tabInsights"),
      icon: <BarChart3 className="h-5 w-5" aria-hidden />,
    },
  ];

  const voicePanel = (
    <VoiceEditPanel
      key={question?.text ?? "edit"}
      draft={draft}
      onConfirm={onConfirmVoiceEdit}
      question={question}
      onClearQuestion={() => setQuestion(null)}
      undoCount={undoCount}
      onUndo={onUndo}
    />
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-32 lg:pt-6 lg:pb-10">
      {/* Status row: save state + live link / publish */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SaveBadge status={autoStatus} needs={needs} published={published} onRetry={onRetry} />
        <span className="ml-auto" />
        {published && shopUrl ? (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn.base} ${btn.sm} ${btn.outline}`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {t("viewMyShop")}
          </a>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            disabled={busy}
            className={`${btn.base} ${btn.sm} ${btn.primary}`}
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Rocket className="h-4 w-4" aria-hidden />
            )}
            {t("publish")}
          </button>
        )}
      </div>

      {notice && (
        <p
          role="alert"
          className="-mt-2 mb-4 rounded-xl bg-[#fff4dc] px-3 py-2 text-sm text-[#8a5300]"
        >
          {notice}
        </p>
      )}

      {/* Desktop tabs */}
      <div className="mb-5 hidden lg:block">
        <div className="bg-paper-2 inline-flex rounded-xl p-1">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id)}
              aria-pressed={tab === x.id}
              className="text-ink-soft aria-pressed:bg-surface aria-pressed:text-ink flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold aria-pressed:shadow-sm"
            >
              {x.icon}
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          {tab === "products" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ScanPriceList
                  products={draft.products}
                  onChange={(p) => setDraft({ ...draft, products: p })}
                />
                <button
                  type="button"
                  onClick={() => setVoiceOpen((v) => !v)}
                  aria-expanded={voiceOpen}
                  className="bg-paper-2/70 flex items-center gap-3 rounded-2xl p-4 text-left"
                >
                  <span className="bg-surface text-brand-600 ring-line flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1">
                    <Mic className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{t("speakToUpdate")}</span>
                    <span className="text-ink-soft block truncate text-sm">
                      {t("voiceEditHint")}
                    </span>
                  </span>
                  <ChevronDown
                    className={`text-ink-faint h-5 w-5 shrink-0 transition ${voiceOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              </div>
              {voiceOpen && voicePanel}
              <ProductsManager
                products={draft.products}
                onChange={(p) => setDraft({ ...draft, products: p })}
                supabase={supabase}
                userId={user.id}
              />
            </>
          )}

          {tab === "shop" && (
            <>
              <MissingPrompts
                missing={missing.filter((m) => m !== "products")}
                onAsk={setQuestion}
              />
              {voicePanel}
              <section className={`${card} p-5 sm:p-6`} aria-labelledby="mv-theme">
                <h2 id="mv-theme" className="mb-4 flex items-center gap-2.5 font-semibold">
                  <span className="bg-paper-2 text-ink-soft flex h-8 w-8 items-center justify-center rounded-xl">
                    <Palette className="h-4 w-4" aria-hidden />
                  </span>
                  {t("theme")}
                </h2>
                <ThemePicker
                  value={draft.theme}
                  onChange={(theme) => setDraft({ ...draft, theme })}
                />
              </section>
              <ProfileEditor
                draft={draft}
                onChange={setDraft}
                missing={missing}
                supabase={supabase}
                userId={user.id}
                hideProducts
              />
              <section className={`${card} space-y-2 p-5`}>
                {published && (
                  <button
                    type="button"
                    onClick={onUnpublish}
                    disabled={busy}
                    className={`${btn.base} ${btn.sm} ${btn.outline} w-full justify-start`}
                  >
                    <EyeOff className="h-4 w-4" aria-hidden />
                    {t("unpublish")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={busy}
                  className={`${btn.base} ${btn.sm} border-danger/30 bg-surface text-danger hover:bg-danger-50 w-full justify-start border`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t("deleteShop")}
                </button>
              </section>
            </>
          )}

          {tab === "insights" && (
            <>
              {published && shopUrl ? (
                <SharePanel url={shopUrl} shopName={draft.name} />
              ) : (
                <section className={`${card} p-5`}>
                  <p className="font-semibold">{t("statusDraft")}</p>
                  <p className="text-ink-soft mt-1 text-sm">{t("notLiveYet")}</p>
                </section>
              )}
              {published && <InsightsCard refreshKey={shopUrl ?? ""} />}
            </>
          )}
        </div>

        <aside
          className="hidden lg:sticky lg:top-20 lg:block lg:self-start"
          aria-label={t("preview")}
        >
          <PhoneFrame scroll className="mx-auto h-[min(46rem,calc(100vh-8rem))] w-[22rem]">
            <StorefrontView profile={toPreviewProfile(draft)} />
          </PhoneFrame>
        </aside>
      </div>

      {/* Phone bottom tabs (app style) */}
      <nav
        aria-label="Dashboard"
        className="border-line bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                setTab(x.id);
                window.scrollTo({ top: 0 });
              }}
              aria-pressed={tab === x.id}
              className="text-ink-faint aria-pressed:text-brand-600 flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold"
            >
              {x.icon}
              {x.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

/** "Saving… / Saved · Live / Couldn't save" pill. */
function SaveBadge({
  status,
  needs,
  published,
  onRetry,
}: {
  status: SaveStatus;
  needs: string[];
  published: boolean;
  onRetry: () => void;
}) {
  const { t } = useUi();
  const base = "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold";

  if (needs.length) {
    const fields = needs.map((f) => t(`f_${f}` as MessageKey)).join(", ");
    return (
      <span role="status" className={`${base} bg-[#fff4dc] text-[#8a5300]`}>
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {t("autoNeedsFix", { fields })}
      </span>
    );
  }
  if (status.state === "pending" || status.state === "saving") {
    return (
      <span role="status" className={`${base} bg-paper-2 text-ink-soft`}>
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
        {t("autoSaving")}
      </span>
    );
  }
  if (status.state === "error") {
    return (
      <span role="status" className={`${base} bg-danger-50 text-danger`}>
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {status.willRetry ? t("autoError") : t("autoErrorFinal")}
        {!status.willRetry && (
          <button type="button" onClick={onRetry} className="ml-1 underline underline-offset-2">
            ↻
          </button>
        )}
      </span>
    );
  }
  return (
    <span role="status" className={`${base} bg-brand-50 text-brand-700`}>
      <Check className="h-4 w-4" aria-hidden />
      {t("autoSaved")}
      {published && (
        <>
          <span aria-hidden>·</span>
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="bg-brand-500 absolute inset-0 animate-ping rounded-full opacity-60" />
            <span className="bg-brand-500 relative h-2 w-2 rounded-full" />
          </span>
          {t("autoLive")}
        </>
      )}
    </span>
  );
}
