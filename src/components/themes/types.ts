/**
 * Shop-page theme: Tailwind class strings for each visual slot.
 * Clean app layout (think Swiggy / Zepto): sticky header, shop info card,
 * search, product grid with ADD buttons, cart bar. StorefrontView never
 * hard-codes colours; it asks the theme.
 */
export type ThemeClasses = {
  /** Display name and solid swatch colour for the theme picker. */
  label: string;
  swatch: string;

  page: string;
  muted: string;

  header: string;
  avatar: string;
  brandName: string;
  cartButton: string;
  cartBadge: string;

  card: string;
  title: string;
  tagline: string;
  chip: string;
  badgeOpen: string;
  badgeClosed: string;
  actionSoft: string;
  actionPrimary: string;

  search: string;
  sectionTitle: string;

  productCard: string;
  productImage: string;
  productName: string;
  price: string;
  addButton: string;
  addActive: string;
  stockOverlay: string;

  todayRow: string;
  divider: string;

  stickyBar: string;
  cartBar: string;
  action: string;
  sheetPrimary: string;
};
