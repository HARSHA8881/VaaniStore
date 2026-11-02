import type { Language, Product } from "./schema";

/**
 * Turn whatever the owner typed/said ("98765 43210", "+91-98765-43210",
 * "098765 43210") into the digits-only international form wa.me needs ("919876543210").
 * Returns null if it doesn't look like a valid Indian mobile number.
 */
export function normalizeIndianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return digits;
  }
  return null;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** Pre-filled order text, in the shop's language so it feels natural to the owner. */
export function orderMessage(
  product: Pick<Product, "name" | "priceInr" | "unit">,
  language: Language,
) {
  const price =
    product.priceInr !== undefined
      ? ` (${formatInr(product.priceInr)}${product.unit ? ` / ${product.unit}` : ""})`
      : "";
  return language === "hi"
    ? `नमस्ते, मुझे यह ऑर्डर करना है: ${product.name}${price}`
    : `Hi, I want to order: ${product.name}${price}`;
}

/** wa.me link with a pre-filled message. Null if the number is invalid. */
export function buildWhatsAppLink(phone: string, message?: string): string | null {
  const number = normalizeIndianPhone(phone);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildTelLink(phone: string): string | null {
  const number = normalizeIndianPhone(phone);
  return number ? `tel:+${number}` : null;
}
