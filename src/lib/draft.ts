import { computeMissing } from "./extract";
import {
  DraftProfileSchema,
  type DraftProfile,
  type ExtractResult,
  type ShopProfile,
} from "./schema";

export function emptyDraft(): DraftProfile {
  return {
    name: "",
    slug: "",
    category: "",
    hours: [],
    products: [],
    theme: "light",
    language: "hinglish",
  };
}

/** AI extraction fills in what it heard; anything the owner already typed and the AI didn't hear is kept. */
export function mergeExtraction(
  draft: DraftProfile,
  extracted: ExtractResult["profile"],
): DraftProfile {
  return { ...draft, ...extracted } as DraftProfile;
}

/**
 * The preview must always render, even for a half-filled draft, so the owner sees
 * the page take shape while speaking. Placeholders are only for the preview — they
 * are never saved.
 */
export function toPreviewProfile(d: DraftProfile): ShopProfile {
  const address = d.address?.line || d.address?.city ? d.address : undefined;
  return {
    ...d,
    name: d.name || (d.language === "hi" ? "आपकी दुकान" : "Your shop"),
    slug: d.slug || "preview",
    category: d.category || "Shop",
    address: address && { ...address, line: address.line || "", city: address.city || "" },
  };
}

export function missingFields(d: DraftProfile): string[] {
  return computeMissing(d);
}

const DRAFT_KEY = "vaanistore.draft";

/** Local backup so a refresh or a dropped connection never loses the owner's work. */
export function loadLocalDraft(): DraftProfile | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = DraftProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveLocalDraft(d: DraftProfile | null) {
  try {
    if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage full or blocked — not fatal */
  }
}
