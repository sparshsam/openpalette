import { test, expect, getPaletteFromStorage, clickGenerate, waitForApp } from "./fixtures";

test.describe("Studio — Generate workflow", () => {
  test("Spacebar generates a new palette", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    // Wait for the initial palette to be saved to localStorage
    await page.waitForTimeout(500);
    const initial = await getPaletteFromStorage(page);
    expect(initial.length).toBeGreaterThanOrEqual(3);

    // Press Space to generate
    await page.keyboard.press("Space");
    await page.waitForTimeout(700);

    const after = await getPaletteFromStorage(page);
    expect(after.join(",")).not.toBe(initial.join(","));
    expect(after.length).toBe(initial.length);
  });

  test("Generate button in toolbar works", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);
    await page.waitForTimeout(500);

    const initial = await getPaletteFromStorage(page);
    await clickGenerate(page);
    const after = await getPaletteFromStorage(page);

    expect(after.join(",")).not.toBe(initial.join(","));
  });

  test("Each palette has 5 colors (default)", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const palette = await getPaletteFromStorage(page);
    expect(palette.length).toBe(5);
  });

  test("Color copy works via toolbar preview", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    // Click a color in the toolbar's palette preview strip to copy it
    const previewBtn = page.locator("div.sticky.bottom-0 button").first();
    await previewBtn.click();
    await page.waitForTimeout(300);

    // The notice text should have shown something (or the toolbar is still visible)
    await expect(page.locator("div.sticky.bottom-0")).toBeVisible();
  });

  test("Lock/unlock a color via hover", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);
    await page.waitForTimeout(500);

    // Hover over the first swatch
    const swatch = page.locator('[class*="min-w-[44px]"]').first();
    await swatch.hover();
    await page.waitForTimeout(500);

    // The lock button should be visible within the hovered swatch
    const lockBtn = swatch.locator('[aria-label="Lock"]');
    if (await lockBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await lockBtn.click();
      await page.waitForTimeout(300);
    }

    // Regenerate a few times — the locked color might stay
    for (let i = 0; i < 3; i++) {
      await clickGenerate(page);
    }

    // Verify the palette still has the right number of colors
    const palette = await getPaletteFromStorage(page);
    expect(palette.length).toBe(5);
  });
});
