"use client";

import { useEffect } from "react";

/** Shown when a page crashes. Bilingual because we don't know the owner's language here. */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Something went wrong · कुछ गड़बड़ हो गई
      </h1>
      <p className="text-ink-soft">
        Your draft is saved on this phone. Please try again.
        <br />
        आपका काम इस फ़ोन में सेव है। फिर कोशिश करें।
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="bg-brand-500 hover:bg-brand-600 min-h-12 rounded-full px-6 font-semibold text-white"
      >
        Try again · फिर कोशिश करें
      </button>
    </main>
  );
}
