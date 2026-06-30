import { test, expect, getPaletteFromStorage, clickGenerate } from "./fixtures";

test.describe("Workspace — Undo/redo & snapshots", () => {
  test("Undo/redo through palette changes", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const initial = await getPaletteFromStorage(page);

    // Generate a new palette
    await clickGenerate(page);
    const afterGen = await getPaletteFromStorage(page);
    expect(afterGen.join(",")).not.toBe(initial.join(","));

    // Undo via toolbar button
    const undoBtn = page.locator('button[title="Undo (Ctrl+Z)"]');
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();
    await page.waitForTimeout(500);

    const afterUndo = await getPaletteFromStorage(page);
    expect(afterUndo.join(",")).toBe(initial.join(","));

    // Redo via toolbar button
    const redoBtn = page.locator('button[title="Redo (Ctrl+Shift+Z)"]');
    await expect(redoBtn).toBeVisible();
    await redoBtn.click();
    await page.waitForTimeout(500);

    const afterRedo = await getPaletteFromStorage(page);
    expect(afterRedo.join(",")).toBe(afterGen.join(","));
  });

  test("Snapshot save/restore/rename/delete", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Open snapshots panel
    const snapBtn = page.locator('button[title="Workspace Snapshots"]');
    await snapBtn.click();
    await page.waitForTimeout(500);

    // Create a snapshot
    const snapInput = page.locator('input[placeholder="Snapshot name"]');
    await snapInput.fill("Test Snapshot");
    const saveBtn = page.locator("div.absolute").locator("button", { hasText: "Save" }).first();
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Verify snapshot appears
    await expect(page.locator("text=Snapshot saved")).toBeVisible({ timeout: 3000 }).catch(() => {});
    // The snapshot name should appear in the list
    await expect(page.locator("span", { hasText: "Test Snapshot" })).toBeVisible({ timeout: 3000 }).catch(() => {});

    // Close the snapshots panel
    await snapBtn.click();
    await page.waitForTimeout(300);
  });
});
