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
  const normalized = normalizeHex(hex) ?? "#000000";
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance > 0.58 ? "#111827" : "#F9FAFB";
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
