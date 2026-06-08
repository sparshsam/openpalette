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

  if (desiredSize === colors.length) {
    return colors;
  }

  if (desiredSize < colors.length) {
    return colors.slice(0, desiredSize);
  }

  const generated = generatePalette(colors, mode, desiredSize);
  return [...colors, ...generated.slice(colors.length)];
}

export function generatePalette(previous: PaletteColor[], mode: PaletteMode, size = previous.length) {
  const desiredSize = clamp(size, minPaletteSize, maxPaletteSize);
  const lockedByIndex = new Map(previous.map((color, index) => [index, color]));
  const base = previous.find((color) => !color.locked)?.hex ?? previous[0]?.hex ?? generateHex();
  const harmony = generateHarmony(base, mode, desiredSize);

  return harmony.map((hex, index) => {
    const previousColor = lockedByIndex.get(index);

    if (previousColor?.locked) {
      return previousColor;
    }

    return {
      id: previousColor?.id ?? createId("color"),
      hex,
      alpha: previousColor?.alpha ?? 100,
      locked: false,
    };
  });
}

export function generateHarmony(baseHex: string, mode: PaletteMode, size: number) {
  const base = hexToHsl(normalizeHex(baseHex) ?? generateHex());
  const desiredSize = clamp(size, minPaletteSize, maxPaletteSize);
  const hueOffsets = getHarmonyOffsets(mode, desiredSize);

  return hueOffsets.map((offset, index) => {
    const saturation =
      mode === "Monochromatic"
        ? clamp(base.s + (index - desiredSize / 2) * 6, 22, 92)
        : clamp(base.s + ((index % 3) - 1) * 8, 28, 92);
    const lightness =
      mode === "Monochromatic"
        ? clamp(18 + (index / Math.max(desiredSize - 1, 1)) * 64, 12, 88)
        : clamp(base.l + ((index % 4) - 1.5) * 7, 18, 86);

    return hslToHex((base.h + offset + 360) % 360, saturation, lightness);
  });
}

export function generateHex(seed = Math.random() * 360) {
  const hue = Math.floor(seed % 360);
  const saturation = 54 + Math.floor(Math.random() * 36);
  const lightness = 34 + Math.floor(Math.random() * 38);

  return hslToHex(hue, saturation, lightness);
}

function getHarmonyOffsets(mode: PaletteMode, size: number) {
  if (mode === "Random") {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 360));
  }

  const bases = {
    Analogous: [-36, -18, 0, 18, 36],
    Monochromatic: [0],
    Complementary: [0, 180],
    Triadic: [0, 120, 240],
    "Split Complementary": [0, 150, 210],
    Tetradic: [0, 60, 180, 240],
  } satisfies Record<Exclude<PaletteMode, "Random">, number[]>;
  const base = bases[mode];

  return Array.from({ length: size }, (_, index) => base[index % base.length] + Math.floor(index / base.length) * 8);
}

