import { getContrastHint } from "./accessibility-engine";
import { hexToRgb, rgbToHex } from "./color";

export type ExtractionMode = "balanced" | "vibrant" | "muted";

export function extractPaletteFromPixels(data: Uint8ClampedArray, count: number, mode: ExtractionMode) {
  const buckets = new Map<string, { r: number; g: number; b: number; hits: number; score: number }>();

  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];
    if (alpha < 180) {
      continue;
    }

    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const lightness = (max + min) / 510;
    const wantsVibrant = mode === "vibrant" ? saturation > 0.28 : true;
    const wantsMuted = mode === "muted" ? saturation < 0.55 && lightness > 0.18 && lightness < 0.88 : true;

    if (!wantsVibrant || !wantsMuted || lightness < 0.06 || lightness > 0.96) {
      continue;
    }

    const key = `${Math.round(r / 24) * 24}-${Math.round(g / 24) * 24}-${Math.round(b / 24) * 24}`;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, hits: 0, score: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.hits += 1;
    bucket.score += saturation + (1 - Math.abs(lightness - 0.5));
    buckets.set(key, bucket);
  }

  const selected: string[] = [];
  const candidates = [...buckets.values()]
    .map((bucket) => rgbToHex({ r: bucket.r / bucket.hits, g: bucket.g / bucket.hits, b: bucket.b / bucket.hits }))
    .sort((first, second) => getContrastHint(second).ratio - getContrastHint(first).ratio);

  for (const candidate of candidates) {
    if (selected.every((hex) => colorDistance(hex, candidate) > 48)) {
      selected.push(candidate);
    }
    if (selected.length >= count) {
      break;
    }
  }

  return selected;
}

function colorDistance(first: string, second: string) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

