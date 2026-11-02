import type { ThemeClasses } from "./types";

/** "Mela": festive magenta-to-marigold, chunky type — boutiques, sweet shops, gift stores. */
export const bright: ThemeClasses = {
  label: "Bright",
  page: "bg-[#fff6f3] text-[#2b1033]",
  hero: "bg-gradient-to-br from-[#b0157c] via-[#e63a6e] to-[#ff9a3c] text-white",
  heroArt:
    "bg-[radial-gradient(circle_at_10%_110%,rgb(255_220_120/0.45),transparent_40%),radial-gradient(circle_at_95%_0%,rgb(255_255_255/0.25),transparent_35%)]",
  title: "text-[2.1rem] leading-[1.02] font-extrabold tracking-tight",
  tagline: "text-lg font-medium text-white/90",
  chip: "bg-white/20 text-white backdrop-blur",
  avatar: "bg-white text-[#c21a73] font-extrabold",
  badgeOpen: "bg-[#d9ff7a] text-[#24400a]",
  badgeClosed: "bg-white/85 text-[#4a2050]",
  actionsCard: "bg-white shadow-[0_18px_40px_-18px_rgb(176_21_124/0.45)]",
  action: "text-[#8a1559] hover:bg-[#fdeef5]",
  actionPrimary: "bg-[#17834a] text-white hover:bg-[#116a3b]",
  section: "bg-white rounded-[1.75rem] shadow-[0_10px_30px_-22px_rgb(176_21_124/0.6)]",
  sectionTitle: "text-xl font-extrabold text-[#b0157c]",
  muted: "text-[#6e5672]",
  productCard: "bg-white rounded-3xl shadow-[0_10px_30px_-22px_rgb(176_21_124/0.7)]",
  productName: "font-bold text-[#2b1033]",
  price: "text-lg font-extrabold text-[#c21a73]",
  imagePlaceholder:
    "bg-gradient-to-br from-[#ffd6e8] via-[#ffe1c7] to-[#fff1b8] text-[#c21a73] font-extrabold",
  orderButton: "bg-[#17834a] text-white hover:bg-[#116a3b]",
  stockBadge: "bg-[#2b1033]/80 text-white",
  todayRow: "bg-[#fff0f6] font-bold",
  divider: "border-[#f9e1ec]",
  stickyBar: "bg-white/90 shadow-[0_-8px_30px_-20px_rgb(176_21_124/0.6)]",
  swatch: "linear-gradient(135deg,#b0157c,#e63a6e 50%,#ff9a3c)",
};
