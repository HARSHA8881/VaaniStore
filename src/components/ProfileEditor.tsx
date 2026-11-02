"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Clock, Languages, MapPin, Package, Phone, Store } from "lucide-react";
import type { DraftProfile, Language } from "@/lib/schema";
import { Field } from "./dashboard/Field";
import { HoursEditor } from "./dashboard/HoursEditor";
import { ProductsEditor } from "./dashboard/ProductsEditor";
import { card } from "./ui/styles";
import { useUi } from "./UiLang";

/**
 * Plain form over the draft profile. Voice is the fast path; this is the
 * always-works path (and how the owner fixes anything the AI got wrong).
 */
export function ProfileEditor({
  draft,
  onChange,
  missing,
  supabase,
  userId,
}: {
  draft: DraftProfile;
  onChange: (d: DraftProfile) => void;
  missing: string[];
  supabase: SupabaseClient | null;
  userId: string | null;
}) {
  const { t } = useUi();
  const set = <K extends keyof DraftProfile>(key: K, value: DraftProfile[K]) =>
    onChange({ ...draft, [key]: value });
  const setText = (key: "tagline" | "about" | "phone" | "whatsapp" | "upiId", v: string) =>
    set(key, v || undefined);
  const address = draft.address ?? { line: "", city: "" };
  const setAddress = (changes: Partial<typeof address>) => {
    const next = { ...address, ...changes };
    delete next.mapsQuery; // edited by hand → let the maps link use the new text
    set("address", next.line || next.city || next.pincode ? next : undefined);
  };

  return (
    <div className="space-y-4">
      <Group icon={<Store />} title={t("secBasics")} id="sec-basics">
        <Field
          label={t("f_name")}
          value={draft.name}
          onChange={(v) => set("name", v)}
          missing={missing.includes("name")}
        />
        <Field
          label={t("f_tagline")}
          value={draft.tagline ?? ""}
          onChange={(v) => setText("tagline", v)}
        />
        <Field
          label={t("f_category")}
          value={draft.category}
          onChange={(v) => set("category", v)}
          missing={missing.includes("category")}
          placeholder="Kirana / General Store"
        />
        <Field
          label={t("f_about")}
          value={draft.about ?? ""}
          onChange={(v) => setText("about", v)}
          multiline
        />
      </Group>

      <Group icon={<Phone />} title={t("secContact")} id="sec-contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("f_phone")}
            value={draft.phone ?? ""}
            onChange={(v) => setText("phone", v)}
            inputMode="tel"
            missing={missing.includes("phone")}
          />
          <Field
            label={t("f_whatsapp")}
            value={draft.whatsapp ?? ""}
            onChange={(v) => setText("whatsapp", v)}
            inputMode="tel"
          />
        </div>
        <Field
          label={t("f_upiId")}
          value={draft.upiId ?? ""}
          onChange={(v) => setText("upiId", v)}
          placeholder="name@okbank"
        />
      </Group>

      <Group icon={<MapPin />} title={t("f_address")} id="sec-address">
        <Field
          label={t("f_address")}
          value={address.line}
          onChange={(line) => setAddress({ line })}
          missing={missing.includes("address") && !address.line}
        />
        <div className="grid grid-cols-[1fr_8rem] gap-3">
          <Field
            label={t("f_city")}
            value={address.city}
            onChange={(city) => setAddress({ city })}
            missing={missing.includes("address") && !address.city}
          />
          <Field
            label={t("f_pincode")}
            value={address.pincode ?? ""}
            onChange={(pincode) => setAddress({ pincode: pincode || undefined })}
            inputMode="numeric"
          />
        </div>
      </Group>

      <Group
        icon={<Clock />}
        title={t("f_hours")}
        id="sec-hours"
        missing={missing.includes("hours")}
      >
        <HoursEditor hours={draft.hours} onChange={(h) => set("hours", h)} />
      </Group>

      <Group
        icon={<Package />}
        title={t("f_products")}
        id="sec-products"
        missing={missing.includes("products")}
        aside={draft.products.length ? String(draft.products.length) : undefined}
      >
        <ProductsEditor
          products={draft.products}
          onChange={(p) => set("products", p)}
          supabase={supabase}
          userId={userId}
        />
      </Group>

      <Group icon={<Languages />} title={t("f_language")} id="sec-language">
        <div className="bg-paper-2 inline-flex rounded-full p-1">
          {(["hinglish", "hi", "en"] as Language[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set("language", l)}
              aria-pressed={draft.language === l}
              className="text-ink-soft aria-pressed:bg-surface aria-pressed:text-ink min-h-10 rounded-full px-4 text-sm font-medium transition aria-pressed:shadow-sm"
            >
              {
                ({ hinglish: "Hinglish", hi: "हिंदी", en: "English" } as Record<Language, string>)[
                  l
                ]
              }
            </button>
          ))}
        </div>
      </Group>
    </div>
  );
}

function Group({
  icon,
  title,
  id,
  missing = false,
  aside,
  children,
}: {
  icon: React.ReactElement<{ className?: string }>;
  title: string;
  id: string;
  missing?: boolean;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`${card} min-w-0 p-5 sm:p-6 ${missing ? "ring-marigold/60 ring-2" : ""}`}
    >
      <h2 id={id} className="mb-4 flex items-center gap-2.5 font-semibold">
        <span className="bg-paper-2 text-ink-soft flex h-8 w-8 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        {title}
        {aside && (
          <span className="bg-paper-2 text-ink-soft rounded-full px-2 py-0.5 text-xs">{aside}</span>
        )}
        {missing && <span className="bg-marigold ml-auto h-2 w-2 rounded-full" aria-hidden />}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
