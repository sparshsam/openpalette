import type { SemanticTokens, NamingPreset } from "./token-engine";
import { applyNaming } from "./token-engine";

export interface FormattedExport {
  label: string;
  ext: string;
  content: string;
}

export function formatExport(
  formatId: string,
  tokens: SemanticTokens,
  preset: NamingPreset,
  prefix: string,
  name: string,
): FormattedExport {
  const named = (token: keyof SemanticTokens) => applyNaming(token, preset, prefix);
  const val = (token: keyof SemanticTokens) => tokens[token];

  switch (formatId) {
    case "css": {
      const lines = [":root {", ...Object.keys(tokens).map((k) => `  ${named(k as keyof SemanticTokens)}: ${val(k as keyof SemanticTokens)};`), "}"];
      return { label: "CSS Variables", ext: "css", content: lines.join("\n") };
    }
    case "scss": {
      const lines = Object.keys(tokens).map((k) => `$${named(k as keyof SemanticTokens).replace(/^--/, "")}: ${val(k as keyof SemanticTokens)};`);
      return { label: "SCSS", ext: "scss", content: lines.join("\n") };
    }
    case "tailwind-v4": {
      const lines = Object.keys(tokens).map((k) => `  --color-${named(k as keyof SemanticTokens).replace(/^--/, "")}: ${val(k as keyof SemanticTokens)};`);
      return { label: "Tailwind v4", ext: "css", content: `@theme {\n${lines.join("\n")}\n}` };
    }
    case "json": {
      return { label: "Raw JSON", ext: "json", content: JSON.stringify({ [name]: tokens }, null, 2) };
    }
    case "w3c": {
      const w3c: Record<string, { $value: string; $type: string }> = {};
      Object.entries(tokens).forEach(([k, v]) => { w3c[`${prefix}-${k}`] = { $value: v, $type: "color" }; });
      return { label: "W3C Design Tokens", ext: "json", content: JSON.stringify({ [name]: w3c }, null, 2) };
    }
    case "style-dictionary": {
      const sd: Record<string, { value: string; type: string }> = {};
      Object.entries(tokens).forEach(([k, v]) => { sd[`${prefix}_${k}`] = { value: v, type: "color" }; });
      return { label: "Style Dictionary", ext: "json", content: JSON.stringify({ [name]: sd }, null, 2) };
    }
    case "figma": {
      const figma: Record<string, { type: string; value: string }> = {};
      Object.entries(tokens).forEach(([k, v]) => { figma[`${prefix}/${k}`] = { type: "COLOR", value: v }; });
      return { label: "Figma Variables", ext: "json", content: JSON.stringify({ variables: figma }, null, 2) };
    }
    case "flutter": {
      const lines = Object.entries(tokens).map(([k, v]) => {
        const h = v.replace("#", "");
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
        return `  static const Color app${k.charAt(0).toUpperCase() + k.slice(1)} = Color.fromRGBO(${r}, ${g}, ${b}, 1);`;
      });
      return { label: "Flutter", ext: "dart", content: `import 'dart:ui';\n\nclass AppColors {\n${lines.join("\n")}\n}` };
    }
    case "react-native": {
      const obj = Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, v]));
      return { label: "React Native", ext: "ts", content: `export const ${prefix}Tokens = ${JSON.stringify(obj, null, 2)} as const;\n\nexport type ${prefix}TokenKey = keyof typeof ${prefix}Tokens;` };
    }
    case "android": {
      const lines = Object.entries(tokens).map(([k, v]) => `  <color name="${prefix}_${k}">${v}</color>`);
      return { label: "Android XML", ext: "xml", content: `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${lines.join("\n")}\n</resources>` };
    }
    case "ios": {
      const lines = Object.entries(tokens).map(([k, v]) => `  static let ${prefix}${k.charAt(0).toUpperCase() + k.slice(1)} = Color(hex: "${v}")`);
      return { label: "iOS Swift", ext: "swift", content: `import SwiftUI\n\nextension Color {\n${lines.join("\n")}\n}` };
    }
    default:
      return { label: formatId, ext: "txt", content: JSON.stringify(tokens, null, 2) };
  }
}

export const ADVANCED_EXPORT_FORMATS = [
  { id: "css", label: "CSS Variables", category: "Web" },
  { id: "scss", label: "SCSS", category: "Web" },
  { id: "tailwind-v4", label: "Tailwind v4", category: "Web" },
  { id: "json", label: "Raw JSON", category: "Data" },
  { id: "w3c", label: "W3C Design Tokens", category: "Design System" },
  { id: "style-dictionary", label: "Style Dictionary", category: "Design System" },
  { id: "figma", label: "Figma Variables", category: "Design System" },
  { id: "flutter", label: "Flutter", category: "Mobile" },
  { id: "react-native", label: "React Native", category: "Mobile" },
  { id: "android", label: "Android XML", category: "Mobile" },
  { id: "ios", label: "iOS Swift", category: "Mobile" },
];

export const ADVANCED_EXPORT_CATEGORIES = ["Web", "Design System", "Mobile", "Data"] as const;

export function parseImportJson(json: string): { tokens: SemanticTokens | null; name: string } {
  try {
    const parsed = JSON.parse(json);
    // Try various known formats
    const data = parsed?.colors || parsed || {};
    const tokens: Record<string, string> = {};
    const keyMap = ["primary","secondary","accent","success","warning","error","info","background","surface","border","text","muted"];
    for (const k of keyMap) {
      // Try direct, nested under $value, or nested under value
      tokens[k] = data[k]?.$value ?? data[k]?.value ?? data[k] ?? "";
    }
    const name = parsed?.metadata?.name ?? parsed?.name ?? "Imported";
    const hasTokens = keyMap.some((k) => /^#[0-9A-Fa-f]{6}/.test(tokens[k]));
    return { tokens: hasTokens ? (tokens as unknown as SemanticTokens) : null, name };
  } catch {
    return { tokens: null, name: "Invalid JSON" };
  }
}
