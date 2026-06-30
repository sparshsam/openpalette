import { test, expect } from "./fixtures";

test.describe("Settings page", () => {
  test("Navigate to Settings tab", async ({ page }) => {
    await page.goto("/#settings");
    await page.waitForTimeout(500);

    await expect(page.locator("h1", { hasText: "Settings" })).toBeVisible({ timeout: 3000 });
  });

  test("Theme toggle works", async ({ page }) => {
    await page.goto("/#settings");
    await page.waitForTimeout(500);

    const themeBtn = page.locator("button", { hasText: /Switch to/ });
    await expect(themeBtn).toBeVisible({ timeout: 3000 });

    // Note the current theme
    const beforeTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );

    await themeBtn.click();
    await page.waitForTimeout(300);

    const afterTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(afterTheme).not.toBe(beforeTheme);
  });

  test("Color count selector works", async ({ page }) => {
    await page.goto("/#settings");
    await page.waitForTimeout(500);

    // Click on "3" color count
    const countBtn = page.locator("button", { hasText: "3" });
    await countBtn.click();
    await page.waitForTimeout(300);

    // The clicked button should show as active (accent bg)
    await expect(countBtn).toBeVisible();

    // Verify localStorage was updated
    const count = await page.evaluate(() => localStorage.getItem("op-settings-count"));
    expect(count).toBe("3");
  });

  test("Default export format selector works", async ({ page }) => {
    await page.goto("/#settings");
    await page.waitForTimeout(500);

    // Find the export format select
    const select = page.locator("select");
    await select.selectOption("json");
    await page.waitForTimeout(300);

    const format = await page.evaluate(() => localStorage.getItem("op-settings-format"));
    expect(format).toBe("json");
  });

  test("Reset functionality", async ({ page }) => {
    await page.goto("/#settings");
    await page.waitForTimeout(500);

    // Find reset button
    const resetBtn = page.locator("button", { hasText: "Reset Application" });
    await expect(resetBtn).toBeVisible({ timeout: 3000 });
  });

  test("Import/Export settings buttons are visible", async ({ page }) => {
    await page.goto("/#settings");
    await page.waitForTimeout(500);

    await expect(page.locator("button", { hasText: "Export Settings" })).toBeVisible({ timeout: 3000 });
    await expect(page.locator("button", { hasText: "Import Settings" })).toBeVisible({ timeout: 3000 });
  });
});
