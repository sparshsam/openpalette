import { describe, expect, it } from "vitest";
import { createGradientCss, createGradientSvg } from "./gradient-engine";
import { extractPaletteFromPixels } from "./image-extraction-engine";

describe("gradient and image engines", () => {
  it("creates linear and radial gradient exports", () => {
    expect(createGradientCss(["#111111", "#FFFFFF"], "linear", 45)).toBe("linear-gradient(45deg, #111111 0%, #FFFFFF 100%)");
    expect(createGradientCss(["#111111", "#FFFFFF"], "radial", 45)).toContain("radial-gradient");
    expect(createGradientSvg(["#111111", "#FFFFFF"], "linear", 90)).toContain("linearGradient");
  });

  it("extracts deduplicated colors from pixel data", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255,
      255, 0, 0, 255,
      0, 0, 255, 255,
      0, 0, 255, 255,
      20, 20, 20, 255,
      250, 250, 250, 255,
    ]);
    const colors = extractPaletteFromPixels(pixels, 3, "balanced");
    expect(colors.length).toBeGreaterThanOrEqual(2);
    expect(colors.every((hex) => /^#[0-9A-F]{6}$/.test(hex))).toBe(true);
  });
});

