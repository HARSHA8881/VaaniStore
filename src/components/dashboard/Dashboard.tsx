"use client";

import {
  ChevronDown,
  Eye,
  Keyboard,
  LoaderCircle,
  LogOut,
  Palette,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  emptyDraft,
  loadLocalDraft,
  mergeExtraction,
  missingFields,
  saveLocalDraft,
  toPreviewProfile,
} from "@/lib/draft";
import type { MessageKey } from "@/lib/i18n";
import type { DraftProfile, ExtractResult } from "@/lib/schema";
import { shopPath } from "@/lib/site";
import { ProfileEditor } from "../ProfileEditor";
import { SharePanel } from "../SharePanel";
import { StorefrontView } from "../StorefrontView";
import { Logo } from "../ui/Logo";
import { PhoneFrame } from "../ui/PhoneFrame";
import { btn, card } from "../ui/styles";
import { UiLangToggle, useUi } from "../UiLang";
import { VoiceRecorder } from "../VoiceRecorder";
import { MissingPrompts } from "./MissingPrompts";
import { PublishBar } from "./PublishBar";
import { ThemePicker } from "./ThemePicker";
import { useOwner } from "./useOwner";
import { VoiceEditPanel } from "./VoiceEditPanel";

const UNDO_LIMIT = 10;

type Saved = { slug: string; published: boolean };

/**
 * Owner flow: speak → transcript → AI extract → edit/preview → (voice edits) → publish.
 * Rendered client-only (see DashboardLoader) because it starts from localStorage.
 */
export function Dashboard() {
  const { t } = useUi();
  const { user, supabase } = useOwner();

  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<DraftProfile | null>(() => loadLocalDraft());
  const [history, setHistory] = useState<DraftProfile[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<{ text: string; label: string } | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  // Keep a local copy of the draft so nothing is lost on refresh / bad network.
  useEffect(() => saveLocalDraft(draft), [draft]);

  // Once logged in, load the saved shop (and use it if there's no local work in progress).
  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch("/api/shop")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { shop: (Saved & { profile: DraftProfile }) | null } | null) => {
        if (!active || !data?.shop) return;
        setSaved({ slug: data.shop.slug, published: data.shop.published });
        setDraft((current) => current ?? data.shop!.profile);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  async function extract() {
    setError(null);
    setExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = (await res.json()) as Partial<ExtractResult> & {
        error?: string;
        manual?: boolean;
      };
      if (res.ok && data.profile) {
        setDraft((d) => mergeExtraction(d ?? emptyDraft(), data.profile!));
      } else {
        setError(data.error ?? t("errGeneric"));
        // Never leave the owner stuck: after AI failure, open the manual form.
        if (data.manual) setDraft((d) => d ?? emptyDraft());
      }
    } catch {
      setError(t("errNetwork"));
    } finally {
      setExtracting(false);
    }
  }

  function confirmVoiceEdit(next: DraftProfile) {
    if (!draft) return;
    setHistory((h) => [...h, draft].slice(-UNDO_LIMIT));
    setDraft(next);
  }

  function undo() {
    const prev = history.at(-1);
    if (!prev) return;
    setDraft(prev);
    setHistory((h) => h.slice(0, -1));
  }

  async function save(publish: boolean) {
    if (!draft) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: draft, publish }),
      });
      const data = (await res.json()) as {
        slug?: string;
        published?: boolean;
        profile?: DraftProfile;
        error?: string;
        fields?: string[];
      };
      if (!res.ok || !data.slug) {
        const fields = data.fields?.map((f) => t(`f_${f}` as MessageKey)).join(", ");
        setStatus(fields ? `${data.error} ${fields}` : (data.error ?? t("errGeneric")));
        return;
      }
      setSaved({ slug: data.slug, published: !!data.published });
      if (data.profile) setDraft(data.profile);
      setStatus(publish ? null : t("saved"));
    } catch {
      setStatus(t("errNetwork"));
    } finally {
      setBusy(false);
    }
  }

  async function deleteShop() {
    if (window.prompt(t("deleteShopConfirm")) !== "DELETE") return;
    setBusy(true);
    try {
      const res = await fetch("/api/shop", { method: "DELETE" });
      if (!res.ok) {
        setStatus(t("errGeneric"));
        return;
      }
      setSaved(null);
      setDraft(null);
      setHistory([]);
      setTranscript("");
      setStatus(null);
      window.alert(t("shopDeleted"));
    } catch {
      setStatus(t("errNetwork"));
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    if (!window.confirm(t("startOver") + "?")) return;
    setDraft(null);
    setHistory([]);
    setTranscript("");
  }

  const missing = draft ? missingFields(draft) : [];
  const shopUrl = saved?.published ? `${window.location.origin}${shopPath(saved.slug)}` : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-line/70 bg-paper/85 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5">
          <Link href="/" aria-label="VaaniStore home" className="mr-auto">
            <Logo />
          </Link>
          <UiLangToggle />
          {user && (
            <button
              type="button"
              onClick={() => supabase?.auth.signOut()}
              className={`${btn.base} ${btn.sm} ${btn.ghost}`}
              title={user.email ?? undefined}
            >
              <span
                className="bg-ink text-paper flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold uppercase"
                aria-hidden
              >
                {(user.email ?? "?").charAt(0)}
              </span>
              <span className="hidden sm:inline">{t("logout")}</span>
              <LogOut className="h-4 w-4 sm:hidden" aria-hidden />
            </button>
          )}
        </div>
      </header>

      {!draft ? (
        <main className="bg-grain flex-1">
          <div className="mx-auto max-w-xl px-4 pt-10 pb-16 sm:pt-14">
            <div className="animate-rise text-center">
              <h1 className="font-display text-[2.4rem] leading-[1.05] font-semibold tracking-tight sm:text-5xl">
                {t("dashboardTitle")}
              </h1>
              <p className="text-ink-soft mx-auto mt-3 max-w-md">{t("recordIntro")}</p>
            </div>

            <section className={`${card} mt-8 p-5 sm:p-7`} aria-label={t("step1")}>
              <VoiceRecorder value={transcript} onChange={setTranscript} />

              <div className="mt-4">
                <p className="text-ink-faint mb-2 text-xs font-semibold tracking-[0.14em] uppercase">
                  {t("tryExamples")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setTranscript((v) => (v ? `${v} ${ex}` : ex))}
                      className="bg-paper-2 text-ink-soft hover:bg-kesar-50 hover:text-kesar-700 rounded-full px-3 py-1.5 text-left text-sm transition"
                    >
                      “{ex}”
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="bg-danger-50 text-danger mt-4 rounded-2xl px-4 py-3 text-sm"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={extract}
                disabled={extracting || transcript.trim().length < 3}
                className={`${btn.base} ${btn.lg} ${btn.primary} mt-6 w-full`}
              >
                {extracting ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="h-5 w-5" aria-hidden />
                )}
                {extracting ? t("building") : t("buildMyPage")}
              </button>
            </section>

            <button
              type="button"
              onClick={() => setDraft(emptyDraft())}
              className="text-ink-soft hover:text-ink mx-auto mt-5 flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              <Keyboard className="h-4 w-4" aria-hidden />
              {t("fillByHand")}
            </button>
          </div>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-6 lg:pt-8">
          {/* Phone-only tabs: editing and previewing don't fit side by side on a small screen. */}
          <div className="bg-paper/90 sticky top-[3.6rem] z-20 -mx-4 mb-4 px-4 py-2 backdrop-blur-md lg:hidden">
            <div className="bg-paper-2 grid grid-cols-2 rounded-full p-1">
              {(["edit", "preview"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    window.scrollTo({ top: 0 });
                  }}
                  aria-pressed={tab === id}
                  className="text-ink-soft aria-pressed:bg-surface aria-pressed:text-ink flex min-h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition aria-pressed:shadow-sm"
                >
                  {id === "edit" ? (
                    <Pencil className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                  {id === "edit" ? t("tabEdit") : t("preview")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className={`space-y-4 ${tab === "edit" ? "" : "hidden lg:block"}`}>
              {shopUrl && <SharePanel url={shopUrl} shopName={draft.name} />}
              {error && (
                <p role="alert" className="bg-danger-50 text-danger rounded-2xl px-4 py-3 text-sm">
                  {error}
                </p>
              )}
              <MissingPrompts missing={missing} onAsk={setQuestion} />
              <VoiceEditPanel
                key={question?.text ?? "edit"}
                draft={draft}
                onConfirm={confirmVoiceEdit}
                question={question}
                onClearQuestion={() => setQuestion(null)}
                undoCount={history.length}
                onUndo={undo}
              />
              <section className={`${card} p-5 sm:p-6`} aria-labelledby="sec-theme">
                <h2 id="sec-theme" className="mb-4 flex items-center gap-2.5 font-semibold">
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
                userId={user?.id ?? null}
              />

              <details className="group rounded-3xl px-2 text-sm">
                <summary className="text-ink-soft hover:text-ink flex min-h-11 cursor-pointer list-none items-center gap-1.5 font-medium">
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden />
                  {t("moreOptions")}
                </summary>
                <div className="flex flex-wrap gap-2 pt-2 pb-4">
                  <button
                    type="button"
                    onClick={startOver}
                    className={`${btn.base} ${btn.sm} ${btn.outline}`}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    {t("startOver")}
                  </button>
                  {saved && (
                    <button
                      type="button"
                      onClick={deleteShop}
                      disabled={busy}
                      className={`${btn.base} ${btn.sm} border-danger/30 bg-surface text-danger hover:bg-danger-50 border`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      {t("deleteShop")}
                    </button>
                  )}
                </div>
              </details>

              <PublishBar
                loggedIn={!!user}
                busy={busy}
                published={!!saved?.published}
                saved={!!saved}
                liveUrl={shopUrl}
                status={status}
                onSave={() => save(saved?.published ?? false)}
                onPublish={() => save(true)}
                onUnpublish={() => save(false)}
              />
            </div>

            <aside
              className={`lg:sticky lg:top-20 lg:self-start ${tab === "preview" ? "" : "hidden lg:block"}`}
              aria-label={t("preview")}
            >
              <p className="text-ink-soft mb-3 hidden items-center justify-center gap-2 text-sm font-medium lg:flex">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="bg-leaf absolute inset-0 animate-ping rounded-full opacity-60" />
                  <span className="bg-leaf relative h-2 w-2 rounded-full" />
                </span>
                {t("livePreview")}
              </p>
              {/* Phones: show the page itself. Desktop: inside a phone frame, scrollable. */}
              <div className="ring-line overflow-clip rounded-3xl ring-1 lg:hidden">
                <StorefrontView profile={toPreviewProfile(draft)} />
              </div>
              <PhoneFrame
                scroll
                className="mx-auto hidden h-[min(46rem,calc(100vh-8rem))] w-[22rem] lg:block"
              >
                <StorefrontView profile={toPreviewProfile(draft)} />
              </PhoneFrame>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}

/** Tap-to-insert examples (no phone numbers: the preview's buttons are live links). */
const EXAMPLES = [
  "Mera naam Gupta Kirana Store hai, subah 9 se raat 10 baje tak, Sunday band.",
  "Atta 5 kilo 280 rupaye, toor dal 140 kilo, Parle-G 10 rupaye.",
  "हम लाजपत नगर मार्केट, दिल्ली में हैं।",
];
