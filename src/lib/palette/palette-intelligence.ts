import { hexToHsl, hslToHex } from "./color";
import type { PaletteMode } from "./types";

// ── Palette Naming ──

const NAME_PATTERNS = [
  ["Nocturnal", "Canopy", "Drift", "Flux", "Haze", "Pulse", "Echo", "Zen", "Arctic", "Ember"],
  ["Dusk", "Tide", "Bloom", "Core", "Peak", "Shift", "Veil", "Moss", "Coral", "Slate"],
  ["Horizon", "Current", "Petal", "Prism", "Glow", "Frost", "Ash", "Dune", "Fern", "Storm"],
];

const STYLE_ADJECTIVES: Record<string, string[]> = {
  vibrant: ["Radiant", "Electric", "Vivid", "Bold", "Dynamic"],
  muted: ["Subtle", "Soft", "Gentle", "Quiet", "Mellow"],
  warm: ["Ember", "Golden", "Sunset", "Toasted", "Amber"],
  cool: ["Frost", "Glacial", "Ocean", "Shadow", "Steel"],
  dark: ["Midnight", "Obsidian", "Deep", "Phantom", "Umbra"],
  light: ["Dawn", "Cloud", "Pearl", "Breeze", "Linen"],
};

export function generatePaletteNames(colors: string[]): { primary: string; alternatives: string[] } {
  const hsls = colors.map((h) => hexToHsl(h)).filter(Boolean);
  const avgL = hsls.reduce((s, h) => s + h.l, 0) / Math.max(hsls.length, 1);
  const avgS = hsls.reduce((s, h) => s + h.s, 0) / Math.max(hsls.length, 1);
  const avgH = hsls.reduce((s, h) => s + h.h, 0) / Math.max(hsls.length, 1);

  const isDark = avgL < 35;
  const isLight = avgL > 70;
  const isWarm = avgH < 60 || avgH > 300;
  const isCool = avgH >= 150 && avgH <= 270;
  const isVibrant = avgS > 60;

  const wordSet = isDark ? NAME_PATTERNS[2] : isLight ? NAME_PATTERNS[1] : NAME_PATTERNS[0];
  const adj = isVibrant ? pick(STYLE_ADJECTIVES.vibrant) : pick(STYLE_ADJECTIVES.muted);
  const temp = isWarm ? pick(STYLE_ADJECTIVES.warm) : isCool ? pick(STYLE_ADJECTIVES.cool) : "";

  const primary = temp ? `${temp} ${pick(wordSet)}` : `${adj} ${pick(wordSet)}`;
  const alternatives = [
    `${pick(wordSet)} ${pick(["Palette", "Tones", "Scale"])}`,
    `${pick(NAME_PATTERNS[0])} ${pick(NAME_PATTERNS[1])}`,
  ];

  return { primary, alternatives };
}

// ── Palette Tags ──

export function classifyPalette(colors: string[]): string[] {
  const hsls = colors.map((h) => hexToHsl(h)).filter(Boolean);
  const tags: string[] = [];

  const avgS = hsls.reduce((s, h) => s + h.s, 0) / hsls.length;
  const avgL = hsls.reduce((s, h) => s + h.l, 0) / hsls.length;
  const warm = hsls.filter((h) => h.h < 60 || h.h > 300).length;
  const cool = hsls.filter((h) => h.h >= 150 && h.h <= 270).length;

  if (avgS > 65) tags.push("Vibrant");
  else if (avgS < 25) tags.push("Muted");
  else tags.push("Balanced");

  if (avgL > 75) tags.push("Pastel");
  else if (avgL < 30) tags.push("Dark");

  if (warm > cool && warm > 0) tags.push("Warm");
  if (cool > warm && cool > 0) tags.push("Cool");

  // High contrast check
  const sortedL = [...hsls].sort((a, b) => a.l - b.l);
  if (sortedL.length > 1 && sortedL[sortedL.length - 1].l - sortedL[0].l > 60) tags.push("High Contrast");

  // Diversity
  const hues = new Set(hsls.map((h) => Math.round(h.h / 30)));
  if (hues.size >= 4) tags.push("Colorful");
  else if (hues.size <= 2) tags.push("Minimal");

  // Style detection
  if (avgL > 70 && avgS < 40) tags.push("Earthy");
  if (avgL > 70 && avgS > 50) tags.push("Modern");
  if (avgL < 35 && avgS > 50) tags.push("Luxury");
  if (warm > 0 && cool > 0) tags.push("Balanced");
  if (avgS > 75) tags.push("Neon");

  return [...new Set(tags)].slice(0, 6);
}

// ── Palette Summary ──

export interface PaletteSummary {
  mood: string;
  industries: string[];
  useCases: string[];
  uiStyle: string;
  accessibility: string;
}

export function summarizePalette(colors: string[]): PaletteSummary {
  const hsls = colors.map((h) => hexToHsl(h)).filter(Boolean);
  const avgS = hsls.reduce((s, h) => s + h.s, 0) / hsls.length;
  const avgL = hsls.reduce((s, h) => s + h.l, 0) / hsls.length;
  const warm = hsls.filter((h) => h.h < 60 || h.h > 300).length;
  const cool = hsls.filter((h) => h.h >= 150 && h.h <= 270).length;

  const mood = avgL > 70 ? "Bright & Airy" : avgL < 30 ? "Dark & Bold" : "Balanced & Professional";
  const industries = warm > cool
    ? ["Branding", "Marketing", "Food & Beverage", "Lifestyle"]
    : ["Technology", "Healthcare", "Finance", "SaaS"];
  const useCases = avgS > 60
    ? ["Hero sections", "Call-to-action buttons", "Brand highlights"]
    : ["UI backgrounds", "Data visualization", "Long-form content"];
  const uiStyle = avgL > 70 ? "Clean, minimalist interfaces" : avgL < 30 ? "Dark mode, luxury apps" : "Professional dashboards";
  const accessibility = avgL < 30 || avgL > 70 ? "Good contrast potential — test AA compliance" : "Moderate contrast — increase extremes for AA";

  return { mood, industries, useCases, uiStyle, accessibility };
}

// ── Quality Report ──

export interface QualityReport {
  dominantHue: string;
  hueDistribution: string;
  saturationBalance: string;
  lightnessBalance: string;
  warmCoolRatio: string;
  accentStrength: string;
  contrastConsistency: string;
  similarColors: { hex: string; duplicate: string }[];
  overallQuality: string;
}

export function analyzeQuality(colors: string[]): QualityReport {
  const hsls = colors.map((h) => hexToHsl(h)).filter(Boolean);
  const avgH = hsls.reduce((s, h) => s + h.h, 0) / hsls.length;
  const avgS = hsls.reduce((s, h) => s + h.s, 0) / hsls.length;
  const sortedL = [...hsls].sort((a, b) => a.l - b.l);

  let dominantHue = "Red";
  if (avgH >= 45 && avgH < 70) dominantHue = "Yellow";
  else if (avgH >= 70 && avgH < 160) dominantHue = "Green";
  else if (avgH >= 160 && avgH < 200) dominantHue = "Turquoise";
  else if (avgH >= 200 && avgH < 265) dominantHue = "Blue";
  else if (avgH >= 265 && avgH < 320) dominantHue = "Violet";
  else if (avgH >= 320) dominantHue = "Pink/Red";

  const hueSpread = Math.max(...hsls.map((h) => h.h)) - Math.min(...hsls.map((h) => h.h));
  const hueDistribution = hueSpread > 100 ? "Good spread across the wheel" : "Colors cluster in one region";

  const saturationBalance = avgS > 60 ? "High saturation — vibrant but may tire the eye" : avgS < 25 ? "Low saturation — refined but may feel flat" : "Balanced saturation";

  const lightRange = sortedL.length > 1 ? sortedL[sortedL.length - 1].l - sortedL[0].l : 0;
  const lightnessBalance = lightRange > 40 ? "Good light/dark range" : lightRange > 20 ? "Moderate range" : "Limited range — add more contrast";

  const warm = hsls.filter((h) => h.h < 60 || h.h > 300).length;
  const cool = hsls.filter((h) => h.h >= 150 && h.h <= 270).length;
  const warmCoolRatio = warm > cool ? `${warm}:${cool} warm` : `${cool}:${warm} cool`;

  const accentStrength = avgS > 70 ? "Strong accent potential" : avgS > 40 ? "Moderate accent" : "Soft accent";

  const contrastConsistency = lightRange > 40 ? "Consistent contrast across colors" : "Limited contrast range";

  // Find similar colors
  const similarColors: { hex: string; duplicate: string }[] = [];
  for (let i = 0; i < hsls.length; i++) {
    for (let j = i + 1; j < hsls.length; j++) {
      const diff = Math.abs(hsls[i].h - hsls[j].h) + Math.abs(hsls[i].s - hsls[j].s) + Math.abs(hsls[i].l - hsls[j].l);
      if (diff < 30) {
        similarColors.push({ hex: colors[i], duplicate: colors[j] });
      }
    }
  }

  const quality = avgS > 20 && avgS < 80 && lightRange > 30 && hueSpread > 60 ? "High" : avgS > 10 && lightRange > 15 ? "Good" : "Fair";

  return { dominantHue, hueDistribution, saturationBalance, lightnessBalance, warmCoolRatio, accentStrength, contrastConsistency, similarColors, overallQuality: quality };
}

// ── Palette Relationships / Variations ──

export interface PaletteVariation {
  name: string;
  colors: string[];
  mode: PaletteMode;
}

export function generateVariations(colors: string[]): PaletteVariation[] {
  const hsls = colors.map((h) => hexToHsl(h)).filter(Boolean);
  const base = hsls[0] ?? { h: 0, s: 50, l: 50 };
  const n = colors.length;

  const complementary: string[] = [];
  const analogous: string[] = [];
  const monochromatic: string[] = [];
  const split: string[] = [];
  const triadic: string[] = [];

  for (let i = 0; i < n; i++) {
    const src = hsls[i % hsls.length] ?? base;
    complementary.push(hslToHex((src.h + 180) % 360, src.s, src.l));
    analogous.push(hslToHex((src.h + 30 + i * 15) % 360, src.s, src.l));
    monochromatic.push(hslToHex(src.h, Math.max(5, src.s - i * 10), Math.max(5, Math.min(95, src.l + (i - Math.floor(n / 2)) * 15))));
    split.push(hslToHex((src.h + 150 + i * 30) % 360, src.s, src.l));
    triadic.push(hslToHex((src.h + i * 120) % 360, src.s, src.l));
  }

  return [
    { name: "Complementary", colors: complementary, mode: "Complementary" as PaletteMode },
    { name: "Analogous", colors: analogous, mode: "Analogous" as PaletteMode },
    { name: "Monochromatic", colors: monochromatic, mode: "Monochromatic" as PaletteMode },
    { name: "Split Complementary", colors: split, mode: "Split Complementary" as PaletteMode },
    { name: "Triadic", colors: triadic, mode: "Triadic" as PaletteMode },
  ];
}

// ── Helpers ──

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
