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

export function TokensSection() {
  const [baseHex, setBaseHex] = useState(() => {
    if (typeof window === "undefined") return "#2D518F";
    const m = window.location.hash.match(/^#\/tokens\/([0-9A-Fa-f]{6})$/);
    return m ? "#" + m[1].toUpperCase() : "#2D518F";
  });
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showExport, setShowExport] = useState(false);

  const nh = normalizeHex(baseHex) ?? "#2D518F";
  const scale = useMemo(() => generateScale(nh), [nh]);
  const info = getColorInfo(nh);

  // Spacebar generates new base color
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        const h = Math.floor(Math.random() * 360);
        const s = 40 + Math.floor(Math.random() * 50);
        const l = 35 + Math.floor(Math.random() * 25);
        setBaseHex(hslToHex(h, s, l));
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Used within the render function
  const copy = async (v: string, label?: string) => {
    try { await navigator.clipboard.writeText(v); showToast(label ? `Copied ${label}` : `Copied ${v}`); } catch {}
  };

  const t = theme === "light" ? {
    bg: "#FFFFFF", surface: "#F5F5F5", text: "#111111", muted: "#666666",
    border: "#E0E0E0", tokenBg: scale[0]?.hex ?? "#f0f0f0", tokenText: "#111111",
  } : {
    bg: "#0F0F0F", surface: "#1A1A1A", text: "#F5F5F5", muted: "#888888",
    border: "#2A2A2A", tokenBg: scale[9]?.hex ?? "#333", tokenText: "#FFFFFF",
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-page">Design Tokens</h1>
        <p className="text-sm sm:text-base text-secondary">Generate complete design token scales from a single color.</p>
      </div>

      {/* Base color input */}
      <div className="flex items-center gap-3">
        <input type="color" value={nh} onChange={(e) => setBaseHex(e.target.value.toUpperCase())}
          className="size-10 rounded-lg cursor-pointer border border-default bg-transparent shrink-0" />
        <input type="text" value={baseHex} onChange={(e) => setBaseHex(e.target.value)}
          className="rounded-lg border border-default bg-transparent px-3 py-2 text-sm font-mono text-page outline-none focus:border-[var(--accent)] transition-colors uppercase w-28"
          placeholder="#000000" spellCheck={false} />
        <span className="text-sm font-semibold text-page">{info.name}</span>
        <span className="text-xs text-muted">{scale.length} shades</span>
      </div>

      {/* Token scale */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Token Scale</p>
        <div className="flex rounded-xl overflow-hidden h-10 border border-default">
          {scale.map((s) => (
            <button key={s.shade} className="flex-1 relative group hover:flex-[1.3] transition-all duration-200"
              style={{ backgroundColor: s.hex }} onClick={() => copy(s.hex, `${s.hex}`)}>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity text-muted">{s.shade}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shade grid */}
      <div className="grid grid-cols-11 gap-1.5">
        {scale.map((s) => (
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

      {/* UI Previews */}
      <div className="space-y-4" style={{ color: t.text }}>
        {/* Hero */}
        <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
          <div className="rounded-xl p-5" style={{ background: `linear-gradient(135deg, ${scale[5]?.hex ?? "#333"}, ${scale[7]?.hex ?? "#111"})`, color: "#fff" }}>
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold">Brand</span>
              <span className="text-sm opacity-70">About · Products · Contact</span>
            </div>
            <h2 className="text-3xl font-black max-w-md">Design tokens that scale with your team.</h2>
            <p className="mt-2 text-sm opacity-80 max-w-sm">Generate complete color systems from a single hue.</p>
            <button className="mt-4 rounded-full px-5 py-2 text-sm font-semibold" style={{ background: scale[3]?.hex ?? "#888", color: "#fff" }}>Get started →</button>
          </div>
        </PreviewCard>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Dashboard card */}
          <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: t.muted }}>
                <span className="size-2 rounded-full" style={{ background: scale[4]?.hex }} /> Revenue
              </div>
              <p className="text-2xl font-black">$48,250</p>
              <div className="flex gap-1.5">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: scale[1]?.hex, color: scale[8]?.hex }}>+12.5%</span>
                <span className="text-xs" style={{ color: t.muted }}>vs last month</span>
              </div>
              <div className="h-10 rounded-lg flex items-end gap-1 pt-2">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <span key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: scale[i < 3 ? 2 : i < 5 ? 4 : 6]?.hex }} />
                ))}
              </div>
            </div>
          </PreviewCard>

          {/* Sidebar / Nav */}
          <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
            <div className="flex gap-0">
              <div className="w-16 p-2 space-y-2 rounded-l-xl" style={{ background: scale[8]?.hex }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 rounded-lg" style={{ background: scale[i * 2]?.hex, opacity: i === 1 ? 1 : 0.4 }} />
                ))}
              </div>
              <div className="flex-1 p-3 space-y-2">
                <p className="text-xs font-bold" style={{ color: t.text }}>Dashboard</p>
                <p className="text-[10px]" style={{ color: t.muted }}>Welcome back, select a section to continue.</p>
              </div>
            </div>
          </PreviewCard>
        </div>

        {/* Buttons */}
        <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
          <div className="p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.muted }}>Buttons & Controls</p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full px-4 py-1.5 text-sm font-semibold text-white" style={{ background: scale[5]?.hex }}>Primary</button>
              <button className="rounded-full px-4 py-1.5 text-sm font-semibold" style={{ background: scale[2]?.hex, color: scale[8]?.hex }}>Secondary</button>
              <button className="rounded-full px-4 py-1.5 text-sm font-semibold border" style={{ borderColor: scale[3]?.hex, color: scale[6]?.hex }}>Outlined</button>
              <button className="rounded-full px-4 py-1.5 text-sm font-semibold opacity-50" style={{ background: scale[1]?.hex, color: scale[5]?.hex }} disabled>Disabled</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: scale[4]?.hex, color: "#fff" }}>Active</span>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: scale[0]?.hex, color: scale[8]?.hex }}>Default</span>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-green-500/10 text-green-600">Success</span>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-red-500/10 text-red-600">Error</span>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600">Warning</span>
            </div>
          </div>
        </PreviewCard>

        {/* Form */}
        <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
          <div className="p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.muted }}>Form Elements</p>
            <input placeholder="Email" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: scale[2]?.hex, background: t.bg, color: t.text }} />
            <input placeholder="Password" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: scale[2]?.hex, background: t.bg, color: t.text }} />
            <div className="flex items-center gap-2 text-sm">
              <input type="checkbox" style={{ accentColor: scale[5]?.hex }} />
              <span>Remember me</span>
            </div>
            <button className="w-full rounded-full py-2 text-sm font-semibold text-white" style={{ background: scale[5]?.hex }}>Sign In</button>
          </div>
        </PreviewCard>

        {/* Table */}
        <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
          <div className="p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.muted }}>Table</p>
            {[
              { name: "Project Alpha", status: "Active", users: "12" },
              { name: "Project Beta", status: "Pending", users: "8" },
              { name: "Project Gamma", status: "Completed", users: "24" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b text-xs" style={{ borderColor: scale[1]?.hex }}>
                <span className="font-semibold">{row.name}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: scale[0]?.hex, color: scale[7]?.hex }}>{row.status}</span>
                <span style={{ color: t.muted }}>{row.users} users</span>
              </div>
            ))}
          </div>
        </PreviewCard>

        {/* Alerts */}
        <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
          <div className="p-4 space-y-2">
            <div className="rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2" style={{ background: `${scale[5]?.hex}15`, color: scale[7]?.hex, borderLeft: `3px solid ${scale[5]?.hex}` }}>
              <span>ℹ</span> This is an info alert using your token colors.
            </div>
            <div className="rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 bg-green-500/10 text-green-600" style={{ borderLeft: "3px solid #22c55e" }}>
              <span>✓</span> Success alert — action completed.
            </div>
            <div className="rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 bg-red-500/10 text-red-600" style={{ borderLeft: "3px solid #ef4444" }}>
              <span>✕</span> Error alert — something went wrong.
            </div>
          </div>
        </PreviewCard>

        {/* Pricing card */}
        <PreviewCard style={{ background: t.surface, borderColor: t.border }}>
          <div className="p-4 text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.muted }}>Pro Plan</p>
            <p className="text-3xl font-black" style={{ color: scale[7]?.hex }}>$29<span className="text-sm font-normal" style={{ color: t.muted }}>/mo</span></p>
            <ul className="text-xs space-y-1.5" style={{ color: t.text }}>
              {["Unlimited projects", "Team collaboration", "Priority support"].map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <button className="w-full rounded-full py-2 text-sm font-semibold text-white" style={{ background: scale[5]?.hex }}>Subscribe</button>
          </div>
        </PreviewCard>
      </div>

      {/* Exports */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Developer Exports</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {EXPORT_FORMATS.map((fmt) => (
            <button key={fmt.id} onClick={() => copy(formatExport(fmt.id, scale, nh), fmt.label)}
              className="rounded-xl border border-default p-3 text-left hover:bg-surface transition text-xs">
              <p className="font-semibold text-page">{fmt.label}</p>
              <p className="text-muted mt-0.5">.{fmt.ext}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[var(--bg-base)]/95 backdrop-blur-md border-t border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden h-8 flex-1 max-w-xs border border-default">
            {scale.map((s) => (
              <button key={s.shade} className="flex-1 hover:opacity-80 transition-opacity cursor-pointer" style={{ backgroundColor: s.hex }}
                onClick={() => copy(s.hex, `${s.shade}`)} title={s.hex} />
            ))}
          </div>
          <span className="text-xs text-muted font-semibold tabular-nums shrink-0">{scale.length}</span>
          <button onClick={() => { const h = Math.floor(Math.random() * 360); const s = 40 + Math.floor(Math.random() * 50); const l = 35 + Math.floor(Math.random() * 25); setBaseHex(hslToHex(h, s, l)); }}
            className="rounded-full bg-[var(--accent)] text-white px-3.5 py-1.5 text-xs font-semibold hover:brightness-110 transition whitespace-nowrap shrink-0">
            Generate
          </button>
          <button onClick={() => {
            const all = scale.map((s) => s.hex).join(", ");
            copy(all, "Full token scale");
          }} className="rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover-accent bounce-press transition whitespace-nowrap shrink-0">
            Copy
          </button>
          <button onClick={() => setShowExport(!showExport)} className="rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover-accent bounce-press transition whitespace-nowrap shrink-0">
            Export
          </button>
        </div>
      </div>

      {/* Export panel */}
      {showExport && (
        <div className="rounded-2xl border border-default p-4 sm:p-5 space-y-3 bg-surface">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Export Code</p>
            <button onClick={() => setShowExport(false)} className="text-xs text-muted hover:text-page">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EXPORT_FORMATS.map((fmt) => (
              <button key={fmt.id} onClick={() => copy(formatExport(fmt.id, scale, nh), fmt.label)}
                className="rounded-xl border border-default p-3 text-left hover:bg-surface-muted transition text-xs">
                <p className="font-semibold text-page">{fmt.label}</p>
                <p className="text-muted mt-0.5">.{fmt.ext}</p>
              </button>
            ))}
          </div>
        </div>
      )}
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
