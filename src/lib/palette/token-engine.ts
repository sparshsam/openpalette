import { hexToHsl, hslToHex } from "./color";

export type NamingPreset = "tailwind" | "material" | "bootstrap" | "fluent" | "apple" | "openpalette" | "custom";

export interface DesignTokens {
  metadata: { name: string; updated: string; preset: NamingPreset; prefix: string; };
  colors: Record<string, SemanticTokens>;
}

export interface SemanticTokens {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
}

export interface TokenGroup {
  id: string;
  label: string;
  tokens: string[];
}

const TOKEN_GROUPS: TokenGroup[] = [
  { id: "brand", label: "Brand", tokens: ["primary", "secondary", "accent"] },
  { id: "semantic", label: "Semantic", tokens: ["success", "warning", "error", "info"] },
  { id: "surface", label: "Surface", tokens: ["background", "surface", "border"] },
  { id: "text", label: "Text", tokens: ["text", "muted"] },
];

export function getTokenGroups() { return TOKEN_GROUPS; }

export function generateTokens(palette: string[], preset: NamingPreset, prefix: string, light: boolean): SemanticTokens {
  const hexes = palette.filter(Boolean);
  const n = hexes.length;
  const get = (i: number) => hexes[i % Math.max(n, 1)] ?? "#000000";


  // Derive semantic colors from the palette
  const primary = get(0);
  const secondary = n > 1 ? get(1) : primary;
  const accent = findAccent(hexes);

  // Semantic: shift hue from primary toward standard meanings
  const baseHsl = hexToHsl(primary);
  const success = hslToHex(120, Math.max(40, baseHsl.s), light ? 40 : 60);
  const warning = hslToHex(45, Math.max(50, baseHsl.s), light ? 50 : 55);
  const error = hslToHex(0, Math.max(50, baseHsl.s), light ? 45 : 55);
  const info = hslToHex(210, Math.max(40, baseHsl.s), light ? 40 : 60);

  // Surface: adjust lightness from palette
  const bgTarget = light ? 97 : 5;
  const surfaceTarget = light ? 92 : 10;
  const borderTarget = light ? 85 : 25;
  const textTarget = light ? 10 : 92;
  const mutedTarget = light ? 50 : 65;

  const background = nearestLightness(hexes, bgTarget);
  const surface = nearestLightness(hexes, surfaceTarget);
  const border = nearestLightness(hexes, borderTarget);
  const text = nearestLightness(hexes, textTarget);
  const muted = nearestLightness(hexes, mutedTarget);

  return { primary, secondary, accent, success, warning, error, info, background, surface, border, text, muted };
}

function findAccent(hexes: string[]): string {
  // Find the most saturated color
  let best = hexes[0] ?? "#FF66C4";
  let bestSat = -1;
  for (const h of hexes) {
    const hsl = hexToHsl(h);
    if (hsl.s > bestSat) { bestSat = hsl.s; best = h; }
  }
  return best;
}

function nearestLightness(hexes: string[], targetL: number): string {
  let best = hexes[0] ?? "#000000";
  let bestDiff = Infinity;
  for (const h of hexes) {
    const hsl = hexToHsl(h);
    const diff = Math.abs(hsl.l - targetL);
    if (diff < bestDiff) { bestDiff = diff; best = h; }
  }
  // If too far from target, generate
  if (bestDiff > 20) {
    const base = hexToHsl(hexes[0] ?? "#000000");
    return hslToHex(base.h, Math.max(4, base.s - 20), targetL);
  }
  return best;
}

// ── Naming ──

export function applyNaming(token: string, preset: NamingPreset, prefix: string): string {
  const nameMap: Record<NamingPreset, Record<string, string>> = {
    tailwind: {
      primary: `${prefix}-500`, secondary: `${prefix}-400`, accent: `accent-500`,
      success: `green-500`, warning: `amber-500`, error: `red-500`, info: `sky-500`,
      background: `white`, surface: `gray-50`, border: `gray-200`, text: `gray-900`, muted: `gray-500`,
    },
    material: {
      primary: `${prefix}-primary`, secondary: `${prefix}-secondary`, accent: `${prefix}-accent`,
      success: `${prefix}-success`, warning: `${prefix}-warning`, error: `${prefix}-error`, info: `${prefix}-info`,
      background: `${prefix}-background`, surface: `${prefix}-surface`, border: `${prefix}-border`,
      text: `${prefix}-on-background`, muted: `${prefix}-text-medium`,
    },
    bootstrap: {
      primary: `--bs-${prefix}-primary`, secondary: `--bs-${prefix}-secondary`, accent: `--bs-${prefix}-accent`,
      success: `--bs-success`, warning: `--bs-warning`, error: `--bs-danger`, info: `--bs-info`,
      background: `--bs-body-bg`, surface: `--bs-card-bg`, border: `--bs-border-color`,
      text: `--bs-body-color`, muted: `--bs-secondary-color`,
    },
    fluent: {
      primary: `--${prefix}-primary`, secondary: `--${prefix}-secondary`, accent: `--${prefix}-accent`,
      success: `--${prefix}-success`, warning: `--${prefix}-warning`, error: `--${prefix}-error`, info: `--${prefix}-info`,
      background: `--${prefix}-background`, surface: `--${prefix}-surface`, border: `--${prefix}-border`,
      text: `--${prefix}-text`, muted: `--${prefix}-text-secondary`,
    },
    apple: {
      primary: `${prefix}Primary`, secondary: `${prefix}Secondary`, accent: `accentColor`,
      success: `${prefix}Green`, warning: `${prefix}Orange`, error: `${prefix}Red`, info: `${prefix}Blue`,
      background: `${prefix}Background`, surface: `${prefix}Surface`, border: `${prefix}Border`,
      text: `${prefix}Text`, muted: `${prefix}SecondaryText`,
    },
    openpalette: {
      primary: `--op-${prefix}-primary`, secondary: `--op-${prefix}-secondary`, accent: `--op-accent`,
      success: `--op-success`, warning: `--op-warning`, error: `--op-error`, info: `--op-info`,
      background: `--op-bg`, surface: `--op-surface`, border: `--op-border`,
      text: `--op-text`, muted: `--op-muted`,
    },
    custom: {
      primary: `--${prefix}-primary`, secondary: `--${prefix}-secondary`, accent: `--${prefix}-accent`,
      success: `--${prefix}-success`, warning: `--${prefix}-warning`, error: `--${prefix}-error`, info: `--${prefix}-info`,
      background: `--${prefix}-bg`, surface: `--${prefix}-surface`, border: `--${prefix}-border`,
      text: `--${prefix}-text`, muted: `--${prefix}-muted`,
    },
  };
  return nameMap[preset]?.[token] ?? `--${prefix}-${token}`;
}

// ── Export Presets ──

export interface ExportPreset {
  id: string;
  label: string;
  formats: string[];
  tokenGroups: string[];
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: "web", label: "Web", formats: ["css", "scss", "tailwind-v4"], tokenGroups: ["brand", "semantic", "surface", "text"] },
  { id: "mobile", label: "Mobile", formats: ["flutter", "react-native", "ios"], tokenGroups: ["brand", "semantic", "surface", "text"] },
  { id: "design-system", label: "Design System", formats: ["w3c", "style-dictionary", "figma"], tokenGroups: ["brand", "semantic", "surface", "text"] },
  { id: "figma", label: "Figma", formats: ["figma", "w3c", "json"], tokenGroups: ["brand", "semantic", "surface", "text"] },
  { id: "developer", label: "Developer Bundle", formats: ["css", "scss", "tailwind-v4", "json", "w3c"], tokenGroups: ["brand", "semantic", "surface", "text"] },
];

// ── Documentation snippets ──

export function getDocSnippet(tokens: SemanticTokens, name: string): string {
  return `/* ${name} Design Tokens
 * Generated by OpenPalette
 *
 * Usage:
 *   :root { ${Object.entries(tokens).map(([k, v]) => `\\n  ${k}: ${v};`).join("")} }
 *
 *   .btn-primary {
 *     background: var(--primary);
 *     color: white;
 *     padding: 0.5rem 1.25rem;
 *     border-radius: 9999px;
 *     font-weight: 600;
 *   }
 */`;
}
