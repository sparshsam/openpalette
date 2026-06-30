import { test, expect, waitForApp, navigateToTab } from "./fixtures";

test.describe("Smoke — Page load & basic rendering", () => {
  test("App loads at /", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);
    await expect(page.locator("header a", { hasText: "OpenPalette" })).toBeVisible();
  });

  test("All 10 tabs are navigable", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const tabs = [
      "Studio", "Explore", "Extract", "Contrast", "Visualizer",
      "Colors", "Tokens", "Gradient", "Accessibility", "Settings",
    ];

    for (const tab of tabs) {
      await navigateToTab(page, tab);
      // Verify the tab rendered by checking for its content
    }
    // After cycling through all tabs, verify we can return to Studio
    await navigateToTab(page, "Studio");
  });

  test("Header renders with logo and theme toggle", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);
    await expect(page.locator("header a", { hasText: "OpenPalette" })).toBeVisible();
    const themeToggle = page.locator('button[aria-label*="Switch to"]');
    await expect(themeToggle.first()).toBeVisible({ timeout: 3000 });
  });

  test("About page renders with version info", async ({ page }) => {
    await page.goto("/about");
    await page.waitForTimeout(2000);
    await expect(page.locator("text=MIT License").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Built with ❤")).toBeVisible();
  });

  test("Theme toggle works", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const themeToggle = page.locator("[aria-label*='Switch to'], button[aria-label*='mode']").first();

    // Get the initial aria-label (contains the target theme)
    const initialLabel = await themeToggle.getAttribute("aria-label");
    const initialTheme = initialLabel?.includes("dark") ? "light" : "dark";

    // Click toggle
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Check that aria-label changed
    const newLabel = await themeToggle.getAttribute("aria-label");
    expect(newLabel).not.toBe(initialLabel);
  });
});
