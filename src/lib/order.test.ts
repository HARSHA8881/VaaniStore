import { describe, expect, it } from "vitest";
import { buildOrderMessage, buildUpiLink, cartTotal, isValidUpiId, type CartLine } from "./order";

const lines: CartLine[] = [
  { product: { id: "a", name: "Parle-G", priceInr: 10, unit: "packet" }, qty: 2 },
  { product: { id: "b", name: "Toor Dal", priceInr: 140, unit: "kg" }, qty: 1 },
];

describe("cartTotal", () => {
  it("sums priced lines and counts unpriced ones", () => {
    expect(cartTotal(lines)).toEqual({ total: 160, unpriced: 0 });
    expect(cartTotal([...lines, { product: { id: "c", name: "Atta" }, qty: 3 }])).toEqual({
      total: 160,
      unpriced: 1,
    });
  });

  it("avoids floating point noise", () => {
    expect(cartTotal([{ product: { id: "x", name: "X", priceInr: 0.1 }, qty: 3 }]).total).toBe(0.3);
  });
});

describe("buildOrderMessage", () => {
  it("lists items with quantities, prices and total", () => {
    expect(buildOrderMessage("Sharma Store", lines, "en", { customerName: "Ravi" })).toBe(
      [
        "Hi Sharma Store, I'd like to order:",
        "• 2 × Parle-G (₹10 / packet) = ₹20",
        "• 1 × Toor Dal (₹140 / kg) = ₹140",
        "",
        "Total: ₹160",
        "Name: Ravi",
      ].join("\n"),
    );
  });

  it("flags items whose price the shop must confirm", () => {
    const msg = buildOrderMessage("S", [{ product: { id: "c", name: "Atta" }, qty: 1 }], "en");
    expect(msg).toContain("• 1 × Atta");
    expect(msg).toContain("Total: ₹0 + price of 1 item(s) to confirm");
  });

  it("writes Hindi for Hindi shops", () => {
    const msg = buildOrderMessage("शर्मा स्टोर", lines, "hi", { note: "शाम को लेने आऊँगा" });
    expect(msg.split("\n")[0]).toBe("नमस्ते शर्मा स्टोर, मुझे यह ऑर्डर करना है:");
    expect(msg).toContain("कुल: ₹160");
    expect(msg).toContain("नोट: शाम को लेने आऊँगा");
  });
});

describe("UPI", () => {
  it.each(["sharmastore@okicici", "98765.43210@ybl", "shop_1@paytm"])("accepts %s", (id) => {
    expect(isValidUpiId(id)).toBe(true);
  });

  it.each(["", "noatsign", "a@", "@bank", "x@1bank", "bad id@upi"])("rejects %s", (id) => {
    expect(isValidUpiId(id)).toBe(false);
  });

  it("builds a standard upi://pay link with the amount", () => {
    expect(buildUpiLink("sharmastore@okicici", "Sharma Store", 160, "Order")).toBe(
      "upi://pay?pa=sharmastore%40okicici&pn=Sharma+Store&am=160.00&cu=INR&tn=Order",
    );
  });

  it("returns null for a bad ID or zero amount", () => {
    expect(buildUpiLink("bad", "S", 10, "n")).toBeNull();
    expect(buildUpiLink("a@okaxis", "S", 0, "n")).toBeNull();
  });
});
