import { expect, test } from "@playwright/test";

/**
 * Owner flow: describe shop → AI fills profile → voice edit → diff → confirm → undo.
 * The two AI endpoints are stubbed so the test is fast, free and deterministic;
 * real model quality is measured separately by `npm run eval`.
 */

const extracted = {
  profile: {
    name: "Sharma General Store",
    slug: "sharma-general-store",
    category: "Kirana / General Store",
    phone: "98765 43210",
    hours: [
      ...["mon", "tue", "wed", "thu", "fri", "sat"].map((day) => ({
        day,
        open: "09:00",
        close: "22:00",
        closed: false,
      })),
      { day: "sun", closed: true },
    ],
    products: [
      { id: "p_maggi", name: "Maggi", priceInr: 14, unit: "packet", inStock: true },
      { id: "p_parle", name: "Parle-G", priceInr: 10, unit: "packet", inStock: true },
    ],
    language: "hinglish",
  },
  missing: ["address"],
  attempts: 1,
};

test("owner builds a shop by voice and edits it", async ({ page }) => {
  await page.route("**/api/extract", (route) => route.fulfill({ json: extracted }));
  await page.route("**/api/edit", (route) =>
    route.fulfill({
      json: {
        operations: [
          { op: "set_hours", day: "sun", open: "10:00", close: "14:00", closed: false },
          { op: "remove_product", productId: "p_maggi" },
        ],
      },
    }),
  );

  await page.goto("/dashboard");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // 1. Describe the shop (typing stands in for the mic).
  await page
    .getByLabel("What you said (you can fix it)")
    .fill(
      "Mera naam Sharma General Store hai, subah 9 se raat 10, Sunday band. Maggi 14, Parle-G 10.",
    );
  await page.getByRole("button", { name: /Build my page/ }).click();

  // 2. Profile is filled and the missing field is asked for.
  await expect(page.getByRole("button", { name: /Tell me your address/ })).toBeVisible();

  // On a phone, the preview lives behind the "Preview" tab.
  const editTab = page.getByRole("button", { name: "Edit", exact: true });
  const previewTab = page.getByRole("button", { name: "Preview", exact: true });
  const preview = page.getByRole("complementary", { name: "Preview" });
  await previewTab.click();
  await expect(preview.getByRole("heading", { name: "Sharma General Store" })).toBeVisible();

  // Cart: 2 × Maggi + 1 × Parle-G → one WhatsApp message with lines and a total.
  await preview.getByRole("button", { name: "Add Maggi" }).click();
  await preview.getByRole("button", { name: "Increase: Maggi" }).click();
  await preview.getByRole("button", { name: "Add Parle-G" }).click();
  await preview.getByRole("button", { name: /View order/ }).click();
  const send = page.getByRole("link", { name: "Send order on WhatsApp" });
  await expect(send).toHaveAttribute("href", /^https:\/\/wa\.me\/919876543210\?text=/);
  const message = decodeURIComponent((await send.getAttribute("href"))!.split("text=")[1]);
  expect(message).toContain("• 2 × Maggi (₹14 / packet) = ₹28");
  expect(message).toContain("• 1 × Parle-G (₹10 / packet) = ₹10");
  expect(message).toContain("Total: ₹38");
  await page.getByRole("button", { name: "Close" }).click();

  // 3. Voice edit → diff → confirm.
  await editTab.click();
  await page
    .locator("section")
    .filter({ hasText: "Change something by voice" })
    .locator("textarea")
    .fill("Sunday ko bhi khula rakho 10 se 2, Maggi hata do");
  await page.getByRole("button", { name: "Understand change" }).click();
  await expect(page.getByText("10:00 AM – 2:00 PM").first()).toBeVisible();
  await page.getByRole("button", { name: /Confirm/ }).click();

  await previewTab.click();
  const sundayRow = preview.getByRole("row", { name: /Sunday/ });
  await expect(sundayRow).toContainText("10:00 AM – 2:00 PM");
  await expect(preview.getByText("Maggi")).toHaveCount(0);

  // 4. Undo restores the previous version.
  await editTab.click();
  await page.getByRole("button", { name: /Undo/ }).click();
  await previewTab.click();
  await expect(sundayRow).toContainText("Closed");
  await expect(preview.getByText("Maggi").filter({ visible: true })).toBeVisible();
});

test("sample storefront switches themes and never contacts a real number", async ({ page }) => {
  await page.goto("/preview");
  await expect(page.getByRole("heading", { name: "Sharma General Store" })).toBeVisible();
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  // Out-of-stock products get no order button.
  await expect(page.getByText("Out of stock")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Add / })).toHaveCount(7);

  // The cart works in the demo, but sending the order is disabled.
  await page.getByRole("button", { name: "Add Parle-G" }).click();
  await page.getByRole("button", { name: /View order/ }).click();
  const send = page.getByRole("link", { name: "Send order on WhatsApp" });
  await expect(send).toHaveAttribute("aria-disabled", "true");
  await expect(send).not.toHaveAttribute("href", /.+/);
  await page.getByRole("button", { name: "Close" }).click();

  // The sample number is made up and could be someone's real phone, so in demo mode
  // no button may point anywhere.
  await expect(page.getByRole("note")).toContainText("Demo shop");
  for (const name of ["WhatsApp", "Call", "Directions", "Open in Google Maps"]) {
    for (const link of await page.getByRole("link", { name, exact: true }).all()) {
      await expect(link).not.toHaveAttribute("href", /.+/);
      await expect(link).toHaveAttribute("aria-disabled", "true");
    }
  }
  await expect(page.locator('a[href*="wa.me"], a[href^="tel:"], a[href^="upi:"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy" })).toHaveCount(0);
});
