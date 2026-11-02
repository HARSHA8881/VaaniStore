"use client";

import { useEffect } from "react";

/**
 * Anonymous analytics for public shop pages only (not previews).
 *  - one "view" per browser session per shop
 *  - taps on elements marked data-track="call|whatsapp|directions|order|upi"
 * Uses sendBeacon so tracking never delays opening WhatsApp or the dialer.
 */
export function TrackClicks({ slug }: { slug: string }) {
  useEffect(() => {
    const send = (type: string, items?: unknown) => {
      const body = JSON.stringify({ slug, type, ...(items ? { items } : {}) });
      try {
        const blob = new Blob([body], { type: "application/json" });
        if (!navigator.sendBeacon?.("/api/track", blob)) {
          void fetch("/api/track", {
            method: "POST",
            body,
            keepalive: true,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch {
        /* never let analytics break the page */
      }
    };

    try {
      const key = `vaanistore.viewed.${slug}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        send("view");
      }
    } catch {
      send("view");
    }

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el || el.getAttribute("aria-disabled") === "true") return;
      const type = el.dataset.track!;
      let items: unknown;
      if (el.dataset.trackItems) {
        try {
          items = JSON.parse(el.dataset.trackItems);
        } catch {
          /* ignore */
        }
      }
      send(type, items);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [slug]);

  return null;
}
