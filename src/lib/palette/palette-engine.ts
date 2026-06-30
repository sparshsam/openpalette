import { defaultPaletteSize, maxPaletteSize, minPaletteSize, seedPalettes } from "./constants";
import { clamp, createId, hexToHsl, hslToHex, normalizeHex } from "./color";
import type { PaletteColor, PaletteMode } from "./types";

export function createPalette(colors?: string[], size = defaultPaletteSize): PaletteColor[] {
  const source = colors && colors.length >= minPaletteSize ? colors : seedPalettes[1];
  const desiredSize = clamp(Math.round(size), minPaletteSize, maxPaletteSize);
  const filled = Array.from({ length: desiredSize }, (_, index) => source[index % source.length] ?? generateHex());

  return filled.map((hex, index) => ({
    id: createId("color"),
    hex: normalizeHex(hex) ?? generateHex(index * 41),
    alpha: 100,
    locked: false,
  }));
}

export function resizePalette(colors: PaletteColor[], size: number, mode: PaletteMode) {
  const desiredSize = clamp(Math.round(size), minPaletteSize, maxPaletteSize);
  if (desiredSize === colors.length) return colors;
  if (desiredSize < colors.length) return colors.slice(0, desiredSize);
  const generated = generateFresh(mode, desiredSize);
  return [...colors, ...generated.slice(colors.length).map((hex) => ({
    id: createId("color"), hex, alpha: 100, locked: false,
  }))];
}

/** Generate a completely fresh palette — does NOT build on previous colors */
export function generatePalette(previous: PaletteColor[], mode: PaletteMode, size = previous.length) {
  const desiredSize = clamp(size, minPaletteSize, maxPaletteSize);
  const lockedByIndex = new Map(previous.map((color, index) => [index, color]));
  const fresh = generateFresh(mode, desiredSize);

  // Replace locked positions with their original colors
  return fresh.map((hex, index) => {
    const prev = lockedByIndex.get(index);
    if (prev?.locked) return prev;
    return { id: prev?.id ?? createId("color"), hex, alpha: prev?.alpha ?? 100, locked: false };
  });
}

/** Generate a fresh palette from a random base hue */
export function generateFresh(mode: PaletteMode, size: number): string[] {
  if (mode === "Random") return generateRandomPalette(size);
  const baseHue = Math.floor(Math.random() * 360);
  const baseSat = 55 + Math.floor(Math.random() * 35);
  const baseLit = 35 + Math.floor(Math.random() * 35);
  const offsets = getCachedHarmonyOffsets(mode, size);
  return offsets.map((hueOffset, i) => {
    const h = (baseHue + hueOffset + 360) % 360;
    const sat = varySat(baseSat, i, size, mode);
    const lit = varyLit(baseLit, i, size, mode);
    return hslToHex(h, sat, lit);
  });
}

/** Generate harmony from a specific base hex. Used by tests. */
export function generateHarmony(baseHex: string, mode: PaletteMode, size: number): string[] {
  const base = hexToHsl(normalizeHex(baseHex) ?? generateHex());
  const s = clamp(size, minPaletteSize, maxPaletteSize);
  const offsets = getCachedHarmonyOffsets(mode, s);
  return offsets.map((o, i) => hslToHex((base.h + o + 360) % 360, varySat(70, i, s, mode), varyLit(45, i, s, mode)));
}

function varySat(base: number, i: number, size: number, mode: PaletteMode): number {
  if (mode === "Monochromatic") return clamp(base + (i - Math.floor(size / 2)) * 12, 15, 95);
  return clamp(base + ((i % 3) - 1) * 15 + (i % 2 === 0 ? 5 : -5), 25, 95);
}

function varyLit(base: number, i: number, size: number, mode: PaletteMode): number {
  if (mode === "Monochromatic") return clamp(10 + (i / Math.max(size - 1, 1)) * 75, 5, 95);
  return clamp(base + (i % 2 === 0 ? 12 : -8) + Math.floor(i / 3) * 4, 12, 90);
}

/** Generate a curated random palette with strong hue separation */
function generateRandomPalette(size: number): string[] {
  const strategy = Math.floor(Math.random() * 4);
  let hues: number[];
  switch (strategy) {
    case 0: // Wide spread around a theme
      { const h = Math.random() * 360; hues = spreadHues(h, size, 120 + Math.random() * 120); break; }
    case 1: // Two complementary clusters
      { const h1 = Math.random() * 360; const h2 = (h1 + 150 + Math.random() * 60) % 360;
        hues = Array.from({ length: size }, (_, i) => i < Math.ceil(size / 2) ? h1 + Math.random() * 30 : h2 + Math.random() * 30); break; }
    case 2: // Triadic spread
      { const h = Math.random() * 360;
        hues = Array.from({ length: size }, (_, i) => (h + i * (120 + Math.random() * 20)) % 360); break; }
    default: // Fully random with minimum separation
      hues = []; let attempts = 0;
      while (hues.length < size && attempts < 100) {
        const h = Math.random() * 360;
        if (hues.every((e) => Math.abs(e - h) > 20 || Math.abs(e - h - 360) > 20)) hues.push(h);
        attempts++;
      }
      while (hues.length < size) hues.push(Math.random() * 360);
  }
  return hues.map((h) => {
    const sat = 50 + Math.floor(Math.random() * 40);
    const lit = 35 + Math.floor(Math.random() * 35);
    return hslToHex(Math.round(h), sat, lit);
  });
}

function spreadHues(base: number, count: number, spread: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const step = count > 1 ? spread / (count - 1) : 0;
    return (base + i * step + Math.random() * 20 - 10 + 360) % 360;
  });
}

export function generateHex(seed = Math.random() * 360) {
  const hue = Math.floor(seed % 360);
  const saturation = 60 + Math.floor(Math.random() * 35);
  const lightness = 40 + Math.floor(Math.random() * 35);
  return hslToHex(hue, saturation, lightness);
}

// ── Harmony offset cache ──
const harmonyOffsetsCache = new Map<string, number[]>();

function getCachedHarmonyOffsets(mode: PaletteMode, size: number): number[] {
  const key = `${mode}:${size}`;
  let cached = harmonyOffsetsCache.get(key);
  if (cached) return cached;
  cached = getHarmonyOffsets(mode, size);
  harmonyOffsetsCache.set(key, cached);
  return cached;
}

function getHarmonyOffsets(mode: PaletteMode, size: number) {
  const bases: Record<string, number[]> = {
    Analogous: [-36, -18, 0, 18, 36],
    Monochromatic: [0],
    Complementary: [0, 180],
    Triadic: [0, 120, 240],
    "Split Complementary": [0, 150, 210],
    Tetradic: [0, 60, 180, 240],
  };
  const base = bases[mode] ?? [0];
  return Array.from({ length: size }, (_, i) => base[i % base.length] + Math.floor(i / base.length) * 8);
}
