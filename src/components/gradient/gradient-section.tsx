"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReadableTextColor, hslToHex } from "@/lib/palette";
import { showToast } from "@/components/toast";

type GradientKind = "linear" | "radial" | "conic";

interface Stop {
  id: string;
  hex: string;
  position: number;
  alpha: number;
}

const PRESETS: { name: string; colors: string[]; kind: GradientKind; angle: number }[] = [
  { name: "Sunset", colors: ["#FF512F", "#DD2475", "#FF5858"], kind: "linear", angle: 135 },
  { name: "Ocean", colors: ["#2193B0", "#6DD5ED", "#0072ff"], kind: "linear", angle: 90 },
  { name: "Aurora", colors: ["#00C9FF", "#92FE9D", "#00FF87"], kind: "linear", angle: 45 },
  { name: "Forest", colors: ["#134E5E", "#71B280", "#F5FF88"], kind: "linear", angle: 135 },
  { name: "Neon", colors: ["#FF00FF", "#00FFFF", "#FFFF00"], kind: "linear", angle: 45 },
  { name: "Cyberpunk", colors: ["#F72585", "#B5179E", "#7209B7", "#3A0CA3"], kind: "linear", angle: 135 },
  { name: "Pastel", colors: ["#FAD0C4", "#FFD1FF", "#A8E6CF", "#FFD3B6"], kind: "linear", angle: 90 },
  { name: "Vintage", colors: ["#CB997E", "#DDBEA9", "#FFE8D6", "#B7B7A4"], kind: "linear", angle: 180 },
  { name: "Corporate", colors: ["#1E3A5F", "#2D5F8A", "#4A90D9", "#7BB3E0"], kind: "linear", angle: 90 },
  { name: "Monochrome", colors: ["#111111", "#444444", "#888888", "#CCCCCC"], kind: "linear", angle: 135 },
  { name: "Glass", colors: ["#FFFFFF", "#E8E8E8", "#F5F5F5", "#FFFFFF"], kind: "linear", angle: 45 },
  { name: "Synthwave", colors: ["#0F0F23", "#2D1B69", "#FF6EC7", "#00D4FF"], kind: "linear", angle: 180 },
  { name: "Radial Sun", colors: ["#FFD700", "#FF8C00", "#FF4500", "#8B0000"], kind: "radial", angle: 0 },
  { name: "Conic Rainbow", colors: ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF", "#FF0000"], kind: "conic", angle: 0 },
];

function gradientCss(colors: string[], kind: GradientKind, angle: number): string {
  const cols = colors.join(", ");
  if (kind === "linear") return `linear-gradient(${angle}deg, ${cols})`;
  if (kind === "radial") return `radial-gradient(circle at center, ${cols})`;
  return `conic-gradient(from ${angle}deg, ${cols})`;
}

function randomPreset() {
  return PRESETS[Math.floor(Math.random() * PRESETS.length)];
}

export function GradientSection() {
  const [stops, setStops] = useState<Stop[]>(() => {
    const p = randomPreset();
    return p.colors.map((hex, i) => ({
      id: crypto.randomUUID(), hex,
      position: Math.round((i / (p.colors.length - 1)) * 100),
      alpha: 100,
    }));
  });
  const [kind, setKind] = useState<GradientKind>("linear");
  const [angle, setAngle] = useState(90);
  const [showPresets, setShowPresets] = useState(false);

  const sorted = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops]);
  const colors = useMemo(() => sorted.map((s) => s.hex), [sorted]);
  const css = useMemo(() => gradientCss(colors, kind, angle), [colors, kind, angle]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); randomize(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  function randomize() {
    const p = randomPreset();
    setKind(p.kind);
    setAngle(p.angle);
    setStops(p.colors.map((hex, i) => ({
      id: crypto.randomUUID(), hex,
      position: Math.round((i / Math.max(p.colors.length - 1, 1)) * 100),
      alpha: 100,
    })));
  }

  function addStop() {
    if (stops.length >= 8) return;
    const pos = Math.min(100, Math.max(...stops.map((s) => s.position)) + 8);
    setStops([...stops, { id: crypto.randomUUID(), hex: hslToHex(Math.floor(Math.random() * 360), 70, 50), position: pos, alpha: 100 }]);
  }

  function removeStop(id: string) {
    if (stops.length <= 2) return;
    setStops(stops.filter((s) => s.id !== id));
  }

  function updateStop(id: string, upd: Partial<Stop>) {
    setStops(stops.map((s) => s.id === id ? { ...s, ...upd } : s));
  }

  const copy = useCallback(async (v: string, label?: string) => {
    try { await navigator.clipboard.writeText(v); showToast(label ?? "Copied"); } catch {}
  }, []);

  function exportPNG() {
    const can = document.createElement("canvas");
    can.width = 1200; can.height = 420;
    const ctx = can.getContext("2d");
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, can.width, 0);
    sorted.forEach((s) => grad.addColorStop(s.position / 100, s.hex));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, can.width, can.height);
    can.toBlob((b) => { if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "gradient.png"; a.click(); URL.revokeObjectURL(u); });
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-page">Gradient Studio</h1>
        <p className="text-sm sm:text-base text-secondary">Build beautiful gradients with professional controls.</p>
      </div>

      {/* Kind + actions */}
      <div className="flex flex-wrap items-center gap-3">
        {(["linear", "radial", "conic"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)}
            className={`bounce-press rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              kind === k ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"
            }`}>{k}</button>
        ))}
        <div className="h-5 w-px bg-[var(--border-default)]" />
        <button onClick={() => setAngle((a) => (a + 180) % 360)} className="bounce-press rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition">↻ Reverse</button>
        <button onClick={randomize} className="bounce-press rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition">🎲 Random</button>
        <button onClick={() => setShowPresets(!showPresets)}
          className={`bounce-press rounded-full border px-3 py-1.5 text-xs font-semibold transition ${showPresets ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-default text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"}`}>
          Presets {showPresets ? "▲" : "▼"}
        </button>
      </div>

      {/* Angle */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-muted w-8">Angle</span>
        <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-40" />
        <span className="text-xs font-mono text-page tabular-nums w-8">{angle}°</span>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="rounded-2xl border border-default p-4 bg-surface">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => { setKind(p.kind); setAngle(p.angle); setStops(p.colors.map((hex, i) => ({ id: crypto.randomUUID(), hex, position: Math.round((i / Math.max(p.colors.length - 1, 1)) * 100), alpha: 100 }))); setShowPresets(false); }}
                className="rounded-xl overflow-hidden border border-default hover:shadow-md transition-shadow text-left">
                <div className="h-10" style={{ background: gradientCss(p.colors, p.kind, p.angle) }} />
                <div className="p-2"><p className="text-xs font-semibold text-page">{p.name}</p><p className="text-[10px] text-muted capitalize">{p.kind}</p></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live canvas */}
      <div className="rounded-2xl border border-default overflow-hidden h-64 sm:h-80 lg:h-96" style={{ background: css }} />

      {/* Color stops */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Color Stops ({stops.length})</p>
          <button onClick={addStop} disabled={stops.length >= 8} className="rounded-full border border-default px-3 py-1 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition disabled:opacity-30">+ Add Stop</button>
        </div>
        <div className="flex rounded-xl overflow-hidden h-10 border border-default">
          {sorted.map((s) => (
            <div key={s.id} className="flex-1 relative group cursor-pointer" style={{ backgroundColor: s.hex }} onClick={() => copy(s.hex, s.hex)}>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: getReadableTextColor(s.hex) }}>{s.hex}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((s) => (
            <div key={s.id} className="rounded-xl border border-default p-3 space-y-2 bg-surface">
              <div className="flex items-center gap-2">
                <input type="color" value={s.hex} onChange={(e) => updateStop(s.id, { hex: e.target.value.toUpperCase() })} className="size-7 rounded cursor-pointer border border-default bg-transparent shrink-0" />
                <input type="text" value={s.hex} onChange={(e) => updateStop(s.id, { hex: e.target.value })} className="flex-1 rounded border border-default bg-transparent px-2 py-1 text-xs font-mono text-page outline-none focus:border-[var(--accent)] transition-colors uppercase min-w-0" />
                <button onClick={() => copy(s.hex, s.hex)} className="text-xs text-muted hover:text-[var(--accent)] transition shrink-0">📋</button>
                <button onClick={() => removeStop(s.id)} disabled={stops.length <= 2} className="text-xs text-muted hover:text-red-500 transition disabled:opacity-30 shrink-0">✕</button>
              </div>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <span className="w-12">Pos {s.position}%</span>
                <input type="range" min={0} max={100} value={s.position} onChange={(e) => updateStop(s.id, { position: Number(e.target.value) })} className="flex-1" />
              </div>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <span className="w-12">α {s.alpha}%</span>
                <input type="range" min={0} max={100} value={s.alpha} onChange={(e) => updateStop(s.id, { alpha: Number(e.target.value) })} className="flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live previews */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Live Previews</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[{ label: "Hero", h: "h-32" }, { label: "Button", h: "h-12 rounded-full" }, { label: "Card", h: "h-28 rounded-2xl" }, { label: "Dashboard", h: "h-24 rounded-xl" }].map((t) => (
            <div key={t.label} className="space-y-1">
              <div className={t.h} style={{ background: css }} />
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Export</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => copy(css, "CSS")} className="bounce-press rounded-full bg-[var(--bg-surface)] border border-default px-4 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition cursor-pointer">CSS</button>
          <button onClick={() => copy(`bg-gradient-to-r from-[${colors[0]}] to-[${colors[colors.length - 1]}]`, "Tailwind")} className="bounce-press rounded-full bg-[var(--bg-surface)] border border-default px-4 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition cursor-pointer">Tailwind</button>
          <button onClick={() => copy(JSON.stringify({ gradient: css, colors, kind, angle }, null, 2), "JSON")} className="bounce-press rounded-full bg-[var(--bg-surface)] border border-default px-4 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition cursor-pointer">JSON</button>
          <button onClick={exportPNG} className="bounce-press rounded-full bg-[var(--bg-surface)] border border-default px-4 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition cursor-pointer">PNG</button>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[var(--bg-base)]/95 backdrop-blur-md border-t border-[var(--border-default)]">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex rounded-lg overflow-hidden h-8 flex-1 max-w-xs border border-default" style={{ background: css }}>
            {sorted.map((s) => <div key={s.id} className="flex-1" style={{ backgroundColor: s.hex }} />)}
          </div>
          <span className="text-xs text-muted font-semibold tabular-nums shrink-0">{stops.length}</span>
          <button onClick={randomize} className="bounce-press rounded-full bg-[var(--accent)] text-white px-3.5 py-1.5 text-xs font-semibold hover:brightness-110 transition whitespace-nowrap shrink-0">Generate</button>
          <button onClick={() => copy(css, "CSS")} className="bounce-press rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition whitespace-nowrap shrink-0">Copy CSS</button>
        </div>
      </div>
    </section>
  );
}
