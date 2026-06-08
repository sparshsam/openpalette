import { clamp, getContrastRatio, getRelativeLuminance, hexToHsl, hexToRgb, hslToHex, normalizeHex, rgbToHex } from "./color";
import type { ContrastHint, VisionMode } from "./types";

export function getReadableTextColor(hex: string) {
  return getContrastHint(hex).bestTextColor === "#000000" ? "#111827" : "#F9FAFB";
}

export function getContrastHint(hex: string): ContrastHint {
  const normalized = normalizeHex(hex) ?? "#000000";
  const blackRatio = getContrastRatio(normalized, "#000000");
  const whiteRatio = getContrastRatio(normalized, "#FFFFFF");
  const ratio = Math.max(blackRatio, whiteRatio);
  const bestTextColor = blackRatio >= whiteRatio ? "#000000" : "#FFFFFF";

  return {
    hex: normalized,
    bestTextColor,
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    rating: ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "Fail",
  };
}

export function getPaletteAccessibilityScore(colors: string[]) {
  if (colors.length === 0) {
    return 0;
  }

  const hints = colors.map((hex) => getContrastHint(hex));
  const average = hints.reduce((sum, hint) => sum + Math.min(hint.ratio / 7, 1), 0) / hints.length;
  const pairScores = getPairContrasts(colors);
  const pairAverage =
    pairScores.length === 0
      ? 1
      : pairScores.reduce((sum, pair) => sum + Math.min(pair.ratio / 4.5, 1), 0) / pairScores.length;

  return Math.round((average * 0.6 + pairAverage * 0.4) * 100);
}

export function getPairContrasts(colors: string[]) {
  const pairs: { foreground: string; background: string; ratio: number; aa: boolean; aaa: boolean }[] = [];

  for (let index = 0; index < colors.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < colors.length; nextIndex += 1) {
      const ratio = getContrastRatio(colors[index], colors[nextIndex]);
      pairs.push({
        foreground: colors[index],
        background: colors[nextIndex],
        ratio,
        aa: ratio >= 4.5,
        aaa: ratio >= 7,
      });
    }
  }

  return pairs.sort((first, second) => first.ratio - second.ratio);
}

export function suggestAccessibleReplacement(foreground: string, background: string) {
  const base = hexToHsl(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const directions = backgroundLuminance > 0.45 ? [-1, 1] : [1, -1];

  for (const direction of directions) {
    for (let step = 0; step <= 95; step += 2) {
      const candidate = hslToHex(base.h, base.s, clamp(base.l + step * direction, 2, 98));
      if (getContrastRatio(candidate, background) >= 4.5) {
        return candidate;
      }
    }
  }

  return backgroundLuminance > 0.45 ? "#111111" : "#FFFFFF";
}

export function simulateVision(hex: string, mode: VisionMode) {
  if (mode === "none") {
    return normalizeHex(hex) ?? "#000000";
  }

  const { r, g, b } = hexToRgb(hex);
  const matrices = {
    protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
    deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
    tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  } satisfies Record<Exclude<VisionMode, "none">, number[]>;
  const matrix = matrices[mode];

  return rgbToHex({
    r: clamp(Math.round(r * matrix[0] + g * matrix[1] + b * matrix[2]), 0, 255),
    g: clamp(Math.round(r * matrix[3] + g * matrix[4] + b * matrix[5]), 0, 255),
    b: clamp(Math.round(r * matrix[6] + g * matrix[7] + b * matrix[8]), 0, 255),
  });
}
