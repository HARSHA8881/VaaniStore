"use client";

import { useEffect } from "react";

/** Last-resort error page when the root layout itself fails. Must render its own <html>. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1>Something went wrong · कुछ गड़बड़ हो गई</h1>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 48,
              padding: "0 24px",
              borderRadius: 12,
              border: 0,
              background: "#ea580c",
              color: "white",
              fontWeight: 600,
            }}
          >
            Try again · फिर कोशिश करें
          </button>
        </div>
      </body>
    </html>
  );
}
