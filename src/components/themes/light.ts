import type { ThemeClasses } from "./types";

/** Light: clean grocery-app look — light grey page, white cards, one fresh green. */
export const light: ThemeClasses = {
  label: "Light",
  swatch: "#0c831f",

  page: "bg-[#f5f6f8] text-[#1c1c1c]",
  muted: "text-[#5b6170]",

  header: "bg-white/95 border-b border-[#eceef1]",
  avatar: "bg-[#0c831f] text-white",
  brandName: "text-[#1c1c1c]",
  cartButton: "bg-[#e8f5ea] text-[#0a6e1a] hover:bg-[#d6eedb]",
  cartBadge: "bg-[#0c831f] text-white",

  card: "bg-white ring-1 ring-[#eceef1] shadow-[0_1px_2px_rgb(16_24_40/0.04),0_4px_16px_-8px_rgb(16_24_40/0.08)]",
  title: "text-[#1c1c1c]",
  tagline: "text-[#5b6170]",
  chip: "bg-[#f5f6f8] text-[#3d4350]",
  badgeOpen: "bg-[#e8f5ea] text-[#0a6e1a]",
  badgeClosed: "bg-[#f1f2f4] text-[#5b6170]",
  actionSoft: "bg-[#f5f6f8] text-[#1c1c1c] hover:bg-[#eceef1]",
  actionPrimary: "bg-[#0c831f] text-white hover:bg-[#0a6e1a]",

  search:
    "bg-white ring-1 ring-[#e3e6ea] text-[#1c1c1c] placeholder:text-[#646b78] focus-within:ring-2 focus-within:ring-[#0c831f]",
  sectionTitle: "text-[#1c1c1c]",

  productCard: "bg-white ring-1 ring-[#eceef1] hover:shadow-[0_8px_24px_-12px_rgb(16_24_40/0.25)]",
  productImage: "bg-[#f5f6f8] text-[#c5cad3]",
  productName: "text-[#1c1c1c]",
  price: "text-[#1c1c1c]",
  addButton: "bg-white text-[#0c831f] ring-1 ring-[#0c831f] hover:bg-[#e8f5ea]",
  addActive: "bg-[#0c831f] text-white",
  stockOverlay: "bg-white/85 text-[#5b6170]",

  todayRow: "bg-[#e8f5ea] font-semibold text-[#0a6e1a]",
  divider: "border-[#f1f2f4]",

  stickyBar: "bg-white/95 ring-1 ring-[#eceef1] shadow-[0_-6px_24px_-12px_rgb(16_24_40/0.25)]",
  cartBar: "bg-[#0c831f] text-white hover:bg-[#0a6e1a]",
  action: "bg-[#f5f6f8] text-[#1c1c1c] hover:bg-[#eceef1]",
  sheetPrimary: "bg-[#0c831f] text-white hover:bg-[#0a6e1a]",
};
