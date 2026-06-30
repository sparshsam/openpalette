import { test as base, type Page } from "@playwright/test";

/**
 * Extended test with clipboard API auto-mock and palette helpers.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Auto-mock clipboard API (fails in non-HTTPS contexts)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async () => {},
          readText: async () => "",
        },
        writable: true,
        configurable: true,
      });
    });
    await use(page);
  },
});

/**
 * Get the current palette from localStorage as an array of hex strings.
 */
export async function getPaletteFromStorage(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem("openpalette.workspace.v1");
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (Array.isArray(data.colors)) {
        return data.colors.map((c: { hex: string }) => c.hex);
      }
      return [];
    } catch {
      return [];
    }
  });
}

/**
 * Wait for the app to fully hydrate by checking for the toolbar Generate button.
 */
export async function waitForApp(page: Page): Promise<void> {
  await page.waitForSelector('button:has-text("Generate")', { timeout: 5000 });
  await page.waitForTimeout(800);
}

/**
 * Click the Generate button in the toolbar.
 */
export async function clickGenerate(page: Page): Promise<void> {
  await page.locator('button:has-text("Generate")').first().click();
  await page.waitForTimeout(500);
}

/**
 * Navigate to a specific tab by clicking it in the tab nav.
 */
export async function navigateToTab(page: Page, tabName: string): Promise<void> {
  const tabBtn = page.locator(`nav[aria-label="Tabs"] button:has-text("${tabName}")`).first();
  await tabBtn.scrollIntoViewIfNeeded();
  await tabBtn.click({ force: true });
  await page.waitForTimeout(500);
}

export { expect } from "@playwright/test";
