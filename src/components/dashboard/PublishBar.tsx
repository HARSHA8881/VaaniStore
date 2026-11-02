"use client";

import { ExternalLink, LoaderCircle, LogIn, Rocket } from "lucide-react";
import Link from "next/link";
import { btn } from "../ui/styles";
import { useUi } from "../UiLang";

/** Sticky bottom bar on phones: the one action that matters is always in reach. */
export function PublishBar({
  loggedIn,
  busy,
  published,
  saved,
  liveUrl,
  status,
  onSave,
  onPublish,
  onUnpublish,
}: {
  loggedIn: boolean;
  busy: boolean;
  published: boolean;
  saved: boolean;
  liveUrl: string | null;
  status: string | null;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  const { t } = useUi();
  const state = published ? "statusLive" : saved ? "statusDraft" : "statusUnsaved";

  return (
    <div className="border-line bg-paper/90 lg:bg-surface lg:shadow-soft sticky bottom-0 z-20 -mx-4 border-t px-4 py-3 backdrop-blur-md lg:static lg:mx-0 lg:rounded-3xl lg:border lg:p-4">
      {status && (
        <p role="status" className="text-ink-soft mb-2 text-center text-sm lg:text-left">
          {status}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span
          className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex ${published ? "bg-leaf-50 text-leaf-600" : "bg-paper-2 text-ink-soft"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${published ? "bg-leaf" : "bg-ink-faint"}`}
            aria-hidden
          />
          {t(state)}
        </span>
        {!loggedIn ? (
          <Link
            href="/login"
            className={`${btn.base} ${btn.md} ${btn.primary} flex-1 sm:ml-auto sm:flex-none`}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            {t("loginToPublish")}
          </Link>
        ) : (
          <>
            {published && liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn.base} ${btn.md} ${btn.ghost} max-sm:hidden sm:ml-auto`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                {t("viewLive")}
              </a>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className={`${btn.base} ${btn.md} ${btn.outline} flex-1 sm:flex-none ${published ? "" : "sm:ml-auto"}`}
            >
              {t("saveDraft")}
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={busy}
              className={`${btn.base} ${btn.md} ${btn.primary} flex-[2] sm:flex-none`}
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Rocket className="h-4 w-4" aria-hidden />
              )}
              {busy ? t("publishing") : t("publish")}
            </button>
          </>
        )}
      </div>
      {loggedIn && published && (
        <button
          type="button"
          onClick={onUnpublish}
          disabled={busy}
          className="text-ink-faint mt-2 w-full text-center text-xs underline-offset-4 hover:underline lg:text-right"
        >
          {t("unpublish")}
        </button>
      )}
    </div>
  );
}
