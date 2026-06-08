import type { ExportFormat, PaletteMode } from "./types";

export const minPaletteSize = 2;
export const maxPaletteSize = 10;
export const defaultPaletteSize = 5;

export const paletteModes: PaletteMode[] = [
  "Analogous",
  "Monochromatic",
  "Complementary",
  "Triadic",
  "Split Complementary",
  "Tetradic",
  "Random",
];

export const exportFormats: ExportFormat[] = ["CSS", "SCSS", "Tailwind", "JSON", "Tokens", "Style Dictionary", "SVG"];

export const seedPalettes = [
  ["#0F172A", "#2563EB", "#38BDF8", "#F8FAFC", "#F97316"],
  ["#101828", "#475467", "#98A2B3", "#EAECF0", "#FCFCFD"],
  ["#164E63", "#0891B2", "#67E8F9", "#ECFEFF", "#F59E0B"],
  ["#1F2937", "#7C3AED", "#C084FC", "#F5F3FF", "#10B981"],
  ["#2F1B12", "#8B5E34", "#D6A76C", "#F7E7CE", "#31572C"],
];

export const defaultTokenScales = {
  spacing: [0, 2, 4, 8, 12, 16, 24, 32, 48, 64],
  radii: [0, 4, 8, 12, 16, 24],
  shadows: ["0 1px 2px rgb(15 23 42 / 0.08)", "0 8px 24px rgb(15 23 42 / 0.12)"],
  durations: [120, 160, 220, 320],
};

