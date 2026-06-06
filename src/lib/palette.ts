export type PaletteColor = {
  id: string;
  hex: string;
  locked: boolean;
};

export type SavedPalette = {
  id: string;
  name: string;
  colors: string[];
  createdAt: string;
};

export type ContrastHint = {
  hex: string;
  bestTextColor: "#000000" | "#FFFFFF";
  ratio: number;
  rating: "Strong" | "Okay" | "Weak";
 };

export type ExportFormat = "CSS" | "Tailwind" | "JSON" | "SVG";

export const PALETTE_SIZE = 5;

const seedPalettes = [
  ["#0F172A", "#2563EB", "#38BDF8", "#F8FAFC", "#F97316"],
  ["#18181B", "#52525B", "#A1A1AA", "#E4E4E7", "#FAFAFA"],
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
    rating: ratio >= 7 ? "Strong" : ratio >= 4.5 ? "Okay" : "Weak",
  };
}

export function createPalette(colors?: string[]): PaletteColor[] {
  const source = colors ?? seedPalettes[1];

  return source.slice(0, PALETTE_SIZE).map((hex, index) => ({
    id: `color-${index + 1}`,
    hex,
    locked: false,
  }));
}

export function generateHex() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 54 + Math.floor(Math.random() * 36);
  const lightness = 34 + Math.floor(Math.random() * 38);

  return hslToHex(hue, saturation, lightness);
}

export function generatePalette(previous: PaletteColor[]) {
  return previous.map((color) => ({
    ...color,
    hex: color.locked ? color.hex : generateHex(),
  }));
}

export function createExportSnippets(colors: string[]) {
  const normalizedColors = colors.map((color) => normalizeHex(color) ?? "#000000");
  const colorEntries = normalizedColors.map((hex, index) => ({
    name: `color-${index + 1}`,
    hex,
  }));

  const css = `:root {\n${colorEntries
    .map((entry) => `  --openpalette-${entry.name}: ${entry.hex};`)
    .join("\n")}\n}`;

  const tailwind = `/** @type {import('tailwindcss').Config} */\nexport default {\n  theme: {\n    extend: {\n      colors: {\n        openpalette: {\n${colorEntries
          .map((entry) => `          "${indexToken(entry.name)}": "${entry.hex}",`)
          .join("\n")}\n        },\n      },\n    },\n  },\n};`;

  const json = JSON.stringify(
    {
      name: "OpenPalette export",
      colors: colorEntries,
    },
    null,
    2,
  );

  const swatchWidth = 160;
  const swatchHeight = 120;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${swatchWidth * normalizedColors.length}" height="${swatchHeight}" viewBox="0 0 ${swatchWidth * normalizedColors.length} ${swatchHeight}" role="img" aria-label="OpenPalette color swatches">\n${normalizedColors
    .map((hex, index) => `  <rect x="${index * swatchWidth}" y="0" width="${swatchWidth}" height="${swatchHeight}" fill="${hex}" />`)
    .join("\n")}\n</svg>`;

  return {
    CSS: css,
    Tailwind: tailwind,
    JSON: json,
    SVG: svg,
  } satisfies Record<ExportFormat, string>;
}

function indexToken(name: string) {
  return name.replace("color-", "");
}

function getContrastRatio(firstHex: string, secondHex: string) {
  const firstLuminance = getRelativeLuminance(firstHex);
  const secondLuminance = getRelativeLuminance(secondHex);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function getRelativeLuminance(hex: string) {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;
  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const huePrime = hue / 60;
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

  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + match) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}
