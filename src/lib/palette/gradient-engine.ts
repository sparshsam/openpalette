import type { GradientKind } from "./types";

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

export function drawGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
  kind: GradientKind,
  angle: number,
) {
  const gradient =
    kind === "radial"
      ? context.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height) / 1.5)
      : createCanvasLinearGradient(context, width, height, angle);
  colors.forEach((hex, index) => gradient.addColorStop(index / Math.max(colors.length - 1, 1), hex));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function createCanvasLinearGradient(context: CanvasRenderingContext2D, width: number, height: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * width;
  const y = Math.sin(radians) * height;
  return context.createLinearGradient(width / 2 - x / 2, height / 2 - y / 2, width / 2 + x / 2, height / 2 + y / 2);
}

