/**
 * A theme is a set of Tailwind class strings for each visual slot.
 * StorefrontView never hard-codes colours; it asks the theme. Adding a theme
 * means adding one file, not touching the view.
 */
export type ThemeClasses = {
  /** Display name shown in the theme picker. */
  label: string;
  page: string;
  hero: string;
  /** Decorative layer inside the hero (pattern / glow). */
  heroArt: string;
  title: string;
  tagline: string;
  chip: string;
  avatar: string;
  badgeOpen: string;
  badgeClosed: string;
  /** The floating card holding Call / WhatsApp / Directions. */
  actionsCard: string;
  action: string;
  actionPrimary: string;
  section: string;
  sectionTitle: string;
  muted: string;
  productCard: string;
  productName: string;
  price: string;
  imagePlaceholder: string;
  orderButton: string;
  stockBadge: string;
  todayRow: string;
  divider: string;
  stickyBar: string;
  /** Swatch used by the theme picker (any CSS background). */
  swatch: string;
};
