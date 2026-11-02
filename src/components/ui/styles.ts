/**
 * Shared class recipes for the owner app (landing, dashboard, login).
 * Kept as plain strings so they work in server and client components alike.
 */
export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,box-shadow,transform,color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
  lg: "min-h-14 px-7 text-[1.05rem]",
  md: "min-h-12 px-5 text-[0.95rem]",
  sm: "min-h-10 px-4 text-sm",
  primary: "bg-kesar-600 text-white shadow-[0_8px_20px_-8px_rgb(194_71_14/0.7)] hover:bg-kesar-700",
  dark: "bg-ink text-paper hover:bg-ink/90",
  leaf: "bg-leaf text-white hover:bg-leaf-600",
  outline: "border border-line-strong bg-surface text-ink hover:border-ink/30 hover:bg-paper",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
} as const;

export const card = "rounded-3xl border border-line bg-surface shadow-soft";
export const eyebrow = "text-xs font-semibold tracking-[0.14em] text-kesar-600 uppercase";
export const input =
  "w-full rounded-2xl border border-line-strong bg-surface px-4 text-base text-ink placeholder:text-ink-faint transition focus:border-kesar-500 focus:ring-4 focus:ring-kesar-100 focus:outline-none";
