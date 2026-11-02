import type { ThemeClasses } from "./types";

/** Dark: the same app layout on near-black, with a bright green accent. */
export const dark: ThemeClasses = {
  label: "Dark",
  swatch: "#18181b",

  page: "bg-[#0f0f10] text-neutral-50 [color-scheme:dark]",
  muted: "text-neutral-400",

  header: "bg-[#0f0f10]/95 border-b border-white/10",
  avatar: "bg-[#3ddc6a] text-[#0f0f10]",
  brandName: "text-white",
  cartButton: "bg-white/10 text-white hover:bg-white/15",
  cartBadge: "bg-[#3ddc6a] text-[#0f0f10]",

  card: "bg-[#18181b] ring-1 ring-white/10",
  title: "text-white",
  tagline: "text-neutral-400",
  chip: "bg-white/5 text-neutral-300",
  badgeOpen: "bg-[#3ddc6a]/15 text-[#5ee887]",
  badgeClosed: "bg-white/5 text-neutral-300",
  actionSoft: "bg-white/5 text-white hover:bg-white/10",
  actionPrimary: "bg-[#3ddc6a] text-[#0f0f10] hover:bg-[#5ee887]",

  search:
    "bg-[#18181b] ring-1 ring-white/10 text-white placeholder:text-neutral-500 focus-within:ring-2 focus-within:ring-[#3ddc6a]",
  sectionTitle: "text-white",

  productCard: "bg-[#18181b] ring-1 ring-white/10 hover:ring-white/25",
  productImage: "bg-[#232327] text-neutral-600",
  productName: "text-neutral-100",
  price: "text-white",
  addButton: "bg-transparent text-[#5ee887] ring-1 ring-[#3ddc6a] hover:bg-[#3ddc6a]/10",
  addActive: "bg-[#3ddc6a] text-[#0f0f10]",
  stockOverlay: "bg-black/70 text-neutral-300",

  todayRow: "bg-white/[0.07] font-semibold",
  divider: "border-white/[0.07]",

  stickyBar: "bg-[#18181b]/95 ring-1 ring-white/10",
  cartBar: "bg-[#3ddc6a] text-[#0f0f10] hover:bg-[#5ee887]",
  action: "bg-white/5 text-white hover:bg-white/10",
  sheetPrimary: "bg-[#0c831f] text-white hover:bg-[#0a6e1a]",
};
