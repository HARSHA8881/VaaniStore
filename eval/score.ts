import type { ExtractResult } from "../src/lib/schema";
import { slugify } from "../src/lib/slug";

/**
 * Scoring for the extraction eval.
 *
 * We break each expected profile into atomic FACTS (the name, the phone, each day's
 * hours, each product, each product's price) and compare them with what the model
 * produced:
 *   TP = predicted fact that matches the expected one
 *   FP = predicted fact that's wrong, or wasn't said at all (a hallucination)
 *   FN = expected fact the model missed
 * Precision/recall/F1 come from summing these over all cases.
 */

export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type ExpectedProduct = { name: string; priceInr?: number; aliases?: string[] };
export type Expected = {
  name: string | null;
  nameRomanized?: string;
  phone: string | null;
  /** "HH:MM-HH:MM" or "closed", only for days the owner described. */
  hours: Partial<Record<Day, string>> | null;
  products: ExpectedProduct[];
};
export type EvalCase = {
  id: string;
  language: "en" | "hi" | "hinglish";
  shopType: string;
  transcript: string;
  expected: Expected;
};

export type Counts = { tp: number; fp: number; fn: number; hallucinations: number };
export const FIELDS = ["name", "phone", "hours", "products", "prices"] as const;
export type Field = (typeof FIELDS)[number];

export type CaseScore = {
  id: string;
  counts: Record<Field, Counts>;
  /** Whole field exactly right for this case (incl. correctly leaving it empty). */
  correct: Record<Field, boolean>;
  notes: string[];
};

const zero = (): Counts => ({ tp: 0, fp: 0, fn: 0, hallucinations: 0 });

/** Lowercase, keep only letters/digits in any script (so "Parle-G" ≈ "parle g"). */
export function norm(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function fuzzyEqual(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // "Toor dal" vs "Toor dal (1 kg)" — containment, but not for tiny strings.
  return Math.min(x.length, y.length) >= 3 && (x.includes(y) || y.includes(x));
}

/** Compare the last 10 digits so "+91 98765 43210" == "9876543210"; landlines use all digits. */
function phoneKey(s: string): string {
  const d = s.replace(/\D/g, "");
  return d.length > 10 ? d.slice(-10) : d.replace(/^0/, "");
}

function hoursString(h: { open?: string; close?: string; closed: boolean }): string {
  return h.closed ? "closed" : `${h.open}-${h.close}`;
}

export function scoreCase(c: EvalCase, actual: ExtractResult["profile"]): CaseScore {
  const counts = Object.fromEntries(FIELDS.map((f) => [f, zero()])) as Record<Field, Counts>;
  const notes: string[] = [];
  const exp = c.expected;

  // ── name ──
  const predName = actual.name?.trim();
  if (exp.name) {
    const ok =
      !!predName &&
      (fuzzyEqual(predName, exp.name) ||
        (!!exp.nameRomanized && fuzzyEqual(predName, exp.nameRomanized)) ||
        (!!exp.nameRomanized && actual.slug === slugify(exp.nameRomanized)));
    if (ok) counts.name.tp++;
    else {
      counts.name.fn++;
      if (predName) counts.name.fp++;
      notes.push(`name: expected "${exp.name}", got "${predName ?? "∅"}"`);
    }
  } else if (predName) {
    counts.name.fp++;
    counts.name.hallucinations++;
    notes.push(`name: invented "${predName}"`);
  }

  // ── phone (phone or WhatsApp — owners often give just one) ──
  const predPhone = actual.phone || actual.whatsapp;
  if (exp.phone) {
    if (predPhone && phoneKey(predPhone) === phoneKey(exp.phone)) counts.phone.tp++;
    else {
      counts.phone.fn++;
      if (predPhone) counts.phone.fp++;
      notes.push(`phone: expected ${exp.phone}, got ${predPhone ?? "∅"}`);
    }
  } else if (predPhone) {
    counts.phone.fp++;
    counts.phone.hallucinations++;
    notes.push(`phone: invented ${predPhone}`);
  }

  // ── hours, per day ──
  const predHours = new Map((actual.hours ?? []).map((h) => [h.day, hoursString(h)]));
  const expHours = exp.hours ?? {};
  const days = new Set<string>([...Object.keys(expHours), ...predHours.keys()]);
  for (const day of days) {
    const e = expHours[day as Day];
    const p = predHours.get(day as Day);
    if (e && p === e) counts.hours.tp++;
    else {
      if (e) counts.hours.fn++;
      if (p) {
        counts.hours.fp++;
        if (!e) counts.hours.hallucinations++;
      }
      notes.push(`hours ${day}: expected ${e ?? "∅"}, got ${p ?? "∅"}`);
    }
  }

  // ── products (greedy fuzzy match) and their prices ──
  const pred = [...(actual.products ?? [])];
  for (const e of exp.products) {
    const names = [e.name, ...(e.aliases ?? [])];
    const idx = pred.findIndex((p) => names.some((n) => fuzzyEqual(p.name, n)));
    if (idx === -1) {
      counts.products.fn++;
      if (e.priceInr !== undefined) counts.prices.fn++;
      notes.push(`product missing: ${e.name}`);
      continue;
    }
    const [match] = pred.splice(idx, 1);
    counts.products.tp++;
    if (e.priceInr !== undefined) {
      if (match.priceInr === e.priceInr) counts.prices.tp++;
      else {
        counts.prices.fn++;
        if (match.priceInr !== undefined) counts.prices.fp++;
        notes.push(`price ${e.name}: expected ${e.priceInr}, got ${match.priceInr ?? "∅"}`);
      }
    } else if (match.priceInr !== undefined) {
      counts.prices.fp++;
      counts.prices.hallucinations++;
      notes.push(`price ${e.name}: invented ${match.priceInr}`);
    }
  }
  for (const extra of pred) {
    counts.products.fp++;
    counts.products.hallucinations++;
    if (extra.priceInr !== undefined) counts.prices.fp++;
    notes.push(`product extra: ${extra.name}`);
  }

  const correct = Object.fromEntries(
    FIELDS.map((f) => [f, counts[f].fp === 0 && counts[f].fn === 0]),
  ) as Record<Field, boolean>;
  return { id: c.id, counts, correct, notes };
}

export function f1({ tp, fp, fn }: Pick<Counts, "tp" | "fp" | "fn">) {
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const f = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { precision, recall, f1: f };
}

export function sumCounts(list: Counts[]): Counts {
  return list.reduce(
    (a, b) => ({
      tp: a.tp + b.tp,
      fp: a.fp + b.fp,
      fn: a.fn + b.fn,
      hallucinations: a.hallucinations + b.hallucinations,
    }),
    zero(),
  );
}
