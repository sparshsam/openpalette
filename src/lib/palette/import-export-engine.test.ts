import { describe, expect, it } from "vitest";
import { createExportSnippets } from "./export-engine";
import { decodePaletteState, encodePaletteState, parsePaletteInput } from "./import-engine";
import { createPalette } from "./palette-engine";

describe("import/export engines", () => {
  it("parses hex lists, JSON, CSS variables, and Tailwind snippets", () => {
    expect(parsePaletteInput("#111 #222222 --x: #ABCDEF;")).toEqual(["#111111", "#222222", "#ABCDEF"]);
    expect(parsePaletteInput(JSON.stringify({ color: { brand: "#123456" } }))).toEqual(["#123456"]);
    expect(parsePaletteInput("colors: { brand: '#0f172a', accent: '#f97316' }")).toEqual(["#0F172A", "#F97316"]);
  });

  it("roundtrips shareable URL state", () => {
    const palette = createPalette(["#111111", "#222222", "#333333"], 3);
    palette[0].locked = true;
    palette[1].alpha = 64;
    const decoded = decodePaletteState(encodePaletteState(palette, "Triadic"));
    expect(decoded?.mode).toBe("Triadic");
    expect(decoded?.colors.map((color) => color.hex)).toEqual(["#111111", "#222222", "#333333"]);
    expect(decoded?.colors[0].locked).toBe(true);
    expect(decoded?.colors[1].alpha).toBe(64);
  });

  it("exports production token formats", () => {
    const snippets = createExportSnippets(["#111111", "#FFFFFF"], [100, 80]);
    expect(snippets.CSS).toContain("--op-color-1");
    expect(snippets.Tailwind).toContain("openpalette");
    expect(snippets.Tokens).toContain("$schema");
    expect(snippets["Style Dictionary"]).toContain("palette1");
    expect(snippets.SVG).toContain("<svg");
  });
});

