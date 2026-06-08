import { defaultTokenScales } from "./constants";
import { hexToRgb, normalizeHex } from "./color";
import { getReadableTextColor } from "./accessibility-engine";
import type { DesignTokenSet, ExportFormat } from "./types";

export function createExportSnippets(colors: string[], alphas: number[]) {
  const colorEntries = colors.map((hex, index) => ({
    name: `color-${index + 1}`,
    token: String(index + 1),
    hex: normalizeHex(hex) ?? "#000000",
    alpha: clampAlpha(alphas[index] ?? 100),
  }));
  const tokenSet: DesignTokenSet = {
    colors: colorEntries.map((entry) => entry.hex),
    alphas: colorEntries.map((entry) => entry.alpha),
    ...defaultTokenScales,
  };

  const css = `:root {\n${[
    ...colorEntries.flatMap((entry) => [`  --op-${entry.name}: ${entry.hex};`, `  --op-${entry.name}-rgb: ${hexToRgbString(entry.hex)};`]),
    ...defaultTokenScales.spacing.map((value, index) => `  --op-space-${index}: ${value}px;`),
    ...defaultTokenScales.radii.map((value, index) => `  --op-radius-${index}: ${value}px;`),
    ...defaultTokenScales.durations.map((value, index) => `  --op-duration-${index}: ${value}ms;`),
  ].join("\n")}\n}`;

  const scss = [
    ...colorEntries.map((entry) => `$op-${entry.name}: ${entry.hex};`),
    ...defaultTokenScales.spacing.map((value, index) => `$op-space-${index}: ${value}px;`),
  ].join("\n");

  const tailwind = `/** @type {import('tailwindcss').Config} */\nexport default {\n  theme: {\n    extend: {\n      colors: {\n        openpalette: {\n${colorEntries
        .map((entry) => `          "${entry.token}": "${entry.hex}",`)
        .join("\n")}\n        },\n      },\n      spacing: {\n${defaultTokenScales.spacing
        .map((value, index) => `        "op-${index}": "${value}px",`)
        .join("\n")}\n      },\n      borderRadius: {\n${defaultTokenScales.radii
        .map((value, index) => `        "op-${index}": "${value}px",`)
        .join("\n")}\n      },\n    },\n  },\n};`;

  const json = JSON.stringify({ name: "OpenPalette export", colors: colorEntries, scales: defaultTokenScales }, null, 2);
  const tokens = JSON.stringify(createDesignTokens(tokenSet), null, 2);
  const styleDictionary = JSON.stringify(createStyleDictionaryTokens(tokenSet), null, 2);
  const swatchWidth = 180;
  const swatchHeight = 140;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${swatchWidth * colorEntries.length}" height="${swatchHeight}" viewBox="0 0 ${swatchWidth * colorEntries.length} ${swatchHeight}" role="img" aria-label="OpenPalette color swatches">\n${colorEntries
    .map(
      (entry, index) =>
        `  <rect x="${index * swatchWidth}" y="0" width="${swatchWidth}" height="${swatchHeight}" fill="${entry.hex}" opacity="${entry.alpha / 100}" />\n  <text x="${index * swatchWidth + 16}" y="${swatchHeight - 18}" fill="${getReadableTextColor(entry.hex)}" font-family="monospace" font-size="16">${entry.hex}</text>`,
    )
    .join("\n")}\n</svg>`;

  return {
    CSS: css,
    SCSS: scss,
    Tailwind: tailwind,
    JSON: json,
    Tokens: tokens,
    "Style Dictionary": styleDictionary,
    SVG: svg,
  } satisfies Record<ExportFormat, string>;
}

export function createDesignTokens(tokenSet: DesignTokenSet) {
  return {
    $schema: "https://design-tokens.github.io/community-group/format/",
    color: Object.fromEntries(
      tokenSet.colors.map((hex, index) => [
        `color-${index + 1}`,
        {
          $type: "color",
          $value: hex,
          $extensions: { alpha: tokenSet.alphas[index] / 100 },
        },
      ]),
    ),
    spacing: Object.fromEntries(tokenSet.spacing.map((value, index) => [`space-${index}`, { $type: "dimension", $value: `${value}px` }])),
    radius: Object.fromEntries(tokenSet.radii.map((value, index) => [`radius-${index}`, { $type: "dimension", $value: `${value}px` }])),
    motion: Object.fromEntries(tokenSet.durations.map((value, index) => [`duration-${index}`, { $type: "duration", $value: `${value}ms` }])),
  };
}

export function createStyleDictionaryTokens(tokenSet: DesignTokenSet) {
  return {
    color: Object.fromEntries(tokenSet.colors.map((hex, index) => [`palette${index + 1}`, { value: hex, type: "color" }])),
    size: {
      spacing: Object.fromEntries(tokenSet.spacing.map((value, index) => [`${index}`, { value, type: "dimension" }])),
      radius: Object.fromEntries(tokenSet.radii.map((value, index) => [`${index}`, { value, type: "dimension" }])),
    },
    motion: Object.fromEntries(tokenSet.durations.map((value, index) => [`duration${index}`, { value, type: "time" }])),
    shadow: Object.fromEntries(tokenSet.shadows.map((value, index) => [`elevation${index}`, { value, type: "shadow" }])),
  };
}

function hexToRgbString(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

function clampAlpha(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

