export type PaletteMode =
  | "Random"
  | "Analogous"
  | "Monochromatic"
  | "Complementary"
  | "Triadic"
  | "Split Complementary"
  | "Tetradic";

export type PaletteColor = {
  id: string;
  hex: string;
  alpha: number;
  locked: boolean;
};

export type PaletteRecord = {
  id: string;
  name: string;
  colors: string[];
  alphas: number[];
  mode: PaletteMode;
  tags: string[];
  collection: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  usedAt: string;
};

export type ContrastHint = {
  hex: string;
  bestTextColor: "#000000" | "#FFFFFF";
  ratio: number;
  aa: boolean;
  aaa: boolean;
  rating: "AAA" | "AA" | "Fail";
};

export type ExportFormat = "CSS" | "SCSS" | "Tailwind" | "JSON" | "Tokens" | "SVG";
export type GradientKind = "linear" | "radial";
export type VisionMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";
export type LibrarySort = "recent" | "brightness" | "contrast" | "temperature" | "favorites";

export const minPaletteSize = 2;
export const maxPaletteSize = 10;
export const defaultPaletteSize = 5;
export const paletteModes: PaletteMode[] = [
  "Analogous",
  "Monochromatic",
  "Complementary",
  "Triadic",
  "Split Complementary",
  "Tetradic",
  "Random",
];

const seedPalettes = [
  ["#0F172A", "#2563EB", "#38BDF8", "#F8FAFC", "#F97316"],
  ["#101828", "#475467", "#98A2B3", "#EAECF0", "#FCFCFD"],
  ["#164E63", "#0891B2", "#67E8F9", "#ECFEFF", "#F59E0B"],
  ["#1F2937", "#7C3AED", "#C084FC", "#F5F3FF", "#10B981"],
  ["#2F1B12", "#8B5E34", "#D6A76C", "#F7E7CE", "#31572C"],
];

export function normalizeHex(input: string) {
  const cleaned = input.trim().replace(/^#/, "").toUpperCase();

  if (/^[0-9A-F]{3}$/.test(cleaned)) {
    return `#${cleaned
      .split("")
      .map((character) => `${character}${character}`)
      .join("")}`;
  }

  if (/^[0-9A-F]{6}$/.test(cleaned)) {
    return `#${cleaned}`;
  }

  return null;
}

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
  const direction = backgroundLuminance > 0.45 ? -1 : 1;

  for (let step = 0; step <= 80; step += 2) {
    const candidate = hslToHex(base.h, base.s, clamp(base.l + step * direction, 5, 95));
    if (getContrastRatio(candidate, background) >= 4.5) {
      return candidate;
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

export function parsePaletteInput(input: string) {
  const trimmed = input.trim();
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

export function createExportSnippets(colors: string[], alphas: number[]) {
  const colorEntries = colors.map((hex, index) => ({
    name: `color-${index + 1}`,
    token: String(index + 1),
    hex: normalizeHex(hex) ?? "#000000",
    alpha: clamp(alphas[index] ?? 100, 0, 100),
  }));

  const css = `:root {\n${colorEntries
    .map((entry) => `  --op-${entry.name}: ${entry.hex};\n  --op-${entry.name}-rgb: ${hexToRgbString(entry.hex)};`)
    .join("\n")}\n}`;

  const scss = colorEntries.map((entry) => `$op-${entry.name}: ${entry.hex};`).join("\n");

  const tailwind = `/** @type {import('tailwindcss').Config} */\nexport default {\n  theme: {\n    extend: {\n      colors: {\n        openpalette: {\n${colorEntries
        .map((entry) => `          "${entry.token}": "${entry.hex}",`)
        .join("\n")}\n        },\n      },\n    },\n  },\n};`;

  const json = JSON.stringify({ name: "OpenPalette export", colors: colorEntries }, null, 2);
  const tokens = JSON.stringify(
    {
      $schema: "https://design-tokens.github.io/community-group/format/",
      color: Object.fromEntries(
        colorEntries.map((entry) => [
          entry.name,
          {
            $type: "color",
            $value: entry.hex,
            $extensions: { alpha: entry.alpha / 100 },
          },
        ]),
      ),
    },
    null,
    2,
  );

  const swatchWidth = 180;
  const swatchHeight = 140;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${swatchWidth * colorEntries.length}" height="${swatchHeight}" viewBox="0 0 ${swatchWidth * colorEntries.length} ${swatchHeight}" role="img" aria-label="OpenPalette color swatches">\n${colorEntries
    .map(
      (entry, index) =>
        `  <rect x="${index * swatchWidth}" y="0" width="${swatchWidth}" height="${swatchHeight}" fill="${entry.hex}" opacity="${entry.alpha / 100}" />\n  <text x="${index * swatchWidth + 16}" y="${swatchHeight - 18}" fill="${getReadableTextColor(entry.hex)}" font-family="monospace" font-size="16">${entry.hex}</text>`,
    )
    .join("\n")}\n</svg>`;

  return { CSS: css, SCSS: scss, Tailwind: tailwind, JSON: json, Tokens: tokens, SVG: svg } satisfies Record<
    ExportFormat,
    string
  >;
}

export function createGradientCss(colors: string[], kind: GradientKind, angle: number) {
  const stops = colors.map((hex, index) => `${hex} ${Math.round((index / Math.max(colors.length - 1, 1)) * 100)}%`);

  if (kind === "radial") {
    return `radial-gradient(circle at center, ${stops.join(", ")})`;
  }

  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

export function createGradientSvg(colors: string[], kind: GradientKind, angle: number) {
  const id = "openpalette-gradient";
  const stops = colors
    .map((hex, index) => `    <stop offset="${Math.round((index / Math.max(colors.length - 1, 1)) * 100)}%" stop-color="${hex}" />`)
    .join("\n");

  if (kind === "radial") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">\n  <defs>\n    <radialGradient id="${id}" cx="50%" cy="50%" r="70%">\n${stops}\n    </radialGradient>\n  </defs>\n  <rect width="1200" height="800" fill="url(#${id})" />\n</svg>`;
  }

  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * 50;
  const y = Math.sin(radians) * 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">\n  <defs>\n    <linearGradient id="${id}" x1="${50 - x}%" y1="${50 - y}%" x2="${50 + x}%" y2="${50 + y}%">\n${stops}\n    </linearGradient>\n  </defs>\n  <rect width="1200" height="800" fill="url(#${id})" />\n</svg>`;
}

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

export function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex) ?? "#000000";
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    h: Math.round((hue + 360) % 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

export function hslToHex(hue: number, saturation: number, lightness: number) {
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;
  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const huePrime = (((hue % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const match = normalizedLightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = x;
  } else if (huePrime < 2) {
    red = x;
    green = chroma;
  } else if (huePrime < 3) {
    green = chroma;
    blue = x;
  } else if (huePrime < 4) {
    green = x;
    blue = chroma;
  } else if (huePrime < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return rgbToHex({
    r: (red + match) * 255,
    g: (green + match) * 255,
    b: (blue + match) * 255,
  });
}

export function getContrastRatio(firstHex: string, secondHex: string) {
  const firstLuminance = getRelativeLuminance(firstHex);
  const secondLuminance = getRelativeLuminance(secondHex);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
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

function hexToRgbString(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [red, green, blue] = [r, g, b].map((channelValue) => {
    const channel = channelValue / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
