import { Clock, Copy as CopyIcon, MapPin, Navigation, Phone, Wallet } from "lucide-react";
import { storefrontLang, t } from "@/lib/i18n";
import type { ShopProfile } from "@/lib/schema";
import { buildTelLink, buildWhatsAppLink } from "@/lib/whatsapp";
import { ActionLink } from "./ActionLink";
import { CartButton } from "./cart/CartButton";
import { CartProvider } from "./cart/CartProvider";
import { CartSheet } from "./cart/CartSheet";
import { StickyBar } from "./cart/StickyBar";
import { CopyButton } from "./CopyButton";
import { OpenBadge } from "./OpenBadge";
import { ProductGrid } from "./ProductGrid";
import { StorefrontHours } from "./StorefrontHours";
import { themes, type ThemeClasses } from "./themes";
import { TrackClicks } from "./TrackClicks";
import { LogoMark } from "./ui/Logo";
import { WhatsAppIcon } from "./ui/WhatsAppIcon";

/**
 * The shop page. Shared by the dashboard's live preview and the public /s/<slug> page,
 * so what the owner sees while editing is exactly what customers get.
 *
 * Clean app layout (think Swiggy / Zepto): sticky header with cart → shop info card
 * with Call / WhatsApp / Directions → search + product grid with ADD buttons →
 * about, hours, address, UPI → cart bar. Container queries (@container) drive the
 * breakpoints so the phone-sized preview in the dashboard shows the mobile layout.
 *
 * `demo`: for the sample shop. Its phone number and UPI ID are made up but could
 * belong to a real person, so every contact/payment action is shown but inert.
 */
export function StorefrontView({
  profile,
  demo = false,
  showDemoBanner = true,
  trackSlug,
}: {
  profile: ShopProfile;
  demo?: boolean;
  /** Off for decorative, non-interactive showcases (landing page mockup). */
  showDemoBanner?: boolean;
  /** Public page only: record anonymous visits/taps for the owner's Insights. */
  trackSlug?: string;
}) {
  // Fallback: a profile saved before a theme was removed still renders.
  const th = themes[profile.theme] ?? themes.light;
  const lang = storefrontLang(profile.language);
  // Orders go to WhatsApp number, else the phone (most Indian shop phones have WhatsApp).
  const orderNumber = profile.whatsapp || profile.phone;
  const tel = profile.phone ? buildTelLink(profile.phone) : null;
  const chat = orderNumber ? buildWhatsAppLink(orderNumber) : null;
  const maps = profile.address ? mapsLink(profile) : null;
  const initial = profile.name.trim().charAt(0).toUpperCase();
  const hasProducts = profile.products.length > 0;
  const place = profile.address
    ? [profile.address.line, profile.address.city].filter(Boolean).join(", ")
    : null;

  const actions = [
    tel && {
      key: "call",
      label: t(lang, "call"),
      href: tel,
      external: false,
      track: "call",
      primary: false,
      icon: <Phone className="h-5 w-5" aria-hidden />,
    },
    chat && {
      key: "wa",
      label: t(lang, "whatsapp"),
      href: chat,
      external: true,
      track: "whatsapp",
      primary: true,
      icon: <WhatsAppIcon className="h-5 w-5" />,
    },
    maps && {
      key: "dir",
      label: t(lang, "directions"),
      href: maps,
      external: true,
      track: "directions",
      primary: false,
      icon: <Navigation className="h-5 w-5" aria-hidden />,
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    external: boolean;
    track: string;
    primary: boolean;
    icon: React.ReactNode;
  }[];

  return (
    <CartProvider
      // Demo and showcase copies keep their own carts, so trying the sample shop never
      // leaks into the landing-page mockup or a real shop with the same link name.
      shopKey={demo ? `demo-${showDemoBanner ? "" : "showcase-"}${profile.slug}` : profile.slug}
      products={profile.products}
    >
      <div
        className={`@container relative min-h-full scroll-smooth ${th.page}`}
        lang={lang === "hi" ? "hi" : "en"}
      >
        {trackSlug && !demo && <TrackClicks slug={trackSlug} />}
        {demo && showDemoBanner && (
          <p role="note" className="bg-neutral-950 px-4 py-2 text-center text-[0.8rem] text-white">
            {t(lang, "demoBanner")}
          </p>
        )}

        {/* ── Sticky header ── */}
        <div className={`sticky top-0 z-20 backdrop-blur-md ${th.header}`}>
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 @xl:px-6">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${th.avatar}`}
              aria-hidden
            >
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate leading-tight font-bold ${th.brandName}`}>
                {profile.name}
              </span>
              <span className={`block truncate text-xs ${th.muted}`}>{profile.category}</span>
            </span>
            {orderNumber && hasProducts && (
              <CartButton lang={lang} className={th.cartButton} badgeClass={th.cartBadge} />
            )}
          </div>
        </div>

        <main className="mx-auto max-w-6xl space-y-4 px-4 pt-4 pb-28 @xl:space-y-6 @xl:px-6 @xl:pt-6">
          {/* ── Shop info card ── */}
          <header className={`rounded-2xl p-4 @xl:p-6 ${th.card}`}>
            <div className="@4xl:flex @4xl:items-end @4xl:justify-between @4xl:gap-8">
              <div className="min-w-0">
                <h1
                  className={`text-[1.6rem] leading-tight font-extrabold tracking-tight @xl:text-[2rem] ${th.title}`}
                >
                  {profile.name}
                </h1>
                {profile.tagline && <p className={`mt-1 ${th.tagline}`}>{profile.tagline}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {profile.hours.length > 0 && (
                    <OpenBadge
                      hours={profile.hours}
                      lang={lang}
                      openClass={th.badgeOpen}
                      closedClass={th.badgeClosed}
                    />
                  )}
                  {place && (
                    <span
                      className={`inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-sm ${th.chip}`}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{place}</span>
                    </span>
                  )}
                </div>
              </div>
              {actions.length > 0 && (
                <nav
                  aria-label="Contact"
                  className="mt-4 grid auto-cols-fr grid-flow-col gap-2 @4xl:mt-0 @4xl:w-[26rem] @4xl:shrink-0"
                >
                  {actions.map((a) => (
                    <ActionLink
                      key={a.key}
                      href={a.href}
                      demo={demo}
                      lang={lang}
                      external={a.external}
                      track={a.track}
                      className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-1 rounded-xl text-[0.8rem] font-semibold transition-colors ${a.primary ? th.actionPrimary : th.actionSoft}`}
                    >
                      {a.icon}
                      {a.label}
                    </ActionLink>
                  ))}
                </nav>
              )}
            </div>
          </header>

          {hasProducts && (
            <ProductGrid
              products={profile.products}
              shopName={profile.name}
              lang={lang}
              canOrder={Boolean(orderNumber)}
              th={th}
            />
          )}

          {profile.about && (
            <Section id="about" title={t(lang, "about")} th={th}>
              <p className={`leading-relaxed ${th.muted}`}>{profile.about}</p>
            </Section>
          )}

          <div className="grid items-start gap-4 @xl:gap-6 @4xl:grid-cols-2">
            {profile.hours.length > 0 && (
              <Section
                id="hours"
                title={t(lang, "hours")}
                icon={<Clock className="h-4 w-4" />}
                th={th}
              >
                <StorefrontHours
                  hours={profile.hours}
                  lang={lang}
                  todayClass={th.todayRow}
                  mutedClass={th.muted}
                  dividerClass={th.divider}
                />
              </Section>
            )}
            <div className="space-y-4 @xl:space-y-6">
              {profile.address && (
                <Section
                  id="visit"
                  title={t(lang, "visitUs")}
                  icon={<MapPin className="h-4 w-4" />}
                  th={th}
                >
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
                <Section
                  title={t(lang, "payWithUpi")}
                  icon={<Wallet className="h-4 w-4" />}
                  th={th}
                >
                  <div className="flex items-center gap-2 rounded-xl bg-current/[0.04] p-1.5 pl-4">
                    <code className="min-w-0 flex-1 truncate font-mono text-[0.95rem]">
                      {profile.upiId}
                    </code>
                    {!demo && (
                      <CopyButton
                        text={profile.upiId}
                        label={t(lang, "copy")}
                        copiedLabel={t(lang, "copied")}
                        className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold ${th.actionPrimary}`}
                        icon={<CopyIcon className="h-4 w-4" aria-hidden />}
                      />
                    )}
                  </div>
                </Section>
              )}
            </div>
          </div>

          <footer className={`flex items-center justify-center gap-2 pt-6 text-xs ${th.muted}`}>
            <LogoMark className="h-4 w-4" />
            {t(lang, "madeWith")}
          </footer>
        </main>

        <StickyBar
          tel={tel}
          chat={chat}
          demo={demo}
          lang={lang}
          barClass={th.stickyBar}
          cartClass={th.cartBar}
          actionClass={th.action}
        />
        <CartSheet
          shopName={profile.name}
          orderNumber={orderNumber}
          upiId={profile.upiId}
          language={profile.language}
          lang={lang}
          demo={demo}
          primaryClass={th.sheetPrimary}
        />
      </div>
    </CartProvider>
  );
}

function Section({
  id,
  title,
  icon,
  th,
  children,
}: {
  id?: string;
  title: string;
  icon?: React.ReactNode;
  th: ThemeClasses;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-2xl p-4 @xl:p-6 ${th.card}`}>
      <h2 className={`mb-3 flex items-center gap-2 font-bold ${th.sectionTitle}`}>
        {icon && <span className="opacity-60">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function mapsLink(profile: ShopProfile): string {
  const a = profile.address;
  const query =
    a?.mapsQuery || [profile.name, a?.line, a?.city, a?.pincode].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
