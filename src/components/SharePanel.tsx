"use client";

import { Copy, Download, PartyPopper, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { CopyButton } from "./CopyButton";
import { btn, card } from "./ui/styles";
import { useUi } from "./UiLang";

/**
 * Link + QR code for the published shop. The QR is generated in the browser
 * (no server cost) at high resolution so it stays sharp when printed.
 */
export function SharePanel({ url, shopName }: { url: string; shopName: string }) {
  const { t } = useUi();
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1c1511", light: "#ffffff" },
    })
      .then((data) => active && setQr(data))
      .catch(() => active && setQr(null));
    return () => {
      active = false;
    };
  }, [url]);

  async function nativeShare() {
    try {
      await navigator.share({ title: shopName, url });
    } catch {
      /* user cancelled */
    }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="bg-leaf-50 flex items-start gap-3 p-5">
        <span className="bg-surface text-leaf flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
          <PartyPopper className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-leaf-600 text-xl font-semibold">{t("published")}</h2>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-soft mt-0.5 block truncate text-sm font-medium underline-offset-4 hover:underline"
          >
            {url.replace(/^https?:\/\//, "")}
          </a>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="space-y-2.5">
          <CopyButton
            text={url}
            label={t("copyLink")}
            copiedLabel={t("copied")}
            className={`${btn.base} ${btn.md} ${btn.dark} w-full`}
            icon={<Copy className="h-4 w-4" aria-hidden />}
          />
          {canShare && (
            <button
              type="button"
              onClick={nativeShare}
              className={`${btn.base} ${btn.md} ${btn.outline} w-full`}
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {t("shareMyShop")}
            </button>
          )}
          <p className="text-ink-soft pt-1 text-sm">{t("qrHint")}</p>
        </div>
        {qr && (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt={`QR code for ${shopName}`}
              className="ring-line h-36 w-36 rounded-2xl p-1 ring-1"
            />
            <a
              href={qr}
              download={`${shopName.replace(/[^\w]+/g, "-")}-qr.png`}
              className="text-kesar-600 hover:bg-kesar-50 inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold"
            >
              <Download className="h-4 w-4" aria-hidden />
              {t("downloadQr")}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
