import { hexToHsl } from "./color";
import { getPaletteAccessibilityScore, getPairContrasts } from "./accessibility-engine";
import type { PaletteMode } from "./types";

export interface HealthReport {
  overall: number;
  harmony: number;
  accessibility: number;
  contrast: number;
  vibrancy: number;
  balance: number;
  diversity: number;
  uiReadiness: number;
  gradientQuality: number;
  breakdown: {
    label: string;
    score: number;
    max: number;
    detail: string;
  }[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: "improve-harmony" | "improve-accessibility" | "increase-vibrancy" | "reduce-saturation" | "improve-dark" | "improve-light" | "balance-palette" | "better-accent";
  label: string;
  detail: string;
  severity: "high" | "medium" | "low";
  apply: (colors: string[]) => string[];
}

export interface VisualAnalytics {
  hues: { label: string; count: number; hex: string }[];
  saturations: { range: string; count: number }[];
  lightnesses: { range: string; count: number }[];
  warmCount: number;
  coolCount: number;
  neutralCount: number;
  contrastMatrix: { bg: string; fg: string; ratio: number; aa: boolean; aaa: boolean }[];
}

// ── Memoization cache keyed by palette hash ──
function paletteHash(colors: string[]): string {
  return colors.join(",");
}

const analyzeCache = new Map<string, HealthReport>();
const visualCache = new Map<string, VisualAnalytics>();

export function analyzePalette(colors: string[], mode: PaletteMode): HealthReport {
  const hash = paletteHash(colors) + "|" + mode;
  const cached = analyzeCache.get(hash);
  if (cached) return cached;

  const hexes = colors.filter(Boolean);
  const n = hexes.length;
  if (n < 2) return emptyReport();

  const hsls = hexes.map((h) => hexToHsl(h)).filter(Boolean);
  const pairs = getPairContrasts(hexes);
  const accessScore = getPaletteAccessibilityScore(hexes);

  // ── Harmony ──
  const hues = hsls.map((h) => h.h);
  const sorted = [...hues].sort((a, b) => a - b);
  const gaps = sorted.map((h, i) => {
    const next = sorted[(i + 1) % sorted.length];
    return Math.min(Math.abs(next - h), 360 - Math.abs(next - h));
  });
  const evenGaps = gaps.every((g) => g > 20 && g < 100);
  const harmonyScore = Math.round(Math.min(100, Math.max(0, evenGaps ? 80 : 40, 100 - Math.max(...gaps) * 0.4)));

  // ── Accessibility ──
  const accessScoreNorm = Math.round(accessScore);

  // ── Contrast ──
  const avgRatio = pairs.length > 0 ? pairs.reduce((s, p) => s + p.ratio, 0) / pairs.length : 1;
  const contrastScore = Math.round(Math.min(100, (avgRatio / 21) * 100));

  // ── Vibrancy ──
  const avgSat = hsls.reduce((s, h) => s + h.s, 0) / hsls.length;
  const vibrancyScore = Math.round(Math.min(100, avgSat * 1.1));

  // ── Balance ──
  const warm = hsls.filter((h) => h.h < 60 || h.h > 300).length;
  const cool = hsls.filter((h) => h.h >= 150 && h.h <= 270).length;
  const warmRatio = warm / n;
  const coolRatio = cool / n;
  const balanceScore = Math.round(100 - Math.abs(warmRatio - coolRatio) * 100);

  // ── Diversity ──
  const hueRange = Math.max(...sorted) - Math.min(...sorted);
  const wrapRange = Math.min(hueRange, 360 - hueRange);
  const diversityScore = Math.round(Math.min(100, (wrapRange / 180) * 100));

  // ── UI Readiness ──
  const hasLight = hsls.some((h) => h.l > 85);
  const hasDark = hsls.some((h) => h.l < 20);
  const uiScore = Math.round((hasLight ? 30 : 0) + (hasDark ? 30 : 0) + (accessScoreNorm >= 50 ? 40 : accessScoreNorm * 0.8));

  // ── Gradient Quality ──
  const gradientGaps = gaps.filter((g) => g > 10 && g < 120).length;
  const gradScore = Math.round(Math.min(100, (gradientGaps / Math.max(n - 1, 1)) * 100));

  // ── Composite ──
  const overall = Math.round(
    (harmonyScore * 0.15) +
    (accessScoreNorm * 0.2) +
    (contrastScore * 0.15) +
    (vibrancyScore * 0.1) +
    (balanceScore * 0.1) +
    (diversityScore * 0.1) +
    (uiScore * 0.1) +
    (gradScore * 0.1)
  );

  // ── Recommendations ──
  const recs: Recommendation[] = [];

  if (harmonyScore < 60) recs.push(createRec("improve-harmony", "Improve Harmony", "Colors don't follow a clear harmony pattern. Generate a complementary or triadic palette.", "medium"));
  if (accessScoreNorm < 60) recs.push(createRec("improve-accessibility", "Improve Accessibility", `${pairs.filter((p) => !p.aa).length} color pairs fail WCAG AA. Adjust lightness for better contrast.`, "high"));
  if (vibrancyScore < 40) recs.push(createRec("increase-vibrancy", "Increase Vibrancy", "Colors are too muted. Increase saturation for more visual impact.", "low"));
  if (avgSat > 75) recs.push(createRec("reduce-saturation", "Reduce Saturation", "Colors are very intense. Reduce saturation for a more refined look.", "low"));
  if (!hasDark) recs.push(createRec("improve-dark", "Improve Dark Mode", "No very dark color found. Add a deep shade for dark mode support.", "medium"));
  if (!hasLight) recs.push(createRec("improve-light", "Improve Light Mode", "No very light color found. Add a light tint for backgrounds.", "medium"));
  if (balanceScore < 60) recs.push(createRec("balance-palette", "Balance Palette", `The palette is skewed ${warm > cool ? "warm" : "cool"}. Add more ${warm > cool ? "cool" : "warm"} colors.`, "medium"));
  if (diversityScore < 50) recs.push(createRec("better-accent", "Generate Better Accent", "Colors are too similar. Add a contrasting accent color.", "medium"));

  const breakdown = [
    { label: "Harmony", score: harmonyScore, max: 100, detail: `${mode} pattern` },
    { label: "Accessibility", score: accessScoreNorm, max: 100, detail: `${pairs.filter((p) => p.aa).length}/${pairs.length} AA pairs` },
    { label: "Contrast", score: contrastScore, max: 100, detail: `${avgRatio.toFixed(1)}:1 average` },
    { label: "Vibrancy", score: vibrancyScore, max: 100, detail: `${Math.round(avgSat)}% avg saturation` },
    { label: "Balance", score: balanceScore, max: 100, detail: `${warm} warm · ${cool} cool` },
    { label: "Diversity", score: diversityScore, max: 100, detail: `${Math.round(wrapRange)}° hue range` },
    { label: "UI Readiness", score: uiScore, max: 100, detail: hasLight && hasDark ? "Full range" : hasLight ? "No dark" : hasDark ? "No light" : "Limited" },
    { label: "Gradient", score: gradScore, max: 100, detail: `${n} colors` },
  ];

  const result: HealthReport = { overall, harmony: harmonyScore, accessibility: accessScoreNorm, contrast: contrastScore, vibrancy: vibrancyScore, balance: balanceScore, diversity: diversityScore, uiReadiness: uiScore, gradientQuality: gradScore, breakdown, recommendations: recs };
  analyzeCache.set(hash, result);
  return result;
}

export function getVisualAnalytics(colors: string[]): VisualAnalytics {
  const hash = paletteHash(colors);
  const cached = visualCache.get(hash);
  if (cached) return cached;

  const hexes = colors.filter(Boolean);
  const hsls = hexes.map((h) => hexToHsl(h)).filter(Boolean);

  // Hue distribution (6 buckets)
  const hueBuckets = [
    { label: "Red", min: 0, max: 10, count: 0, hex: "#FF0000" },
    { label: "Orange", min: 10, max: 45, count: 0, hex: "#FF8C00" },
    { label: "Yellow", min: 45, max: 70, count: 0, hex: "#FFD700" },
    { label: "Green", min: 70, max: 160, count: 0, hex: "#00AA00" },
    { label: "Turquoise", min: 160, max: 200, count: 0, hex: "#00CED1" },
    { label: "Blue", min: 200, max: 265, count: 0, hex: "#0000FF" },
    { label: "Violet", min: 265, max: 320, count: 0, hex: "#8800FF" },
    { label: "Pink", min: 320, max: 345, count: 0, hex: "#FF69B4" },
    { label: "Red/Pink", min: 345, max: 360, count: 0, hex: "#FF1493" },
  ];

  // Handle wrap-around: Red at 0 = Red at 360
  hsls.forEach((hsl) => {
    for (const b of hueBuckets) {
      if (hsl.h >= b.min && hsl.h < b.max) { b.count++; break; }
    }
  });
  const hues = hueBuckets.filter((b) => b.count > 0);

  // Saturation distribution
  const satBuckets = [
    { range: "0-20%", count: 0 }, { range: "20-40%", count: 0 }, { range: "40-60%", count: 0 },
    { range: "60-80%", count: 0 }, { range: "80-100%", count: 0 },
  ];
  hsls.forEach((hsl) => {
    const idx = Math.min(4, Math.floor(hsl.s / 20));
    satBuckets[idx].count++;
  });
  const saturations = satBuckets.filter((b) => b.count > 0);

  // Lightness distribution
  const lightBuckets = [
    { range: "0-20%", count: 0 }, { range: "20-40%", count: 0 }, { range: "40-60%", count: 0 },
    { range: "60-80%", count: 0 }, { range: "80-100%", count: 0 },
  ];
  hsls.forEach((hsl) => {
    const idx = Math.min(4, Math.floor(hsl.l / 20));
    lightBuckets[idx].count++;
  });
  const lightnesses = lightBuckets.filter((b) => b.count > 0);

  // Warm/cool
  const warm = hsls.filter((h) => h.h < 60 || h.h > 300).length;
  const cool = hsls.filter((h) => h.h >= 150 && h.h <= 270).length;
  const neutral = hexes.length - warm - cool;

  // Contrast matrix (first 5 colors max)
  const pairs = getPairContrasts(hexes.slice(0, 5));
  const contrastMatrix = pairs.slice(0, 15).map((p) => ({
    bg: p.background, fg: p.foreground, ratio: p.ratio, aa: p.aa, aaa: p.aaa,
  }));

  const result: VisualAnalytics = { hues, saturations, lightnesses, warmCount: warm, coolCount: cool, neutralCount: neutral, contrastMatrix };
  visualCache.set(hash, result);
  return result;
}

function emptyReport(): HealthReport {
  return {
    overall: 0, harmony: 0, accessibility: 0, contrast: 0, vibrancy: 0,
    balance: 0, diversity: 0, uiReadiness: 0, gradientQuality: 0,
    breakdown: [], recommendations: [],
  };
}

function createRec(type: Recommendation["type"], label: string, detail: string, severity: Recommendation["severity"]): Recommendation {
  return {
    type, label, detail, severity,
    apply: (appliedColors: string[]) => {
      const hsls = appliedColors.map((h) => hexToHsl(h)).filter(Boolean);
      switch (type) {
        case "improve-accessibility": {
          // Increase contrast by adjusting lightness extremes
          return hsls.map((hsl) => {
            const { h, s, l } = hsl;
            if (l < 25) return hslToApprox(h, s, Math.max(8, l - 5));
            if (l > 75) return hslToApprox(h, s, Math.min(95, l + 5));
            if (l > 40 && l < 60) return hslToApprox(h, s, l < 50 ? l - 10 : l + 10);
            return hslToApprox(h, s, l);
          });
        }
        case "increase-vibrancy":
          return hsls.map((hsl) => hslToApprox(hsl.h, Math.min(100, hsl.s + 20), hsl.l));
        case "reduce-saturation":
          return hsls.map((hsl) => hslToApprox(hsl.h, Math.max(10, hsl.s - 20), hsl.l));
        case "improve-harmony": {
          // Spread hues evenly
          const step = 360 / Math.max(hsls.length, 1);
          return hsls.map((hsl, i) => hslToApprox(i * step, hsl.s, hsl.l));
        }
        case "improve-dark":
          return appliedColors.length >= 1 ? [...appliedColors.slice(1), "#0A0A0A"] : appliedColors;
        case "improve-light":
          return appliedColors.length >= 1 ? [...appliedColors.slice(1), "#F5F5F5"] : appliedColors;
        case "balance-palette": {
          const warmCount = hsls.filter((h) => h.h < 60 || h.h > 300).length;
          const coolCount = hsls.filter((h) => h.h >= 150 && h.h <= 270).length;
          if (warmCount > coolCount) {
            // Replace one warm with a cool blue
            return appliedColors.map((h, i) => i === 0 ? h : hslToApprox(220, 60, 50));
          }
          return appliedColors.map((h, i) => i === 0 ? h : hslToApprox(30, 60, 50));
        }
        case "better-accent": {
          const base = hsls[0];
          if (!base) return appliedColors;
          return appliedColors.map((h, i) => i === appliedColors.length - 1 ? hslToApprox((base.h + 180) % 360, 80, 50) : h);
        }
        default:
          return appliedColors;
      }
    },
  };
}

function hslToApprox(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, Math.round(s)));
  const lig = Math.max(0, Math.min(100, Math.round(l)));
  return `hsl(${Math.round(hue)}, ${sat}%, ${lig}%)`;
}
