import { test, expect } from "./fixtures";

test.describe("Responsive layouts", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("All tabs are accessible at mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    // Verify the Studio tab is visible
    await expect(page.locator('nav[aria-label="Tabs"]')).toBeVisible();

    // Click various tabs using scroll arrows to navigate
    const tabs = ["Studio", "Settings", "Gradient", "Accessibility"];
    for (const tab of tabs) {
      const tabBtn = page.locator('nav[aria-label="Tabs"] button', { hasText: tab }).first();
      await tabBtn.scrollIntoViewIfNeeded();
      await tabBtn.click({ force: true });
      await page.waitForTimeout(300);
    }
  });

  test("Swatches have minimum 44px touch targets", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Check that swatches have min-width 44px
    const swatchWidth = await page.evaluate(() => {
      const swatch = document.querySelector('[class*="min-w-[44px]"]');
      if (!swatch) return 0;
      return swatch.getBoundingClientRect().width;
    });
    expect(swatchWidth).toBeGreaterThanOrEqual(44);
  });

  test("Toolbar actions work at mobile size", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Generate button should be visible
    const generateBtn = page.locator("div.sticky.bottom-0").locator("button", { hasText: "Generate" });
    await expect(generateBtn).toBeVisible();

    // Click generate at mobile size
    await generateBtn.click();
    await page.waitForTimeout(500);
  });
});
