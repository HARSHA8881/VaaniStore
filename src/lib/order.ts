import type { Language, Product } from "./schema";
import { formatInr } from "./whatsapp";

/**
 * Cart → WhatsApp order message and UPI payment link.
 * Pure functions so the exact text customers send is unit-tested.
 */

export type CartLine = { product: Pick<Product, "id" | "name" | "priceInr" | "unit">; qty: number };

export const MAX_QTY = 99;

export function cartTotal(lines: CartLine[]): { total: number; unpriced: number } {
  let total = 0;
  let unpriced = 0;
  for (const { product, qty } of lines) {
    if (product.priceInr === undefined) unpriced += 1;
    else total += product.priceInr * qty;
  }
  // Avoid 0.1 + 0.2 style float noise in rupee amounts.
  return { total: Math.round(total * 100) / 100, unpriced };
}

export function buildOrderMessage(
  shopName: string,
  lines: CartLine[],
  language: Language,
  opts: { customerName?: string; note?: string } = {},
): string {
  const hi = language === "hi";
  const { total, unpriced } = cartTotal(lines);
  const rows = lines.map(({ product: p, qty }) => {
    const each =
      p.priceInr !== undefined ? ` (${formatInr(p.priceInr)}${p.unit ? ` / ${p.unit}` : ""})` : "";
    const sum = p.priceInr !== undefined ? ` = ${formatInr(p.priceInr * qty)}` : "";
    return `• ${qty} × ${p.name}${each}${sum}`;
  });

  const parts = [
    hi ? `नमस्ते ${shopName}, मुझे यह ऑर्डर करना है:` : `Hi ${shopName}, I'd like to order:`,
    ...rows,
    "",
    `${hi ? "कुल" : "Total"}: ${formatInr(total)}${
      unpriced
        ? hi
          ? ` + ${unpriced} सामान का दाम बताएँ`
          : ` + price of ${unpriced} item(s) to confirm`
        : ""
    }`,
  ];
  const name = opts.customerName?.trim();
  const note = opts.note?.trim();
  if (name) parts.push(`${hi ? "नाम" : "Name"}: ${name}`);
  if (note) parts.push(`${hi ? "नोट" : "Note"}: ${note}`);
  return parts.join("\n");
}

/** UPI IDs look like name@bank (NPCI: 2–256 chars before @, letters after). */
export function isValidUpiId(upiId: string): boolean {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(upiId.trim());
}

/**
 * Standard UPI deep link (works with GPay, PhonePe, Paytm, BHIM…). On a phone it
 * opens the customer's UPI app with the shop, amount and note pre-filled; the
 * customer still confirms with their own PIN, so nothing is charged automatically.
 */
export function buildUpiLink(
  upiId: string,
  payeeName: string,
  amount: number,
  note: string,
): string | null {
  if (!isValidUpiId(upiId) || !(amount > 0)) return null;
  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: payeeName.slice(0, 50),
    am: amount.toFixed(2),
    cu: "INR",
    tn: note.slice(0, 50),
  });
  return `upi://pay?${params.toString()}`;
}
