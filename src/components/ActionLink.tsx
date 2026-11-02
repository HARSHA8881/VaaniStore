import { t, type UiLang } from "@/lib/i18n";

/**
 * A link that goes nowhere in demo mode: same look, no href, marked disabled for
 * screen readers, with a tooltip explaining why. Shared by server and client parts
 * of the storefront.
 */
export function ActionLink({
  href,
  demo,
  lang,
  external = false,
  className,
  label,
  track,
  trackItems,
  children,
}: {
  href: string;
  demo: boolean;
  lang: UiLang;
  external?: boolean;
  className: string;
  /** Accessible name for icon-only links. */
  label?: string;
  /** Analytics event name; picked up by <TrackClicks>. */
  track?: string;
  /** JSON for order events: [{ n: name, q: qty }]. */
  trackItems?: string;
  children: React.ReactNode;
}) {
  if (demo) {
    return (
      <a
        role="link"
        aria-disabled="true"
        aria-label={label}
        title={t(lang, "demoBanner")}
        className={`${className} cursor-not-allowed`}
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      aria-label={label}
      className={className}
      data-track={track}
      data-track-items={trackItems}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}
