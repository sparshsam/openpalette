import { getPaletteAccessibilityScore } from "./accessibility-engine";
import { hexToHsl, normalizeHex, getRelativeLuminance } from "./color";
import type { LibrarySort, PaletteRecord } from "./types";

export function paletteSignature(colors: string[]) {
  return colors.map((hex) => normalizeHex(hex) ?? hex).join("-");
}

export function getAverageBrightness(colors: string[]) {
  return colors.reduce((sum, hex) => sum + getRelativeLuminance(hex), 0) / Math.max(colors.length, 1);
}

export function getTemperature(colors: string[]) {
  return colors.reduce((sum, hex) => {
    const { h } = hexToHsl(hex);
    return sum + (h < 70 || h > 310 ? 1 : h > 150 && h < 270 ? -1 : 0);
  }, 0);
}

export function sortPalettes(records: PaletteRecord[], sort: LibrarySort) {
  const sorted = [...records];

  if (sort === "favorites") {
    return sorted.sort((first, second) => Number(second.favorite) - Number(first.favorite) || second.usedAt.localeCompare(first.usedAt));
  }

  if (sort === "brightness") {
    return sorted.sort((first, second) => getAverageBrightness(second.colors) - getAverageBrightness(first.colors));
  }

  if (sort === "contrast") {
    return sorted.sort(
      (first, second) => getPaletteAccessibilityScore(second.colors) - getPaletteAccessibilityScore(first.colors),
    );
  }

  if (sort === "temperature") {
    return sorted.sort((first, second) => getTemperature(second.colors) - getTemperature(first.colors));
  }

  return sorted.sort((first, second) => second.usedAt.localeCompare(first.usedAt));
}

