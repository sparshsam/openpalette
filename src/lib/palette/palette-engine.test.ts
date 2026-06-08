import { describe, expect, it } from "vitest";
import { createPalette, generateHarmony, generatePalette, resizePalette } from "./palette-engine";

describe("palette engine", () => {
  it("creates palettes within the supported 2-10 size bounds", () => {
    expect(createPalette(["#000", "#fff"], 1)).toHaveLength(2);
    expect(createPalette(["#000", "#fff"], 12)).toHaveLength(10);
  });

  it("generates every harmony mode at the requested size", () => {
    for (const mode of ["Analogous", "Monochromatic", "Complementary", "Triadic", "Split Complementary", "Tetradic", "Random"] as const) {
      const harmony = generateHarmony("#336699", mode, 7);
      expect(harmony).toHaveLength(7);
      expect(harmony.every((hex) => /^#[0-9A-F]{6}$/.test(hex))).toBe(true);
    }
  });

  it("preserves locked colors while regenerating", () => {
    const palette = createPalette(["#111111", "#222222", "#333333"], 3);
    const locked = { ...palette[1], locked: true };
    const next = generatePalette([palette[0], locked, palette[2]], "Complementary", 3);
    expect(next[1]).toEqual(locked);
  });

  it("adds and removes colors without mutating locked entries", () => {
    const palette = createPalette(["#111111", "#222222", "#333333"], 3);
    const larger = resizePalette(palette, 6, "Triadic");
    const smaller = resizePalette(larger, 2, "Triadic");
    expect(larger).toHaveLength(6);
    expect(smaller).toHaveLength(2);
    expect(smaller[0].hex).toBe("#111111");
  });
});

