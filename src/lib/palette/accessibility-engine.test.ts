import { describe, expect, it } from "vitest";
import {
  getContrastHint,
  getPairContrasts,
  getPaletteAccessibilityScore,
  simulateVision,
  suggestAccessibleReplacement,
} from "./accessibility-engine";
import { getContrastRatio } from "./color";

describe("accessibility engine", () => {
  it("classifies black and white as AAA contrast", () => {
    const hint = getContrastHint("#FFFFFF");
    expect(hint.rating).toBe("AAA");
    expect(hint.bestTextColor).toBe("#000000");
  });

  it("scores palettes and sorts weakest pairs first", () => {
    const colors = ["#000000", "#FFFFFF", "#777777"];
    const pairs = getPairContrasts(colors);
    expect(getPaletteAccessibilityScore(colors)).toBeGreaterThan(50);
    expect(pairs[0].ratio).toBeLessThanOrEqual(pairs[pairs.length - 1].ratio);
  });

  it("suggests a replacement that reaches AA contrast", () => {
    const replacement = suggestAccessibleReplacement("#777777", "#888888");
    expect(getContrastRatio(replacement, "#888888")).toBeGreaterThanOrEqual(4.5);
  });

  it("simulates color vision modes as valid hex colors", () => {
    expect(simulateVision("#336699", "protanopia")).toMatch(/^#[0-9A-F]{6}$/);
    expect(simulateVision("#336699", "deuteranopia")).toMatch(/^#[0-9A-F]{6}$/);
    expect(simulateVision("#336699", "tritanopia")).toMatch(/^#[0-9A-F]{6}$/);
  });
});

