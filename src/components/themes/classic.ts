import type { ThemeClasses } from "./types";

/** "Haveli": warm cream, maroon-to-saffron, serif headings — a traditional signboard, refined. */
export const classic: ThemeClasses = {
  label: "Classic",
  page: "bg-[#fbf5ea] text-[#2a1810]",
  hero: "bg-gradient-to-br from-[#7a1f1a] via-[#a3301b] to-[#d9601e] text-[#fff6e8]",
  heroArt:
    "bg-[radial-gradient(circle_at_85%_15%,rgb(255_200_120/0.35),transparent_45%),radial-gradient(circle_at_1px_1px,rgb(255_240_220/0.12)_1px,transparent_0)] [background-size:auto,14px_14px]",
  title: "font-display text-[2.1rem] leading-[1.05] font-semibold tracking-tight",
  tagline: "font-display text-lg italic text-[#ffe3c2]",
  chip: "bg-[#fff6e8]/15 text-[#fff6e8] ring-1 ring-[#fff6e8]/25",
  avatar: "bg-[#fff6e8] text-[#8a2a18] font-display",
  badgeOpen: "bg-[#e7f6ea] text-[#1d6b36]",
  badgeClosed: "bg-[#fff6e8]/90 text-[#5b3a2a]",
  actionsCard: "bg-white shadow-[0_18px_40px_-20px_rgb(90_30_10/0.45)] ring-1 ring-[#efdcc4]",
  action: "text-[#5b2a18] hover:bg-[#fbf0e2]",
  actionPrimary: "bg-[#17834a] text-white hover:bg-[#116a3b]",
  section: "bg-white ring-1 ring-[#efdcc4] rounded-3xl",
  sectionTitle: "font-display text-xl font-semibold text-[#7a1f1a]",
  muted: "text-[#7b6555]",
  productCard: "bg-white ring-1 ring-[#efdcc4] rounded-2xl",
  productName: "font-semibold text-[#2a1810]",
  price: "font-display text-lg font-semibold text-[#a3301b]",
  imagePlaceholder: "bg-gradient-to-br from-[#fde8cc] to-[#f6cfa3] text-[#a3301b] font-display",
  orderButton: "bg-[#17834a] text-white hover:bg-[#116a3b]",
  stockBadge: "bg-[#2a1810]/80 text-white",
  todayRow: "bg-[#fdf0dd] font-semibold",
  divider: "border-[#f1e2cf]",
  stickyBar: "bg-[#fbf5ea]/90 ring-1 ring-[#efdcc4]",
  swatch: "linear-gradient(135deg,#7a1f1a,#a3301b 45%,#d9601e)",
};
