import { maxPaletteSize, minPaletteSize, paletteModes } from "./constants";
import { clamp, createId, normalizeHex } from "./color";
import type { PaletteColor, PaletteMode } from "./types";

export function parsePaletteInput(input: string) {
  const trimmed = input.trim();
  const shared = parsePaletteFromUrl(trimmed);

  if (shared) {
    return shared.colors.map((color) => color.hex);
  }

  const parsed = new Set<string>();

  try {
    const json = JSON.parse(trimmed) as unknown;
    collectHexValues(json, parsed);
  } catch {
    // Plain text, CSS, and Tailwind snippets are handled by regex below.
  }

  for (const match of trimmed.matchAll(/#?[0-9A-Fa-f]{6}\b|#?[0-9A-Fa-f]{3}\b/g)) {
    const normalized = normalizeHex(match[0]);
    if (normalized) {
      parsed.add(normalized);
    }
  }

  return [...parsed].slice(0, maxPaletteSize);
}

export function encodePaletteState(colors: PaletteColor[], mode: PaletteMode) {
  const payload = {
    colors: colors.map((color) => color.hex.replace("#", "")),
    alphas: colors.map((color) => color.alpha),
    locks: colors.map((color) => (color.locked ? 1 : 0)),
    mode,
  };

  return btoa(JSON.stringify(payload)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodePaletteState(value: string) {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as {
      colors?: string[];
      alphas?: number[];
      locks?: number[];
      mode?: PaletteMode;
    };

    if (!Array.isArray(parsed.colors)) {
      return null;
    }

    const colors = parsed.colors
      .map((hex, index) => ({
        id: createId("color"),
        hex: normalizeHex(hex) ?? "#111827",
        alpha: clamp(parsed.alphas?.[index] ?? 100, 0, 100),
        locked: parsed.locks?.[index] === 1,
      }))
      .slice(0, maxPaletteSize);

    if (colors.length < minPaletteSize) {
      return null;
    }

    return {
      colors,
      mode: paletteModes.includes(parsed.mode ?? "Random") ? parsed.mode ?? "Random" : "Random",
    };
  } catch {
    return null;
  }
}

function parsePaletteFromUrl(input: string) {
  try {
    const url = new URL(input);
    const encoded = url.searchParams.get("palette");
    return encoded ? decodePaletteState(encoded) : null;
  } catch {
    return null;
  }
}

function collectHexValues(value: unknown, output: Set<string>) {
  if (typeof value === "string") {
    const normalized = normalizeHex(value);
    if (normalized) {
      output.add(normalized);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectHexValues(entry, output));
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectHexValues(entry, output));
  }
}

