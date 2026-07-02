"use client";

import { useEffect, useMemo, useState } from "react";
import { hexToHsl, hslToHex, normalizeHex } from "@/lib/palette";
import { getColorInfo } from "@/lib/palette/color-info";
import { showToast } from "@/components/toast";

const SHADE_LABELS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** Generate a perceptually smooth token scale from a base hex */
function generateScale(baseHex: string): { shade: number; hex: string }[] {
  const hsl = hexToHsl(baseHex);
  const h = hsl.h;
  const s = hsl.s;

  // Target lightness for each shade
  const targets: Record<number, number> = {
    50: 95, 100: 88, 200: 78, 300: 66, 400: 54,
    500: 44, 600: 34, 700: 26, 800: 18, 900: 12, 950: 6,
  };

  return SHADE_LABELS.map((shade) => {
    const l = targets[shade];
    // Saturation: full at 500, reducing toward extremes
    const satWeight = shade === 500 ? 1 : shade < 500 ? shade / 500 : (1000 - shade) / 500;
    const sat = Math.max(4, Math.round(s * satWeight));
    return { shade, hex: hslToHex(h, sat, l) };
  });
}

const EXPORT_FORMATS = [
  { id: "css", label: "CSS Variables", ext: "css" },
  { id: "tailwind", label: "Tailwind Config", ext: "js" },
  { id: "json", label: "JSON Design Tokens", ext: "json" },
  { id: "scss", label: "SCSS Variables", ext: "scss" },
  { id: "android", label: "Android XML", ext: "xml" },
  { id: "ios", label: "iOS Swift", ext: "swift" },
] as const;

function formatExport(id: string, scale: { shade: number; hex: string }[], baseHex: string): string {
  const name = baseHex.replace("#", "").toLowerCase();
  switch (id) {
    case "css":
      return `:root {\n${scale.map((s) => `  --op-${name}-${s.shade}: ${s.hex};`).join("\n")}\n}`;
    case "tailwind":
      return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        ${name}: {\n${scale.map((s) => `          ${s.shade}: '${s.hex}',`).join("\n")}\n        },\n      },\n    },\n  },\n};`;
    case "json":
      return JSON.stringify({ [`${name}`]: Object.fromEntries(scale.map((s) => [s.shade, s.hex])) }, null, 2);
    case "scss":
      return scale.map((s) => `$${name}-${s.shade}: ${s.hex};`).join("\n");
    case "android":
      return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${scale.map((s) => `  <color name="${name}_${s.shade}">${s.hex}</color>`).join("\n")}\n</resources>`;
    case "ios":
      return `import SwiftUI\n\nextension Color {\n${scale.map((s) => `  static let ${name}${s.shade} = Color(hex: "${s.hex}")`).join("\n")}\n}`;
    default:
      return "";
  }
}

function generateRandomHex(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 40 + Math.floor(Math.random() * 50);
  const l = 35 + Math.floor(Math.random() * 25);
  return hslToHex(h, s, l);
}

export function TokensSection() {
  const [baseColors, setBaseColors] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["#2D518F"];
    const m = window.location.hash.match(/^#\/tokens\/([0-9A-Fa-f]{6})$/);
    return m ? ["#" + m[1].toUpperCase()] : ["#2D518F"];
  });
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const scales = useMemo(() =>
    baseColors.map((c) => {
      const nh = normalizeHex(c) ?? "#2D518F";
      return { base: c, nh, scale: generateScale(nh), info: getColorInfo(nh) };
    }),
    [baseColors],
  );

  const activeScale = scales[0]?.scale ?? [];
  const activeNh = scales[0]?.nh ?? "#2D518F";

  // Spacebar generates new base color for the first token
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        setBaseColors((prev) => [generateRandomHex(), ...prev.slice(1)]);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const copy = async (v: string, label?: string) => {
    try { await navigator.clipboard.writeText(v); showToast(label ? `Copied ${label}` : `Copied ${v}`); } catch {}
  };

  const addColor = () => {
    setBaseColors((prev) => [...prev, generateRandomHex()]);
  };

  const removeColor = (idx: number) => {
    if (baseColors.length <= 1) return;
    setBaseColors((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateColor = (idx: number, hex: string) => {
    setBaseColors((prev) => prev.map((c, i) => i === idx ? hex : c));
  };

  const t = theme === "light" ? {
    bg: "#FFFFFF", surface: "#F5F5F5", text: "#111111", muted: "#666666",
    border: "#E0E0E0", tokenBg: activeScale[0]?.hex ?? "#f0f0f0", tokenText: "#111111",
  } : {
    bg: "#0F0F0F", surface: "#1A1A1A", text: "#F5F5F5", muted: "#888888",
    border: "#2A2A2A", tokenBg: activeScale[9]?.hex ?? "#333", tokenText: "#FFFFFF",
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-page">Design Tokens</h1>
        <p className="text-sm sm:text-base text-secondary">Generate complete design token scales from one or more colors.</p>
      </div>

      {/* Base color inputs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Test Colors</span>
          <button onClick={addColor}
            className="rounded-full border border-default px-2.5 py-1 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover:border-[var(--accent)] transition bounce-press">
            + Add Color
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {baseColors.map((base, idx) => {
            const nh = normalizeHex(base) ?? "#2D518F";
            return (
              <div key={idx} className="flex items-center gap-2 rounded-xl border border-default px-3 py-2 bg-[var(--bg-surface)]">
                <input type="color" value={nh} onChange={(e) => updateColor(idx, e.target.value.toUpperCase())}
                  className="size-8 rounded-lg cursor-pointer border border-default bg-transparent shrink-0" />
                <input type="text" value={base} onChange={(e) => updateColor(idx, e.target.value)}
                  className="rounded-lg border border-default bg-transparent px-2 py-1 text-xs font-mono text-page outline-none focus:border-[var(--accent)] transition-colors uppercase w-24"
                  placeholder="#000000" spellCheck={false} />
                <span className="text-xs font-semibold text-page hidden sm:inline">{scales[idx]?.info.name ?? ""}</span>
                {baseColors.length > 1 && (
                  <button onClick={() => removeColor(idx)}
                    className="size-6 flex items-center justify-center rounded-full text-xs text-muted hover:text-red-500 hover:bg-red-500/10 transition"
                    title="Remove color">✕</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Token scale for active (first) color */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Token Scale — {scales[0]?.info.name ?? ""}</p>
        <div className="flex rounded-xl overflow-hidden h-10 border border-default">
          {activeScale.map((s) => (
            <button key={s.shade} className="flex-1 relative group hover:flex-[1.3] transition-all duration-200"
              style={{ backgroundColor: s.hex }} onClick={() => copy(s.hex, `${s.hex}`)}>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity text-muted">{s.shade}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shade grid for active color */}
      <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-11 gap-1.5">
        {activeScale.map((s) => (
          <button key={s.shade} onClick={() => copy(s.hex, `${s.shade}`)}
            className="rounded-lg aspect-square flex flex-col items-center justify-center text-[9px] font-mono font-bold hover:scale-105 transition-transform"
            style={{ backgroundColor: s.hex, color: s.shade >= 600 ? "#FFFFFF" : "#111111" }}>
            <span>{s.shade}</span>
          </button>
        ))}
      </div>

      {/* Theme toggle */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Preview Mode</span>
        <button onClick={() => setTheme("light")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${theme === "light" ? "bg-[var(--accent)] text-white" : "border border-default text-secondary"}`}>Light</button>
        <button onClick={() => setTheme("dark")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${theme === "dark" ? "bg-[var(--accent)] text-white" : "border border-default text-secondary"}`}>Dark</button>
      </div>

      {/* UI Previews for each test color */}
      {scales.map(({ nh, scale: s }, idx) => (
        <div key={idx} className="space-y-4" style={{ color: t.text }}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Preview — {nh}</p>
          {/* Hero */}
          <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
            <div className="rounded-xl p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${s[5]?.hex ?? "#333"}, ${s[7]?.hex ?? "#111"})`, color: "#fff" }}>
              <div className="flex items-center justify-between mb-10">
                <span className="text-lg font-bold tracking-tight">Brand</span>
                <div className="flex gap-4 text-xs opacity-70">
                  <span>About</span><span>Products</span><span>Contact</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight max-w-xl leading-tight">Design tokens that scale with your team.</h2>
              <p className="mt-3 text-sm sm:text-base opacity-80 max-w-md leading-relaxed">Generate complete color systems from a single hue. Consistent, accessible, and production-ready.</p>
              <button className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold hover:brightness-110 transition bounce-press" style={{ background: s[3]?.hex ?? "#888", color: "#fff" }}>Get started →</button>
            </div>
          </PreviewCard>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Dashboard card */}
            <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: t.muted }}>
                    <span className="size-2.5 rounded-full" style={{ background: s[4]?.hex }} /> Revenue
                  </div>
                  <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: `${s[4]?.hex}20`, color: s[6]?.hex }}>Monthly</span>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: t.text }}>$48,250</p>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold mb-1" style={{ background: "#22c55e20", color: "#22c55e" }}>↑ +12.5%</span>
                </div>
                <div className="h-14 sm:h-16 rounded-xl flex items-end gap-1 pt-3" style={{ background: s[0]?.hex ?? t.bg }}>
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <span key={i} className="flex-1 rounded-t-md transition-all hover:opacity-80"
                      style={{ height: `${h}%`, background: s[i < 3 ? 2 : i < 5 ? 4 : 6]?.hex, minHeight: "8px" }} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px]" style={{ color: t.muted }}>
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </PreviewCard>

            {/* Sidebar / Nav */}
            <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
              <div className="flex gap-0">
                <div className="w-16 p-2 space-y-2 rounded-l-xl" style={{ background: s[8]?.hex }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 rounded-lg" style={{ background: s[i * 2]?.hex, opacity: i === 1 ? 1 : 0.4 }} />
                  ))}
                </div>
                <div className="flex-1 p-3 space-y-2">
                  <p className="text-xs font-bold" style={{ color: t.text }}>Dashboard</p>
                  <p className="text-[10px]" style={{ color: t.muted }}>Welcome back, select a section to continue.</p>
                </div>
              </div>
            </PreviewCard>
          </div>
        </div>
      ))}

      {/* Exports */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Developer Exports</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {EXPORT_FORMATS.map((fmt) => (
            <button key={fmt.id} onClick={() => copy(formatExport(fmt.id, activeScale, activeNh), fmt.label)}
              className="rounded-xl border border-default p-3 text-left hover:bg-surface transition text-xs">
              <p className="font-semibold text-page">{fmt.label}</p>
              <p className="text-muted mt-0.5">.{fmt.ext}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={style}>
      {children}
    </div>
  );
}
