import { hexToHsl, hexToRgb, rgbToHex } from "./color";

export type ExtractionMode = "balanced" | "vibrant" | "muted" | "pastel" | "dark" | "high-contrast";

/** 6×6×6 RGB cube buckets — 216 buckets covers the full gamut well */
const BUCKET_SIZE = 48;

export function extractPaletteFromPixels(data: Uint8ClampedArray, count: number, mode: ExtractionMode): string[] {
  const buckets = new Map<string, { r: number; g: number; b: number; hits: number; satSum: number; litSum: number }>();

  // Step 1: Bucket pixels with stride sampling
  for (let i = 0; i < data.length; i += 12) {
    const a = data[i + 3];
    if (a < 180) continue;

    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const lit = (max + min) / 510;

    // Mode-specific filtering
    const keep =
      mode === "vibrant" ? sat > 0.3 && lit > 0.15 && lit < 0.9 :
      mode === "muted" ? sat < 0.5 && lit > 0.12 && lit < 0.9 :
      mode === "pastel" ? sat > 0.08 && sat < 0.5 && lit > 0.6 && lit < 0.95 :
      mode === "dark" ? lit < 0.35 :
      mode === "high-contrast" ? (lit < 0.25 || lit > 0.7) && sat > 0.2 :
      true; // balanced

    if (!keep) continue;

    const key = `${Math.round(r / BUCKET_SIZE) * BUCKET_SIZE}-${Math.round(g / BUCKET_SIZE) * BUCKET_SIZE}-${Math.round(b / BUCKET_SIZE) * BUCKET_SIZE}`;
    const bkt = buckets.get(key) ?? { r: 0, g: 0, b: 0, hits: 0, satSum: 0, litSum: 0 };
    bkt.r += r; bkt.g += g; bkt.b += b;
    bkt.hits += 1;
    bkt.satSum += sat;
    bkt.litSum += lit;
    buckets.set(key, bkt);
  }

  const totalPixels = [...buckets.values()].reduce((s, b) => s + b.hits, 0);
  if (totalPixels === 0) return [];

  // Step 2: Compute average color and score per bucket
  const entries = [...buckets.values()].map((b) => {
    const hex = rgbToHex({ r: b.r / b.hits, g: b.g / b.hits, b: b.b / b.hits });
    const avgSat = b.satSum / b.hits;
    const avgLit = b.litSum / b.hits;
    const weight = b.hits / totalPixels;
    // Score: more weight × saturation balance × medium-lightness bonus
    const score = weight * (0.4 + avgSat * 0.6) * (1 - Math.abs(avgLit - 0.55) * 0.5);
    return { hex, avgSat, avgLit, weight, score };
  });

  // Step 3: Sort by score descending, pick diverse colors
  entries.sort((a, b) => b.score - a.score);
  const picked: typeof entries = [];

  for (const e of entries) {
    if (picked.every((p) => colorDistance(p.hex, e.hex) > 55)) {
      picked.push(e);
    }
    if (picked.length >= count) break;
  }

  // Step 4: If we didn't get enough, relax threshold
  if (picked.length < count) {
    const used = new Set(picked.map((p) => p.hex));
    for (const e of entries) {
      if (used.has(e.hex)) continue;
      picked.push(e);
      used.add(e.hex);
      if (picked.length >= count) break;
    }
  }

  // Step 5: Order by hue for a pleasing intentional look
  const hexes = picked.slice(0, count).map((p) => p.hex);
  return orderByHue(hexes);
}

/** Sort colors into a pleasing hue-based order, trying to put neutrals first/last */
function orderByHue(hexes: string[]): string[] {
  const withHue = hexes.map((hex) => {
    const hsl = hexToHsl(hex);
    return { hex, h: hsl.h, s: hsl.s, l: hsl.l };
  });

  // Separate neutrals (low saturation) from chromatics
  const neutrals = withHue.filter((c) => c.s < 15);
  const chromas = withHue.filter((c) => c.s >= 15);

  // Sort chromas by hue
  chromas.sort((a, b) => a.h - b.h);
  // Sort neutrals by lightness (dark to light)
  neutrals.sort((a, b) => a.l - b.l);

  // Interleave: 1 neutral (if exists), then chromas by hue, then remaining neutrals
  const result: string[] = [];
  if (neutrals.length > 0 && chromas.length > 0) {
    // Put darkest neutral first, or lightest if there are many
    result.push(neutrals.shift()!.hex);
  }
  result.push(...chromas.map((c) => c.hex));
  result.push(...neutrals.map((c) => c.hex));

  return result;
}

function colorDistance(a: string, b: string): number {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  return Math.hypot(ca.r - cb.r, ca.g - cb.g, ca.b - cb.b);
}
