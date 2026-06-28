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
  const baseSat = 55 + Math.floor(Math.random() * 35); // 55–90
  const baseLit = 40 + Math.floor(Math.random() * 30); // 40–70
  const offsets = getHarmonyOffsets(mode, size);
  return offsets.map((hueOffset, i) => {
    const h = (baseHue + hueOffset + 360) % 360;
    return hslToHex(h, varySat(baseSat, i, size, mode), varyLit(baseLit, i, size, mode));
  });
}

/** Generate harmony from a specific base hex. Used by tests. */
export function generateHarmony(baseHex: string, mode: PaletteMode, size: number): string[] {
  const base = hexToHsl(normalizeHex(baseHex) ?? generateHex());
  const s = clamp(size, minPaletteSize, maxPaletteSize);
  const offsets = getHarmonyOffsets(mode, s);
  return offsets.map((o, i) => hslToHex((base.h + o + 360) % 360, varySat(65, i, s, mode), varyLit(50, i, s, mode)));
}

function varySat(base: number, i: number, size: number, mode: PaletteMode): number {
  if (mode === "Monochromatic") return clamp(base + (i - Math.floor(size / 2)) * 8, 20, 95);
  return clamp(base + ((i % 3) - 1) * 12, 30, 95);
}

function varyLit(base: number, i: number, size: number, mode: PaletteMode): number {
  if (mode === "Monochromatic") return clamp(15 + (i / Math.max(size - 1, 1)) * 70, 8, 92);
  return clamp(base + (i % 2 === 0 ? 8 : -6) + Math.floor(i / 3) * 2, 15, 88);
}

/** Generate a curated random palette: pick a random scheme and spread hues */
function generateRandomPalette(size: number): string[] {
  const schemes = [
    () => { const h = Math.random() * 360; return spreadHues(h, size, 30 + Math.random() * 30); },
    () => spreadHues(Math.random() * 360, size, 60 + Math.random() * 60),
    () => Array.from({ length: size }, () => Math.floor(Math.random() * 360)),
  ];
  const hues = schemes[Math.floor(Math.random() * schemes.length)]();
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
