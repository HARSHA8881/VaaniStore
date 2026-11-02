"use client";

import {
  ArrowRight,
  AudioLines,
  Check,
  Clock,
  Mic,
  Navigation,
  Pencil,
  QrCode,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { StorefrontView } from "@/components/StorefrontView";
import { UiLangToggle, useUi } from "@/components/UiLang";
import { Logo } from "@/components/ui/Logo";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { btn, eyebrow } from "@/components/ui/styles";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { sampleShop } from "@/lib/sample";

const COPY = {
  en: {
    nav: { sample: "Sample shop", open: "Open app" },
    pill: "Hindi · English · Hinglish",
    h1a: "Bolo, aur dukaan",
    h1b: "online.",
    sub: "Describe your shop out loud — in the language you think in. VaaniStore turns it into a beautiful page with your products, timings, map and a WhatsApp order button.",
    cta: "Start speaking",
    demo: "See a sample shop",
    trust: ["Free to start", "No typing needed", "Works on any phone"],
    bubble: "“Mera naam Sharma General Store hai, subah 9 se raat 10…”",
    toast: "Your page is ready",
    howEyebrow: "How it works",
    howTitle: "From your voice to your shop page",
    steps: [
      {
        title: "Speak",
        text: "Tap the mic and talk about your shop like you would to a customer.",
      },
      {
        title: "Check",
        text: "We fill in name, hours, products and prices. Fix anything by voice or touch.",
      },
      {
        title: "Share",
        text: "Publish, share the link on WhatsApp, and print a QR for your counter.",
      },
    ],
    understandEyebrow: "It understands you",
    understandTitle: "Say it your way. We'll get the details right.",
    understandSub:
      "Spoken times, Hindi numbers, prices in rupees — turned into clean, correct details. And if you didn't say something, we ask instead of guessing.",
    featuresEyebrow: "What your customers get",
    featuresTitle: "Everything a customer needs, nothing they don't",
    features: [
      {
        title: "Order on WhatsApp",
        text: "Every product has a button that opens a ready-made order message.",
      },
      { title: "Open now", text: "Customers see at a glance if you're open, and when you close." },
      { title: "Directions", text: "One tap opens Google Maps to your shop." },
      { title: "UPI ready", text: "Your UPI ID with a copy button for quick payment." },
      { title: "Counter QR", text: "Print a QR code so walk-in customers save your shop." },
      { title: "Light and fast", text: "Loads quickly on slow networks and cheap phones." },
    ],
    finalTitle: "Your shop deserves to be found.",
    finalSub: "Just say it. We'll build it.",
    footer: "Made for India's small shops",
    privacy: "Privacy",
  },
  hi: {
    nav: { sample: "नमूना दुकान", open: "ऐप खोलें" },
    pill: "हिंदी · English · Hinglish",
    h1a: "बोलिए, और दुकान",
    h1b: "ऑनलाइन।",
    sub: "अपनी दुकान के बारे में बोलकर बताइए — उसी भाषा में जिसमें आप सोचते हैं। VaaniStore उसे सामान, समय, नक्शे और WhatsApp ऑर्डर बटन वाले सुंदर पेज में बदल देता है।",
    cta: "बोलना शुरू करें",
    demo: "नमूना दुकान देखें",
    trust: ["शुरू करना मुफ़्त", "टाइप करने की ज़रूरत नहीं", "किसी भी फ़ोन पर"],
    bubble: "“मेरा नाम शर्मा जनरल स्टोर है, सुबह 9 से रात 10…”",
    toast: "आपका पेज तैयार है",
    howEyebrow: "कैसे काम करता है",
    howTitle: "आपकी आवाज़ से आपकी दुकान का पेज",
    steps: [
      {
        title: "बोलिए",
        text: "माइक दबाएँ और दुकान के बारे में वैसे बताएँ जैसे ग्राहक को बताते हैं।",
      },
      { title: "जाँचिए", text: "हम नाम, समय, सामान और दाम भर देंगे। बोलकर या छूकर कुछ भी बदलें।" },
      {
        title: "शेयर कीजिए",
        text: "पब्लिश करें, WhatsApp पर लिंक भेजें, और काउंटर के लिए QR प्रिंट करें।",
      },
    ],
    understandEyebrow: "आपकी बात समझता है",
    understandTitle: "जैसे चाहें वैसे बोलिए। हम सही जानकारी भरेंगे।",
    understandSub:
      "बोले गए समय, हिंदी में गिनती, रुपयों में दाम — सब साफ़ और सही। और जो आपने नहीं बताया, उसके लिए हम अंदाज़ा नहीं लगाते, पूछते हैं।",
    featuresEyebrow: "ग्राहकों को क्या मिलता है",
    featuresTitle: "ग्राहक को जो चाहिए, बस वही",
    features: [
      { title: "WhatsApp पर ऑर्डर", text: "हर सामान पर बटन, जो तैयार ऑर्डर मैसेज खोलता है।" },
      { title: "अभी खुला है", text: "ग्राहक तुरंत देखें कि दुकान खुली है या नहीं।" },
      { title: "रास्ता", text: "एक टैप में Google Maps पर आपकी दुकान।" },
      { title: "UPI", text: "कॉपी बटन के साथ आपकी UPI ID।" },
      { title: "काउंटर QR", text: "QR प्रिंट करें ताकि ग्राहक आपकी दुकान सेव करें।" },
      { title: "हल्का और तेज़", text: "धीमे नेटवर्क और सस्ते फ़ोन पर भी जल्दी खुलता है।" },
    ],
    finalTitle: "आपकी दुकान दिखनी चाहिए।",
    finalSub: "बस बोलिए। बाकी हम बनाएँगे।",
    footer: "भारत की छोटी दुकानों के लिए",
    privacy: "गोपनीयता",
  },
};

/** Examples for "It understands you": what the owner says → what we fill in. */
const EXAMPLES = [
  {
    said: "Subah 9 se raat 10 baje tak khule hain, Sunday band.",
    got: ["Mon–Sat · 9:00 AM – 10:00 PM", "Sunday · Closed"],
  },
  {
    said: "Parle-G das rupaye, Maggi chaudah, atta paanch kilo 280.",
    got: ["Parle-G · ₹10", "Maggi · ₹14", "Atta · ₹280 / 5 kg"],
  },
  {
    said: "रविवार को भी 10 से 2 खुला रखो",
    got: ["Sunday · 10:00 AM – 2:00 PM"],
  },
];

const STEP_ICONS = [Mic, Pencil, QrCode];
const FEATURE_ICONS = [WhatsAppIcon, Clock, Navigation, Wallet, QrCode, Zap];

export function Landing() {
  const { lang } = useUi();
  const c = COPY[lang];

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Nav ── */}
      <header className="border-line/70 bg-paper/80 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <Link href="/" aria-label="VaaniStore home" className="mr-auto">
            <Logo />
          </Link>
          <Link
            href="/preview"
            className="text-ink-soft hover:text-ink hidden text-sm font-medium sm:block"
          >
            {c.nav.sample}
          </Link>
          <UiLangToggle />
          <Link href="/dashboard" className={`${btn.base} ${btn.sm} ${btn.dark} max-sm:hidden`}>
            {c.nav.open}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-grain relative overflow-x-clip">
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-12 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-28">
            <div className="">
              <span className="border-brand-200 bg-brand-50 text-brand-700 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium">
                <AudioLines className="h-4 w-4" aria-hidden />
                {c.pill}
              </span>
              <h1 className="text-ink mt-6 text-[3rem] leading-[1] font-extrabold tracking-[-0.035em] sm:text-[4.2rem]">
                {c.h1a} <span className="text-brand-500">{c.h1b}</span>
              </h1>
              <p className="text-ink-soft mt-6 max-w-xl text-lg leading-relaxed">{c.sub}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className={`${btn.base} ${btn.lg} ${btn.primary}`}>
                  <Mic className="h-5 w-5" aria-hidden />
                  {c.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/preview" className={`${btn.base} ${btn.lg} ${btn.outline}`}>
                  {c.demo}
                </Link>
              </div>
              <ul className="text-ink-soft mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {c.trust.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="text-leaf h-4 w-4" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phone showcase: the real storefront component with sample data. */}
            <div className="relative mx-auto mt-12 w-full max-w-[22rem] lg:mt-0" aria-hidden inert>
              {/* Solid saffron disc behind the phone: colour without gradients. */}
              <div
                className="bg-brand-100 absolute top-[12%] left-1/2 aspect-square w-[118%] -translate-x-1/2 rounded-full"
                aria-hidden
              />
              <PhoneFrame className="h-[38rem] rotate-[1.5deg]">
                <StorefrontView profile={sampleShop} demo showDemoBanner={false} />
              </PhoneFrame>

              <div className="animate-float bg-ink text-paper shadow-lift absolute -top-14 -left-4 max-w-[15rem] rounded-2xl rounded-bl-md p-4 text-sm sm:-left-24">
                <div className="mb-2 flex h-4 items-end gap-[3px]">
                  {[0.6, 1, 0.75, 0.9, 0.5, 0.8, 0.65].map((h, i) => (
                    <span
                      key={i}
                      className="animate-bar bg-brand-400 w-[3px] origin-bottom rounded-full"
                      style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
                <p className="leading-snug">{c.bubble}</p>
              </div>

              <div className="bg-surface text-ink shadow-lift ring-line absolute -right-3 bottom-24 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 sm:-right-10">
                <span className="bg-leaf-50 text-leaf flex h-7 w-7 items-center justify-center rounded-full">
                  <Check className="h-4 w-4" />
                </span>
                {c.toast}
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-line bg-surface border-t">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
            <p className={eyebrow}>{c.howEyebrow}</p>
            <h2 className="mt-3 max-w-2xl text-4xl leading-tight font-extrabold tracking-tight">
              {c.howTitle}
            </h2>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {c.steps.map((step, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <li
                    key={step.title}
                    className="group border-line bg-paper hover:shadow-soft relative rounded-3xl border p-7 transition hover:-translate-y-0.5"
                  >
                    <span className="bg-brand-50 text-brand-600 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold">
                      {i + 1}
                    </span>
                    <span className="bg-surface text-brand-600 ring-line absolute top-7 right-7 flex h-11 w-11 items-center justify-center rounded-2xl ring-1">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                    <p className="text-ink-soft mt-2 leading-relaxed">{step.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ── It understands you ── */}
        <section className="bg-paper">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
            <div>
              <p className={eyebrow}>{c.understandEyebrow}</p>
              <h2 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight">
                {c.understandTitle}
              </h2>
              <p className="text-ink-soft mt-5 text-lg leading-relaxed">{c.understandSub}</p>
            </div>
            <ul className="space-y-4">
              {EXAMPLES.map((ex) => (
                <li
                  key={ex.said}
                  className="border-line bg-surface shadow-soft grid items-center gap-3 rounded-3xl border p-4 sm:grid-cols-[1fr_auto_1fr] sm:p-5"
                >
                  <p className="text-ink flex items-start gap-2.5 text-[0.95rem] leading-snug">
                    <span className="bg-brand-50 text-brand-600 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                      <Mic className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="italic">“{ex.said}”</span>
                  </p>
                  <Sparkles className="text-marigold mx-auto hidden h-5 w-5 sm:block" aria-hidden />
                  <div className="flex flex-wrap gap-1.5">
                    {ex.got.map((g) => (
                      <span
                        key={g}
                        className="bg-leaf-50 text-leaf-600 rounded-full px-3 py-1.5 text-sm font-medium"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-line bg-surface border-t">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
            <p className={eyebrow}>{c.featuresEyebrow}</p>
            <h2 className="mt-3 max-w-2xl text-4xl leading-tight font-extrabold tracking-tight">
              {c.featuresTitle}
            </h2>
            <ul className="border-line bg-line mt-12 grid gap-px overflow-hidden rounded-3xl border sm:grid-cols-2 lg:grid-cols-3">
              {c.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <li key={f.title} className="bg-surface p-7">
                    <span className="bg-paper text-ink ring-line flex h-11 w-11 items-center justify-center rounded-2xl ring-1">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                    <p className="text-ink-soft mt-1.5 leading-relaxed">{f.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="px-5 pb-20">
          <div className="bg-brand-500 relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-16 text-center text-white sm:py-20">
            <h2 className="relative text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              {c.finalTitle}
            </h2>
            <p className="relative mt-3 text-lg text-white">{c.finalSub}</p>
            <Link
              href="/dashboard"
              className={`relative mt-8 ${btn.base} ${btn.lg} text-brand-600 hover:bg-brand-50 bg-white`}
            >
              <Mic className="h-5 w-5" aria-hidden />
              {c.cta}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-line border-t">
        <div className="text-ink-soft mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-8 text-sm sm:flex-row">
          <Logo className="sm:mr-auto" />
          <span>{c.footer}</span>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            {c.privacy}
          </Link>
        </div>
      </footer>
    </div>
  );
}
