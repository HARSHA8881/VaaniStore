// Generates the PWA icons (a white mic on saffron) using Next's built-in image renderer.
// Run once: node scripts/make-icons.mjs
import { writeFileSync } from "node:fs";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

function icon(size, { maskable = false } = {}) {
  const s = (n) => Math.round((n / 512) * size);
  // Maskable icons get cropped to a circle on Android, so keep the mic inside the safe zone.
  const scale = maskable ? 0.8 : 1;
  const k = (n) => Math.round(s(n) * scale);
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0C831F",
        borderRadius: maskable ? 0 : s(112),
      },
    },
    h("div", {
      style: { width: k(150), height: k(230), borderRadius: k(75), background: "white" },
    }),
    h("div", {
      style: {
        width: k(250),
        height: k(125),
        marginTop: -k(95),
        border: `${k(28)}px solid white`,
        borderTop: "none",
        borderRadius: `0 0 ${k(125)}px ${k(125)}px`,
      },
    }),
    h("div", { style: { width: k(28), height: k(55), background: "white" } }),
    h("div", { style: { width: k(150), height: k(28), borderRadius: k(14), background: "white" } }),
  );
}

const targets = [
  ["public/icons/icon-192.png", 192, {}],
  ["public/icons/icon-512.png", 512, {}],
  ["public/icons/maskable-512.png", 512, { maskable: true }],
  ["src/app/apple-icon.png", 180, { maskable: true }],
];
for (const [file, size, opts] of targets) {
  const res = new ImageResponse(icon(size, opts), { width: size, height: size });
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log("wrote", file);
}
