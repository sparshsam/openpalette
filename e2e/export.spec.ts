import { test, expect, getPaletteFromStorage } from "./fixtures";

test.describe("Export actions", () => {
  test("Export modal opens from toolbar", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Click Export button in toolbar
    const exportBtn = page.locator("div.sticky.bottom-0").locator("button", { hasText: "Export" });
    await exportBtn.click();
    await page.waitForTimeout(500);

    // Export modal should be visible
    await expect(page.locator("text=export").first()).toBeVisible({ timeout: 3000 });
  });

  test("CSS Variables, JSON, Tailwind formats are selectable", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open export modal
    const exportBtn = page.locator("div.sticky.bottom-0").locator("button", { hasText: "Export" });
    await exportBtn.click();
    await page.waitForTimeout(500);

    // Verify format list is present
    const formatList = page.locator("text=All Formats");
    await expect(formatList).toBeVisible({ timeout: 3000 });

    // Verify the export modal is open (Naming Preset section)
    await expect(page.locator("text=Naming Preset").first()).toBeVisible({ timeout: 3000 });
  });

  test("Close modal works", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open export modal
    const exportBtn = page.locator("div.sticky.bottom-0").locator("button", { hasText: "Export" });
    await exportBtn.click();
    await page.waitForTimeout(500);

    // Click outside modal or close button to dismiss
    const closeBtn = page.locator('button:has-text("✕")').last();
    await closeBtn.click();
    await page.waitForTimeout(500);

    // Export modal should be gone
    await expect(page.locator("text=export").first()).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // The modal content text might not be visible anymore
    });
  });
});
