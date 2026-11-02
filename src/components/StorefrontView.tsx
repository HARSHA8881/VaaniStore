import { Clock, Copy as CopyIcon, MapPin, Navigation, Phone, Wallet } from "lucide-react";
import { storefrontLang, t } from "@/lib/i18n";
import type { Product, ShopProfile } from "@/lib/schema";
import { buildTelLink, buildWhatsAppLink, formatInr, orderMessage } from "@/lib/whatsapp";
import { CopyButton } from "./CopyButton";
import { OpenBadge } from "./OpenBadge";
import { StorefrontHours } from "./StorefrontHours";
import { themes, type ThemeClasses } from "./themes";
import { LogoMark } from "./ui/Logo";
import { WhatsAppIcon } from "./ui/WhatsAppIcon";

type Lang = "en" | "hi";

/**
 * The shop page. Shared by the dashboard's live preview and the public /s/<slug> page,
 * so what the owner sees while editing is exactly what customers get.
 * No hooks here — it renders on the server for the public page (fast + SEO).
 *
 * Layout uses container queries (@container), not screen size, so the phone-sized
 * preview in the dashboard shows the real mobile layout even on a wide monitor.
 *
 * `demo`: for the sample shop on /preview. Its phone number and UPI ID are made up
 * but could belong to a real person, so Call / WhatsApp / Order / Maps / UPI copy
 * are shown but don't go anywhere.
 */
export function StorefrontView({
  profile,
  demo = false,
  showDemoBanner = true,
}: {
  profile: ShopProfile;
  demo?: boolean;
  /** Off for decorative, non-interactive showcases (landing page mockup). */
  showDemoBanner?: boolean;
}) {
  const th = themes[profile.theme];
  const lang = storefrontLang(profile.language);
  // Orders go to WhatsApp number, else the phone (most Indian shop phones have WhatsApp).
  const orderNumber = profile.whatsapp || profile.phone;
  const tel = profile.phone ? buildTelLink(profile.phone) : null;
  const chat = orderNumber ? buildWhatsAppLink(orderNumber) : null;
  const maps = profile.address ? mapsLink(profile) : null;

  return (
    <div className={`@container relative min-h-full ${th.page}`} lang={lang === "hi" ? "hi" : "en"}>
      {demo && showDemoBanner && (
        <p role="note" className="bg-neutral-950 px-4 py-2 text-center text-[0.8rem] text-white">
          {t(lang, "demoBanner")}
        </p>
      )}

      {/* ── Hero ── */}
      <header className={`relative overflow-hidden ${th.hero}`}>
        <div className={`pointer-events-none absolute inset-0 ${th.heroArt}`} aria-hidden />
        <div className="relative mx-auto max-w-3xl px-5 pt-8 pb-14 @xl:px-8 @xl:pt-12">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm ${th.avatar}`}
              aria-hidden
            >
              {profile.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${th.chip}`}>
              {profile.category}
            </span>
          </div>
          <h1 className={`mt-5 ${th.title}`}>{profile.name}</h1>
          {profile.tagline && <p className={`mt-2 ${th.tagline}`}>{profile.tagline}</p>}
          {profile.hours.length > 0 && (
            <div className="mt-4">
              <OpenBadge
                hours={profile.hours}
                lang={lang}
                openClass={th.badgeOpen}
                closedClass={th.badgeClosed}
              />
            </div>
          )}
        </div>
      </header>

      {/* ── Quick actions (overlaps the hero) ── */}
      {(tel || chat || maps) && (
        <div className="relative mx-auto -mt-8 max-w-3xl px-4 @xl:px-8">
          <nav
            aria-label="Contact"
            className={`grid auto-cols-fr grid-flow-col gap-1 rounded-3xl p-1.5 ${th.actionsCard}`}
          >
            {tel && (
              <ActionLink href={tel} demo={demo} lang={lang} className={actionClass(th.action)}>
                <Phone className="h-5 w-5" aria-hidden />
                {t(lang, "call")}
              </ActionLink>
            )}
            {chat && (
              <ActionLink
                href={chat}
                demo={demo}
                lang={lang}
                external
                className={actionClass(th.actionPrimary)}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {t(lang, "whatsapp")}
              </ActionLink>
            )}
            {maps && (
              <ActionLink
                href={maps}
                demo={demo}
                lang={lang}
                external
                className={actionClass(th.action)}
              >
                <Navigation className="h-5 w-5" aria-hidden />
                {t(lang, "directions")}
              </ActionLink>
            )}
          </nav>
        </div>
      )}

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-6 pb-28 @xl:space-y-6 @xl:px-8">
        {profile.about && (
          <Section title={t(lang, "about")} th={th}>
            <p className={`leading-relaxed ${th.muted}`}>{profile.about}</p>
          </Section>
        )}

        {profile.products.length > 0 && (
          <section aria-labelledby="products-title">
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 id="products-title" className={th.sectionTitle}>
                {t(lang, "products")}
              </h2>
              <span className={`text-sm ${th.muted}`}>
                {t(lang, "itemsCount", { n: String(profile.products.length) })}
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-3 @2xl:grid-cols-3">
              {profile.products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  th={th}
                  lang={lang}
                  demo={demo}
                  orderLink={
                    orderNumber
                      ? buildWhatsAppLink(orderNumber, orderMessage(p, profile.language))
                      : null
                  }
                />
              ))}
            </ul>
          </section>
        )}

        {profile.hours.length > 0 && (
          <Section title={t(lang, "hours")} icon={<Clock className="h-4 w-4" />} th={th}>
            <StorefrontHours
              hours={profile.hours}
              lang={lang}
              todayClass={th.todayRow}
              mutedClass={th.muted}
              dividerClass={th.divider}
            />
          </Section>
        )}

        {profile.address && (
          <Section title={t(lang, "visitUs")} icon={<MapPin className="h-4 w-4" />} th={th}>
            <address className="not-italic">
              <p className="font-medium">{profile.address.line}</p>
              <p className={th.muted}>
                {profile.address.city}
                {profile.address.pincode && ` – ${profile.address.pincode}`}
              </p>
            </address>
            <ActionLink
              href={mapsLink(profile)}
              demo={demo}
              lang={lang}
              external
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-current/30 underline-offset-4 hover:decoration-current"
            >
              {t(lang, "openInMaps")}
            </ActionLink>
          </Section>
        )}

        {profile.upiId && (
          <Section title={t(lang, "payWithUpi")} icon={<Wallet className="h-4 w-4" />} th={th}>
            <div className="flex items-center gap-2 rounded-2xl bg-current/[0.04] p-1.5 pl-4">
              <code className="min-w-0 flex-1 truncate font-mono text-[0.95rem]">
                {profile.upiId}
              </code>
              {!demo && (
                <CopyButton
                  text={profile.upiId}
                  label={t(lang, "copy")}
                  copiedLabel={t(lang, "copied")}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold ${th.actionPrimary}`}
                  icon={<CopyIcon className="h-4 w-4" aria-hidden />}
                />
              )}
            </div>
          </Section>
        )}

        <footer className={`flex items-center justify-center gap-2 pt-6 text-xs ${th.muted}`}>
          <LogoMark className="h-4 w-4 opacity-80" />
          {t(lang, "madeWith")}
        </footer>
      </main>

      {/* ── Sticky contact bar for phone-width layouts ── */}
      {chat && (
        <div className="pointer-events-none sticky bottom-0 z-10 px-3 pb-3 @xl:hidden">
          <div
            className={`pointer-events-auto flex gap-2 rounded-full p-1.5 backdrop-blur-md ${th.stickyBar}`}
          >
            {tel && (
              <ActionLink
                href={tel}
                demo={demo}
                lang={lang}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${th.action}`}
                label={t(lang, "call")}
              >
                <Phone className="h-5 w-5" aria-hidden />
              </ActionLink>
            )}
            <ActionLink
              href={chat}
              demo={demo}
              lang={lang}
              external
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full font-semibold ${th.actionPrimary}`}
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t(lang, "chatOnWhatsApp")}
            </ActionLink>
          </div>
        </div>
      )}
    </div>
  );
}

const actionClass = (tone: string) =>
  `flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-[1.1rem] px-2 text-[0.8rem] font-semibold transition-colors ${tone}`;

function Section({
  title,
  icon,
  th,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  th: ThemeClasses;
  children: React.ReactNode;
}) {
  return (
    <section className={`p-5 ${th.section}`}>
      <h2 className={`mb-3 flex items-center gap-2 ${th.sectionTitle}`}>
        {icon && <span className="opacity-70">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * A link that goes nowhere in demo mode: same look, no href, marked disabled for
 * screen readers, with a tooltip explaining why.
 */
function ActionLink({
  href,
  demo,
  lang,
  external = false,
  className,
  label,
  children,
}: {
  href: string;
  demo: boolean;
  lang: Lang;
  external?: boolean;
  className: string;
  /** Accessible name for icon-only links. */
  label?: string;
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
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}

function ProductCard({
  product,
  th,
  lang,
  demo,
  orderLink,
}: {
  product: Product;
  th: ThemeClasses;
  lang: Lang;
  demo: boolean;
  orderLink: string | null;
}) {
  return (
    <li className={`flex flex-col overflow-hidden ${th.productCard}`}>
      <div className="relative">
        {product.imageUrl ? (
          // Plain <img>: photos are already compressed to <300 KB on upload, and skipping
          // next/image avoids spending the hosting plan's image-optimization quota.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className={`aspect-square w-full object-cover ${product.inStock ? "" : "opacity-60 grayscale"}`}
          />
        ) : (
          <div
            className={`flex aspect-[5/4] w-full items-center justify-center text-4xl ${th.imagePlaceholder} ${product.inStock ? "" : "opacity-60"}`}
            aria-hidden
          >
            {product.name.trim().charAt(0).toUpperCase()}
          </div>
        )}
        {!product.inStock && (
          <span
            className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold backdrop-blur ${th.stockBadge}`}
          >
            {t(lang, "outOfStock")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <h3 className={`text-[0.95rem] leading-snug ${th.productName}`}>{product.name}</h3>
        {product.priceInr !== undefined && (
          <p className={th.price}>
            {formatInr(product.priceInr)}
            {product.unit && (
              <span className={`text-xs font-normal ${th.muted}`}> / {product.unit}</span>
            )}
          </p>
        )}
        {product.inStock && orderLink && (
          <div className="mt-auto pt-2.5">
            <ActionLink
              href={orderLink}
              demo={demo}
              lang={lang}
              external
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-full px-2 text-center text-[0.8rem] font-semibold transition-colors ${th.orderButton}`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              {/* Short on screen, full name for screen readers: "Order on WhatsApp". */}
              {t(lang, "order")}
              <span className="sr-only">{t(lang, "onWhatsApp")}</span>
            </ActionLink>
          </div>
        )}
      </div>
    </li>
  );
}

export function mapsLink(profile: ShopProfile): string {
  const a = profile.address;
  const query =
    a?.mapsQuery || [profile.name, a?.line, a?.city, a?.pincode].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
