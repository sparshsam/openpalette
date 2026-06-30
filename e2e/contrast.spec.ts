import { test, expect } from "./fixtures";

test.describe("Contrast checker", () => {
  test("Navigate to Contrast tab", async ({ page }) => {
    await page.goto("/#/contrast/2D1B69-FFE4B5");
    await page.waitForTimeout(500);

    await expect(page.locator("h1", { hasText: "Contrast" })).toBeVisible({ timeout: 3000 });
  });

  test("Color pickers work", async ({ page }) => {
    await page.goto("/#/contrast/2D1B69-FFE4B5");
    await page.waitForTimeout(500);

    // There should be two color input fields
    const colorInputs = page.locator('input[type="text"][placeholder="#000000"]');
    const count = await colorInputs.count();
    expect(count).toBe(2);
  });

  test("Contrast ratio displays correctly", async ({ page }) => {
    await page.goto("/#/contrast/2D1B69-FFE4B5");
    await page.waitForTimeout(500);

    // The ratio should be displayed as a large number
    const ratioDisplay = page.locator("span.text-5xl");
    await expect(ratioDisplay).toBeVisible({ timeout: 3000 });
  });

  test("AA/AAA badges appear", async ({ page }) => {
    await page.goto("/#/contrast/2D1B69-FFE4B5");
    await page.waitForTimeout(500);

    // AA/AAA pass indicators should be visible
    await expect(page.locator("text=AA Large").first()).toBeVisible({ timeout: 3000 });
  });

  test("Swap button works", async ({ page }) => {
    await page.goto("/#/contrast/2D1B69-FFE4B5");
    await page.waitForTimeout(500);

    // Get the original foreground hex
    const fgInput = page.locator('input[type="text"][placeholder="#000000"]').first();
    const originalFg = await fgInput.inputValue();

    // Click Swap
    const swapBtn = page.locator("button", { hasText: "Swap" });
    await swapBtn.click();
    await page.waitForTimeout(300);

    // The foreground should now have changed
    const newFg = await fgInput.inputValue();
    // They should be different after swap
    expect(newFg).not.toBe(originalFg);
  });

  test("Enhance button works", async ({ page }) => {
    await page.goto("/#/contrast/2D1B69-FFE4B5");
    await page.waitForTimeout(500);

    // Click "Adjust text color" enhance button
    const enhanceBtn = page.locator("button", { hasText: "Adjust text color" });
    await enhanceBtn.click();
    await page.waitForTimeout(300);

    // The ratio display should still be visible
    const ratioDisplay = page.locator("span.text-5xl");
    await expect(ratioDisplay).toBeVisible({ timeout: 3000 });
  });
});
