"use client";

import { useEffect } from "react";

/** Production only: a service worker in dev serves stale code and makes debugging painful. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((e) => console.warn("SW registration failed", e));
  }, []);
  return null;
}
