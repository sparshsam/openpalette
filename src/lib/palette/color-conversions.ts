import { hexToRgb, rgbToHex, clamp } from "./color";

// ---------------------------------------------------------------------------
// HSV
// ---------------------------------------------------------------------------

export function hexToHsv(
  hex: string,
): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === red) {
      h = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      h = 60 * ((blue - red) / delta + 2);
    } else {
      h = 60 * ((red - green) / delta + 4);
    }
  }

  if (h < 0) h += 360;

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return {
    h: Math.round(((h % 360) + 360) % 360),
    s: Math.round(s),
    v: Math.round(v),
  };
}

export function hsvToHex(
  h: number,
  s: number,
  v: number,
): string {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(v, 0, 100) / 100;

  const chroma = value * saturation;
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const m = value - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  const segment = Math.floor(huePrime);

  switch (segment) {
    case 0: {
      red = chroma;
      green = x;
      break;
    }
    case 1: {
      red = x;
      green = chroma;
      break;
    }
    case 2: {
      green = chroma;
      blue = x;
      break;
    }
    case 3: {
      green = x;
      blue = chroma;
      break;
    }
    case 4: {
      red = x;
      blue = chroma;
      break;
    }
    default: {
      red = chroma;
      blue = x;
      break;
    }
  }

  return rgbToHex({
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255),
  });
}

// ---------------------------------------------------------------------------
// CMYK
// ---------------------------------------------------------------------------

export function hexToCmyk(
  hex: string,
): { c: number; m: number; y: number; k: number } {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const k = 1 - Math.max(red, green, blue);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: Math.round(((1 - red - k) / (1 - k)) * 100),
    m: Math.round(((1 - green - k) / (1 - k)) * 100),
    y: Math.round(((1 - blue - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToHex(
  c: number,
  m: number,
  y: number,
  k: number,
): string {
  const cyan = clamp(c, 0, 100) / 100;
  const magenta = clamp(m, 0, 100) / 100;
  const yellow = clamp(y, 0, 100) / 100;
  const black = clamp(k, 0, 100) / 100;

  return rgbToHex({
    r: Math.round((1 - Math.min(1, cyan * (1 - black) + black)) * 255),
    g: Math.round((1 - Math.min(1, magenta * (1 - black) + black)) * 255),
    b: Math.round((1 - Math.min(1, yellow * (1 - black) + black)) * 255),
  });
}

// ---------------------------------------------------------------------------
// CIE Lab (D65 illuminant, 2-degree standard observer)
// ---------------------------------------------------------------------------

const XN = 0.95047;
const YN = 1;
const ZN = 1.08883;

function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number): number {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function labF(t: number): number {
  return t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116;
}

function labFInv(t: number): number {
  return t > 0.206897 ? t ** 3 : (t - 16 / 116) / 7.787;
}

/** Convert a hex color to CIE Lab (l: 0-100, a: ~-128-127, b: ~-128-127). */
export function hexToLab(
  hex: string,
): { l: number; a: number; b: number } {
  const { r, g, b } = hexToRgb(hex);
  const rLin = srgbToLinear(r / 255);
  const gLin = srgbToLinear(g / 255);
  const bLin = srgbToLinear(b / 255);

  // sRGB -> XYZ (D65)
  const x = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
  const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.072175 * bLin;
  const z = 0.0193339 * rLin + 0.119192 * gLin + 0.9503041 * bLin;

  const fx = labF(x / XN);
  const fy = labF(y / YN);
  const fz = labF(z / ZN);

  return {
    l: Math.round(116 * fy - 16),
    a: Math.round(500 * (fx - fy)),
    b: Math.round(200 * (fy - fz)),
  };
}

/** Convert CIE Lab back to hex via XYZ intermediate. */
export function labToHex(l: number, a: number, b: number): string {
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const x = XN * labFInv(fx);
  const y = YN * labFInv(fy);
  const z = ZN * labFInv(fz);

  // XYZ -> linear sRGB (inverse D65)
  const rLin = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gLin = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bLin = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  const r = Math.round(clamp(linearToSrgb(rLin) * 255, 0, 255));
  const g = Math.round(clamp(linearToSrgb(gLin) * 255, 0, 255));
  const blueVal = Math.round(clamp(linearToSrgb(bLin) * 255, 0, 255));

  return rgbToHex({ r, g, b: blueVal });
}
