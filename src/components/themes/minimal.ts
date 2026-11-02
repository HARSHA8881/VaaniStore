import type { ThemeClasses } from "./types";

/** "Studio": white, ink and hairlines — clean and confident for mobile, medical, electronics. */
export const minimal: ThemeClasses = {
  label: "Minimal",
  page: "bg-white text-neutral-950",
  hero: "bg-[#f6f5f2] text-neutral-950",
  heroArt:
    "bg-[linear-gradient(to_right,rgb(0_0_0/0.04)_1px,transparent_1px)] [background-size:28px_100%]",
  title: "text-[2.1rem] leading-[1.05] font-semibold tracking-[-0.03em]",
  tagline: "text-lg text-neutral-600",
  chip: "bg-white text-neutral-700 ring-1 ring-neutral-200",
  avatar: "bg-neutral-950 text-white font-semibold",
  badgeOpen: "bg-white text-emerald-700 ring-1 ring-emerald-200",
  badgeClosed: "bg-white text-neutral-600 ring-1 ring-neutral-200",
  actionsCard: "bg-white ring-1 ring-neutral-200 shadow-[0_12px_32px_-24px_rgb(0_0_0/0.5)]",
  action: "text-neutral-900 hover:bg-neutral-100",
  actionPrimary: "bg-neutral-950 text-white hover:bg-neutral-800",
  section: "border-t border-neutral-200 rounded-none",
  sectionTitle: "text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase",
  muted: "text-neutral-500",
  productCard: "bg-white ring-1 ring-neutral-200 rounded-xl",
  productName: "font-medium text-neutral-950",
  price: "text-base font-semibold text-neutral-950 tabular-nums",
  imagePlaceholder: "bg-neutral-100 text-neutral-400 font-semibold",
  orderButton: "bg-neutral-950 text-white hover:bg-neutral-800",
  stockBadge: "bg-white/90 text-neutral-700 ring-1 ring-neutral-200",
  todayRow: "bg-neutral-100 font-semibold",
  divider: "border-neutral-100",
  stickyBar: "bg-white/90 ring-1 ring-neutral-200",
  swatch: "linear-gradient(135deg,#f6f5f2 50%,#0a0a0a 50%)",
};
