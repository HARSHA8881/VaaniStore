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
  const maggiOrder = preview.getByRole("link", { name: "Order on WhatsApp" }).first();
  await expect(maggiOrder).toHaveAttribute("href", /wa\.me\/919876543210\?text=.*Maggi/);

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
  await page.getByRole("button", { name: "minimal" }).click();
  await expect(page.getByRole("button", { name: "minimal" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Out-of-stock products get no order button.
  await expect(page.getByText("Out of stock")).toBeVisible();
  const orderButtons = page.getByRole("link", { name: "Order on WhatsApp" });
  await expect(orderButtons).toHaveCount(7);

  // The sample number is made up and could be someone's real phone, so in demo mode
  // no button may point anywhere.
  await expect(page.getByRole("note")).toContainText("Demo shop");
  for (const name of ["Order on WhatsApp", "WhatsApp", "Call", "Open in Google Maps"]) {
    for (const link of await page.getByRole("link", { name, exact: true }).all()) {
      await expect(link).not.toHaveAttribute("href", /.+/);
      await expect(link).toHaveAttribute("aria-disabled", "true");
    }
  }
  await expect(page.locator('a[href*="wa.me"], a[href^="tel:"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy" })).toHaveCount(0);
});
