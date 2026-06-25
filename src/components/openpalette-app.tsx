"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { VisualizerPreview, visualizers, type Visualizer } from "@/components/studio/visualizers";
import { createSimplePdf, drawSwatches, extensionFor } from "@/lib/browser-exports";
import {
  createExportSnippets,
  createGradientCss,
  createGradientSvg,
  createPalette,
  exportFormats,
  drawGradient,
  extractPaletteFromPixels,
  generatePalette,
  getContrastHint,
  getPairContrasts,
  getPaletteAccessibilityScore,
  getReadableTextColor,
  hexToHsl,
  hexToRgb,
  hslToHex,
  maxPaletteSize,
  minPaletteSize,
  normalizeHex,
  paletteModes,
  paletteSignature,
  parsePaletteInput,
  resizePalette,
  rgbToHex,
  sortPalettes,
  suggestAccessibleReplacement,
  type ExtractionMode,
  type ExportFormat,
  type GradientKind,
  type LibrarySort,
  type PaletteColor,
  type PaletteMode,
  type PaletteRecord,
  type VisionMode,
} from "@/lib/palette";

const libraryStorageKey = "openpalette.library.v1";
const historyStorageKey = "openpalette.history.v1";
const sorts: { label: string; value: LibrarySort }[] = [
  { label: "Recently used", value: "recent" }, { label: "Brightness", value: "brightness" },
  { label: "Contrast", value: "contrast" }, { label: "Warm/cool", value: "temperature" }, { label: "Favorites", value: "favorites" },
];

type Tab = "studio" | "gradient" | "visualizer" | "accessibility" | "themes" | "library";
const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" }, { id: "gradient", label: "Gradient" }, { id: "visualizer", label: "Visualizer" },
  { id: "accessibility", label: "Accessibility" }, { id: "themes", label: "Themes" }, { id: "library", label: "Library" },
];

/* ═══════════════════════════════════════════════════════════
   SHELL
   ═══════════════════════════════════════════════════════════ */

export function OpenPaletteApp() {
  const [activeTab, setActiveTab] = useState<Tab>("studio");
  return <div className="mx-auto max-w-7xl px-6 pt-4 pb-20">
    <nav className="flex justify-center mb-6" aria-label="Tabs">
      <div className="inline-flex gap-0.5 p-1 rounded-full bg-[var(--bg-surface-muted)] overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === t.id ? "bg-[var(--accent)] text-[#11000d] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`} type="button" onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>
    </nav>
    {activeTab === "studio" && <StudioSection />}
    {activeTab === "gradient" && <GradientSection />}
    {activeTab === "visualizer" && <VisualizerSection />}
    {activeTab === "accessibility" && <AccessibilitySection />}
    {activeTab === "themes" && <ThemesSection />}
    {activeTab === "library" && <LibrarySection />}
  </div>;
}

/* ═══════════════════════════════════════════════════════════
   SHARED HOOK
   ═══════════════════════════════════════════════════════════ */

type CurrentState = { colors: PaletteColor[]; mode: PaletteMode };

export function usePalette() {
  const [colors, setColors] = useState<PaletteColor[]>(() => createPalette());
  const [mode, setMode] = useState<PaletteMode>("Analogous");
  const [notice, setNotice] = useState("Ready");
  const [undoStack, setUndoStack] = useState<CurrentState[]>([]);
  const paletteHex = useMemo(() => colors.map((c) => normalizeHex(c.hex) ?? "#111827"), [colors]);
  const paletteAlphas = useMemo(() => colors.map((c) => c.alpha), [colors]);

  const announce = useCallback((msg: string) => { setNotice(msg); setTimeout(() => setNotice("Ready"), 2200); }, []);
  const pushUndo = useCallback((s: CurrentState) => setUndoStack((st) => [s, ...st].slice(0, 20)), []);
  const setPalette = useCallback((nc: PaletteColor[], nm: PaletteMode, msg: string) => {
    pushUndo({ colors, mode }); setColors(nc); setMode(nm); announce(msg);
  }, [announce, colors, mode, pushUndo]);
  const generate = useCallback(() => setPalette(generatePalette(colors, mode, colors.length), mode, `${mode}`), [colors, mode, setPalette]);
  const undo = useCallback(() => setUndoStack((s) => { const [p, ...r] = s; if (!p) { announce("Nothing to undo"); return s; } setColors(p.colors); setMode(p.mode); announce("Undone"); return r; }), [announce]);
  function updateHex(id: string, v: string) { setColors((c) => c.map((x) => x.id === id ? { ...x, hex: normalizeHex(v) ?? v.toUpperCase() } : x)); }
  function updateHsl(id: string, ch: "h"|"s"|"l", v: number) { setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToHsl(x.hex); return { ...x, hex: hslToHex(ch==="h"?v:h.h, ch==="s"?v:h.s, ch==="l"?v:h.l) }; })); }
  function updateRgb(id: string, ch: "r"|"g"|"b", v: number) { setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToRgb(x.hex); return { ...x, hex: rgbToHex({ ...h, [ch]: v }) }; })); }
  function updateAlpha(id: string, a: number) { setColors((c) => c.map((x) => x.id === id ? { ...x, alpha: a } : x)); }
  function toggleLock(id: string) { setColors((c) => c.map((x) => x.id === id ? { ...x, locked: !x.locked } : x)); }
  function setSize(n: number) { setPalette(resizePalette(colors, n, mode), mode, `${n}`); }
  function switchMode(m: PaletteMode) { setPalette(generatePalette(colors, m, colors.length), m, `${m}`); }

  return {
    colors, setColors, mode, setMode, paletteHex, paletteAlphas, notice, undoStack,
    announce, generate, undo, setPalette,
    updateHex, updateHsl, updateRgb, updateAlpha, toggleLock, setSize, switchMode,
  };
}

/* ═══════════════════════════════════════════════════════════
   SHARED MINI PALETTE EDITOR — every page gets this
   ═══════════════════════════════════════════════════════════ */

function PaletteEditor({ palette: p }: { palette: ReturnType<typeof usePalette> }) {
  const [advanced, setAdvanced] = useState(false);
  const hints = useMemo(() => p.paletteHex.map((h) => getContrastHint(h)), [p.paletteHex]);

  return <div className="space-y-3">
    {/* Mode + size strip */}
    <div className="data-strip py-2">
      <div className="flex flex-wrap gap-1">
        {paletteModes.slice(0, 6).map((m) => (
          <button key={m} className={`chip ${p.mode === m ? "chip-active" : ""}`} onClick={() => p.switchMode(m)}>{m}</button>
        ))}
      </div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
        {p.colors.length}
        <input className="w-12" min={minPaletteSize} max={maxPaletteSize} type="range" value={p.colors.length} onChange={(e) => p.setSize(Number(e.target.value))} />
      </label>
      <div className="flex gap-1">
        <button className="pill pill-secondary text-xs" disabled={p.colors.length <= minPaletteSize} onClick={() => p.setSize(p.colors.length - 1)}>−</button>
        <button className="pill pill-secondary text-xs" disabled={p.colors.length >= maxPaletteSize} onClick={() => p.setSize(p.colors.length + 1)}>+</button>
      </div>
      <button className="pill pill-accent-ghost text-xs" onClick={() => setAdvanced((o) => !o)}>{advanced ? "Hide" : "Channels"}</button>
    </div>

    {/* Swatches grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border border-[var(--border-default)] rounded-2xl overflow-hidden">
      {p.colors.map((color, idx) => {
        const nh = normalizeHex(color.hex) ?? "#111827";
        const tc = getReadableTextColor(nh);
        const hi = hints[idx];
        const hsl = hexToHsl(nh);
        const rgb = hexToRgb(nh);
        return <article key={color.id} className="flex flex-col justify-between min-h-[240px] p-3" style={{ backgroundColor: nh, color: tc }}>
          <div className="flex items-center justify-between">
            <span className="swatch-action">{idx + 1}</span>
            <div className="flex gap-1">
              <button className="swatch-action" onClick={() => p.toggleLock(color.id)}>{color.locked ? "🔒" : "🔓"}</button>
              <button className="swatch-action" disabled={p.colors.length <= minPaletteSize} onClick={() => p.setPalette(p.colors.filter((c) => c.id !== color.id), p.mode, "Removed")}>✕</button>
            </div>
          </div>
          <div className="space-y-2 mt-auto">
            <input aria-label={`Color ${idx + 1} picker`} className="h-7 w-full cursor-pointer rounded-full border border-white/30 bg-transparent" type="color" value={nh} onChange={(e) => p.updateHex(color.id, e.target.value)} />
            <input className="w-full rounded-full border border-white/30 bg-white/20 px-3 py-1 font-mono text-xs font-semibold text-center uppercase outline-none focus:border-white" value={color.hex} spellCheck={false} onChange={(e) => p.updateHex(color.id, e.target.value)} />
            {advanced && <>
              <div className="grid grid-cols-3 gap-1">{(["h","s","l"] as const).map((ch) => <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-center">{ch}<input className="w-full rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-center outline-none" max={ch==="h"?360:100} min={0} type="number" value={hsl[ch]} onChange={(e) => p.updateHsl(color.id, ch, Number(e.target.value))} /></label>)}</div>
              <div className="grid grid-cols-3 gap-1">{(["r","g","b"] as const).map((ch) => <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-center">{ch}<input className="w-full rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-center outline-none" max={255} min={0} type="number" value={rgb[ch]} onChange={(e) => p.updateRgb(color.id, ch, Number(e.target.value))} /></label>)}</div>
            </>}
            <label className="flex items-center gap-2 text-xs font-semibold">Alpha {color.alpha}%<input className="flex-1" min={0} max={100} type="range" value={color.alpha} onChange={(e) => p.updateAlpha(color.id, Number(e.target.value))} /></label>
            <div className="grid grid-cols-2 gap-0.5">
              <button className="swatch-action text-xs text-center" onClick={async () => { try { await navigator.clipboard.writeText(nh); p.announce("HEX copied"); } catch {} }}>HEX</button>
              <button className="swatch-action text-xs text-center" onClick={async () => { try { await navigator.clipboard.writeText(`rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${color.alpha}%)`); p.announce("RGB copied"); } catch {} }}>RGB</button>
              <button className="swatch-action text-xs text-center" onClick={async () => { try { await navigator.clipboard.writeText(`hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${color.alpha}%)`); p.announce("HSL copied"); } catch {} }}>HSL</button>
              <button className="swatch-action text-xs text-center" onClick={async () => { try { await navigator.clipboard.writeText(`--c${idx+1}:${nh}`); p.announce("Var copied"); } catch {} }}>Var</button>
            </div>
            <p className="text-[10px] font-semibold text-center opacity-80">{hi.rating} {hi.ratio.toFixed(1)}:1</p>
          </div>
        </article>;
      })}
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════
   STUDIO — full editor + import
   ═══════════════════════════════════════════════════════════ */

function StudioSection() {
  const palette = usePalette();
  const [importText, setImportText] = useState("");
  const [extractionCount, setExtractionCount] = useState(5);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("balanced");

  useEffect(() => { const fn = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return; if (e.code === "Space") { e.preventDefault(); palette.generate(); } if (e.key.toLowerCase() === "u") { e.preventDefault(); palette.undo(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  async function extractFromImage(file: File | null) {
    if (!file) return;
    try { const bm = await createImageBitmap(file); const can = document.createElement("canvas"); const ctx = can.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
      const ms = 180, sc = Math.min(ms / bm.width, ms / bm.height, 1); can.width = Math.max(1, Math.round(bm.width * sc)); can.height = Math.max(1, Math.round(bm.height * sc)); ctx.drawImage(bm, 0, 0, can.width, can.height);
      const ex = extractPaletteFromPixels(ctx.getImageData(0, 0, can.width, can.height).data, extractionCount, extractionMode);
      if (ex.length >= minPaletteSize) palette.setPalette(createPalette(ex, ex.length), "Random", `Extracted ${ex.length}`); else palette.announce("No colors");
    } catch { palette.announce("Extraction failed"); }
  }

  return <section className="space-y-4 py-2">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-2xl font-black tracking-tight">Studio</h2>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <button className="pill pill-secondary text-xs" disabled={palette.undoStack.length === 0} onClick={palette.undo}>Undo <span className="opacity-60 hidden sm:inline">(U)</span></button>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>
    <PaletteEditor palette={palette} />

    {/* Import */}
    <section className="max-w-xl space-y-3 pt-4">
      <h3 className="section-title">Import</h3>
      <textarea className="w-full rounded-2xl bg-[var(--bg-surface-muted)] p-4 font-mono text-sm min-h-[80px] outline-none" placeholder="Paste HEX, JSON, CSS variables..." value={importText} onChange={(e) => setImportText(e.target.value)} />
      <div className="flex gap-2 items-center">
        <button className="pill pill-primary text-xs" onClick={() => { const p = parsePaletteInput(importText); if (p.length >= minPaletteSize) palette.setPalette(createPalette(p, p.length), palette.mode, `Imported ${p.length}`); else palette.announce("Need 2+ colors"); }}>Import</button>
        <div className="rounded-2xl px-4 py-2 bg-[var(--bg-surface-muted)] text-xs cursor-pointer" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); extractFromImage(e.dataTransfer.files.item(0)); }}>
          <label className="cursor-pointer"><span className="font-semibold text-[var(--text-primary)]">Drop</span> or <span className="underline decoration-[var(--accent)]">browse</span><input accept="image/*" className="hidden" type="file" onChange={(e) => extractFromImage(e.target.files?.item(0) ?? null)} /></label>
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">Colors {extractionCount}<input className="w-16" min={minPaletteSize} max={maxPaletteSize} type="range" value={extractionCount} onChange={(e) => setExtractionCount(Number(e.target.value))} /></label>
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">Mode<select className="field text-xs w-auto" value={extractionMode} onChange={(e) => setExtractionMode(e.target.value as ExtractionMode)}><option>Balanced</option><option>Vibrant</option><option>Muted</option></select></label>
      </div>
    </section>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   GRADIENT — palette editor + gradient controls
   ═══════════════════════════════════════════════════════════ */

function GradientSection() {
  const palette = usePalette();
  const [kind, setKind] = useState<GradientKind>("linear");
  const [angle, setAngle] = useState(90);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const css = useMemo(() => createGradientCss(palette.paletteHex, kind, angle), [kind, angle, palette.paletteHex]);
  const svg = useMemo(() => createGradientSvg(palette.paletteHex, kind, angle), [kind, angle, palette.paletteHex]);

  useEffect(() => { const c = canvasRef.current, ctx = c?.getContext("2d"); if (c && ctx) drawGradient(ctx, c.width, c.height, palette.paletteHex, kind, angle); }, [kind, angle, palette.paletteHex]);
  useEffect(() => { const fn = (e: KeyboardEvent) => { if (["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return; if (e.code === "Space") { e.preventDefault(); palette.generate(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  function dlPng() { const can = document.createElement("canvas"); can.width = 1200; can.height = 420; const ctx = can.getContext("2d"); if (!ctx) return; drawGradient(ctx, can.width, can.height, palette.paletteHex, kind, angle); can.toBlob((b) => { if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "gradient.png"; a.click(); URL.revokeObjectURL(u); palette.announce("Gradient downloaded"); }); }

  return <section className="space-y-4 py-2">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-2xl font-black tracking-tight">Gradient</h2>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>
    <PaletteEditor palette={palette} />

    {/* Gradient controls */}
    <div className="flex flex-wrap items-center gap-3">
      {(["linear", "radial"] as const).map((k) => <button key={k} className={`chip ${kind === k ? "chip-active" : ""}`} onClick={() => setKind(k)}>{k}</button>)}
      {kind === "linear" && <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">Angle {angle}°<input className="w-20" max={360} min={0} type="range" value={angle} onChange={(e) => setAngle(Number(e.target.value))} /></label>}
    </div>
    <canvas ref={canvasRef} className="w-full h-48 sm:h-56 rounded-2xl border border-[var(--border-default)]" width={1200} height={420} />
    <div className="flex flex-wrap gap-2">
      <button className="pill pill-secondary text-xs" onClick={async () => { try { await navigator.clipboard.writeText(css); palette.announce("CSS copied"); } catch {} }}>Copy CSS</button>
      <button className="pill pill-secondary text-xs" onClick={async () => { try { await navigator.clipboard.writeText(svg); palette.announce("SVG copied"); } catch {} }}>Copy SVG</button>
      <button className="pill pill-secondary text-xs" onClick={dlPng}>Download PNG</button>
      <button className="pill pill-secondary text-xs" onClick={() => { const u = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); const a = document.createElement("a"); a.href = u; a.download = "gradient.svg"; a.click(); URL.revokeObjectURL(u); palette.announce("SVG downloaded"); }}>Download SVG</button>
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   VISUALIZER — palette editor + text/background customization
   ═══════════════════════════════════════════════════════════ */

const visualizerBgOptions = ["auto", "light", "dark", "custom"] as const;
type VizzBg = (typeof visualizerBgOptions)[number];

function VisualizerSection() {
  const palette = usePalette();
  const [activeVizz, setActiveVizz] = useState<Visualizer>("Website");
  const [textColor, setTextColor] = useState("#ffffff");
  const [customBg, setCustomBg] = useState("#333333");
  const [bgMode, setBgMode] = useState<VizzBg>("auto");
  const css = useMemo(() => createGradientCss(palette.paletteHex, "linear", 90), [palette.paletteHex]);

  const appliedBg = bgMode === "auto" ? undefined : bgMode === "custom" ? customBg : bgMode === "light" ? "#ffffff" : "#000000";

  useEffect(() => { const fn = (e: KeyboardEvent) => { if (["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  return <section className="space-y-4 py-2">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-2xl font-black tracking-tight">Visualizer</h2>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>
    <PaletteEditor palette={palette} />

    {/* Visualizer controls */}
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {visualizers.map((v) => <button key={v} className={`chip ${activeVizz === v ? "chip-active" : ""}`} onClick={() => setActiveVizz(v)}>{v}</button>)}
      </div>
    </div>

    {/* Customization panel */}
    <div className="rounded-2xl border border-[var(--border-default)] p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
          Text color
          <input className="size-8 rounded-full cursor-pointer border" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          <span className="font-mono text-xs">{textColor}</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
          Background
          {visualizerBgOptions.map((o) => (
            <button key={o} className={`chip ${bgMode === o ? "chip-active" : ""}`} onClick={() => setBgMode(o)}>{o}</button>
          ))}
        </label>
        {bgMode === "custom" && <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
          <input className="size-8 rounded-full cursor-pointer border" type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} />
          <span className="font-mono">{customBg}</span>
        </label>}
      </div>

      <div className="rounded-2xl border border-[var(--border-default)] p-6 transition-colors" style={{ backgroundColor: appliedBg }}>
        <VisualizerPreview active={activeVizz} colors={palette.paletteHex} gradient={css} textColor={textColor} />
      </div>
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   ACCESSIBILITY — palette editor + contrast tools
   ═══════════════════════════════════════════════════════════ */

function AccessibilitySection() {
  const palette = usePalette();
  const [visionMode, setVisionMode] = useState<VisionMode>("none");
  const pairContrasts = useMemo(() => getPairContrasts(palette.paletteHex), [palette.paletteHex]);
  const score = useMemo(() => getPaletteAccessibilityScore(palette.paletteHex), [palette.paletteHex]);
  const weakest = pairContrasts[0];
  const replacement = weakest ? suggestAccessibleReplacement(weakest.foreground, weakest.background) : "#000";

  useEffect(() => { const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  return <section className="space-y-4 py-2">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Accessibility</h2>
        <p className="text-sm text-[var(--text-secondary)]">Edit your palette above and see contrast scores update live.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <span className="pill pill-accent-ghost text-sm font-bold">{score}/100</span>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>
    <PaletteEditor palette={palette} />

    {/* Accessibility controls */}
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
        Simulation<select className="field text-xs w-auto" value={visionMode} onChange={(e) => setVisionMode(e.target.value as VisionMode)}>
          <option value="none">None</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option>
        </select>
      </label>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {palette.paletteHex.slice(0, 3).map((hex) => {
        const h = getContrastHint(hex);
        return <div key={hex} className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: hex, color: getReadableTextColor(hex) }}>
          <p className="text-sm font-semibold">Readable text</p>
          <p className="text-xs opacity-70">{h.rating} · {h.ratio.toFixed(2)}:1</p>
        </div>;
      })}
    </div>
    {weakest && <div className="text-sm text-[var(--text-secondary)] p-4 rounded-2xl border border-[var(--border-default)]">
      <p><span className="font-semibold text-[var(--text-primary)]">Weakest pair:</span> <span className="font-mono">{weakest.foreground}</span> on <span className="font-mono">{weakest.background}</span> · {weakest.ratio.toFixed(2)}:1</p>
      <p className="mt-1">Suggested replacement: <span className="font-mono text-[var(--accent)]">{replacement}</span></p>
    </div>}
    {palette.paletteHex.length >= 2 && <div className="border-t border-[var(--border-default)] pt-4">
      <h3 className="section-title mb-2">Pair contrast matrix</h3>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {pairContrasts.slice(0, 8).map((p, i) => <div key={i} className="flex items-center gap-2 text-sm py-1.5 border-b border-[var(--border-default)]">
          <span className="size-4 rounded-full border" style={{ backgroundColor: p.foreground }} />
          <span className="text-[10px] opacity-60">on</span>
          <span className="size-4 rounded-full border" style={{ backgroundColor: p.background }} />
          <span className="font-mono text-xs font-semibold ml-auto">{p.ratio.toFixed(2)}:1</span>
        </div>)}
      </div>
    </div>}
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   THEMES — palette editor + theme browser
   ═══════════════════════════════════════════════════════════ */

function ThemesSection() {
  const palette = usePalette();

  useEffect(() => { const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  interface ThemeSet { name: string; desc: string; theme: "light"|"dark"; colors: { hex: string }[] }
  const sets: ThemeSet[] = [
    { name: "Rose Garden", desc: "Warm pink-rose light theme.", theme: "light", colors: [{ hex:"#fff5fc"},{hex:"#fae8f3"},{hex:"#ff66c4"},{hex:"#3a0d2b"},{hex:"#8a6a7e"}] },
    { name: "Noir Pink", desc: "Dark moody with pink pop.", theme: "dark", colors: [{ hex:"#12000d"},{hex:"#1f0a18"},{hex:"#ff66c4"},{hex:"#ffe0f5"},{hex:"#8a6a7e"}] },
    { name: "Ocean Depth", desc: "Cool blue light palette.", theme: "light", colors: [{ hex:"#f0faff"},{hex:"#dff4fe"},{hex:"#0088cc"},{hex:"#002b3d"},{hex:"#607d8b"}] },
    { name: "Deep Ocean", desc: "Dark marine palette.", theme: "dark", colors: [{ hex:"#00101a"},{hex:"#001e30"},{hex:"#0099ff"},{hex:"#e0f0ff"},{hex:"#5a7d8a"}] },
    { name: "Amber Glow", desc: "Warm amber light theme.", theme: "light", colors: [{ hex:"#fffbf0"},{hex:"#fff3d6"},{hex:"#ff8c00"},{hex:"#1a1200"},{hex:"#8a7a5a"}] },
    { name: "Ember Night", desc: "Dark amber accent theme.", theme: "dark", colors: [{ hex:"#0d0800"},{hex:"#1a1200"},{hex:"#ff8c00"},{hex:"#fff5e0"},{hex:"#8a7a5a"}] },
    { name: "Forest Calm", desc: "Earthy green light.", theme: "light", colors: [{ hex:"#f5fff2"},{hex:"#e8f5e0"},{hex:"#2e7d32"},{hex:"#002400"},{hex:"#5a7a5a"}] },
    { name: "Cyberpunk", desc: "Neon dark blue-purple.", theme: "dark", colors: [{ hex:"#0a0014"},{hex:"#160028"},{hex:"#8844ff"},{hex:"#f0e0ff"},{hex:"#7a6a8a"}] },
    { name: "Monochrome", desc: "Clean grayscale light.", theme: "light", colors: [{ hex:"#ffffff"},{hex:"#f5f5f5"},{hex:"#555555"},{hex:"#111111"},{hex:"#8a8a8a"}] },
    { name: "Graphite", desc: "Dark gray high contrast.", theme: "dark", colors: [{ hex:"#0d0d0d"},{hex:"#1a1a1a"},{hex:"#aaaaaa"},{hex:"#ffffff"},{hex:"#8a8a8a"}] },
  ];

  return <section className="space-y-4 py-2">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Themes</h2>
        <p className="text-sm text-[var(--text-secondary)]">Click a theme to load its palette, then edit below.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>

    <div className="grid gap-2 sm:grid-cols-2">
      {sets.map((s) => (
        <button key={s.name} type="button" onClick={() => { const nc = s.colors.map((c) => ({ id: crypto.randomUUID(), hex: c.hex, alpha: 100, locked: false })); palette.setPalette(nc, "Custom" as PaletteMode, `${s.name} loaded`); }}
          className="rounded-2xl border border-[var(--border-default)] p-3 text-left hover:border-[var(--accent)] transition-all">
          <div className="flex gap-1.5 mb-1.5">{s.colors.map((c) => <span key={c.hex} className="h-6 flex-1 rounded-lg border" style={{ backgroundColor: c.hex }} />)}</div>
          <p className="font-semibold text-sm">{s.name}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{s.desc} <span className="uppercase tracking-wider">{s.theme}</span></p>
        </button>
      ))}
    </div>

    <div className="pt-2">
      <PaletteEditor palette={palette} />
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   LIBRARY — palette editor + exports + library browse
   ═══════════════════════════════════════════════════════════ */

function LibrarySection() {
  const palette = usePalette();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState<LibrarySort>("recent");
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("CSS");
  const exportSnippets = useMemo(() => createExportSnippets(palette.paletteHex, palette.paletteAlphas), [palette.paletteHex, palette.paletteAlphas]);
  const score = useMemo(() => getPaletteAccessibilityScore(palette.paletteHex), [palette.paletteHex]);
  const dq = useDeferredValue(query);
  const dt = useDeferredValue(tagFilter);

  const [library, setLibrary] = useState<PaletteRecord[]>(() => { try { const sl = localStorage.getItem(libraryStorageKey); if (sl) { const p = JSON.parse(sl); if (Array.isArray(p)) return p; } } catch {} return []; });
  const [history, setHistory] = useState<PaletteRecord[]>(() => { try { const sh = localStorage.getItem(historyStorageKey); if (sh) { const p = JSON.parse(sh); if (Array.isArray(p)) return p; } } catch {} return []; });
  useEffect(() => { localStorage.setItem(libraryStorageKey, JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem(historyStorageKey, JSON.stringify(history)); }, [history]);

  const filtered = useMemo(() => {
    const nq = dq.trim().toLowerCase(), nt = dt.trim().toLowerCase();
    return sortPalettes(library, sort).filter((r) => { const hay = [r.name, r.collection, r.mode, ...r.colors, ...r.tags].join(" ").toLowerCase(); return (!nq || hay.includes(nq)) && (!nt || r.tags.some((t) => t.toLowerCase().includes(nt))); });
  }, [dq, dt, library, sort]);

  useEffect(() => { const fn = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return; if (e.code === "Space") { e.preventDefault(); palette.generate(); } if (e.key.toLowerCase() === "s") { e.preventDefault(); save(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  function save() { const r = createRecord(palette.colors, palette.mode, `Palette ${library.length + 1}`, true); setLibrary((c) => [r, ...c.filter((i) => paletteSignature(i.colors) !== paletteSignature(r.colors))]); setHistory((h) => [r, ...h].slice(0, 40)); palette.announce("Saved"); }
  function load(r: PaletteRecord) { const c = createPalette(r.colors, r.colors.length).map((x, i) => ({ ...x, alpha: r.alphas[i] ?? 100 })); palette.setPalette(c, r.mode, `${r.name} loaded`); setLibrary((l) => l.map((x) => x.id === r.id ? { ...x, usedAt: new Date().toISOString() } : x)); }
  function updateRecord(id: string, u: Partial<PaletteRecord>) { setLibrary((l) => l.map((r) => r.id === id ? { ...r, ...u, updatedAt: new Date().toISOString() } : r)); }
  function dl(fn: string, c: string, t = "text/plain") { const u = URL.createObjectURL(new Blob([c], { type: t })); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); palette.announce(`${fn} downloaded`); }
  function dlPng() { const can = document.createElement("canvas"); can.width = 1400; can.height = 840; const ctx = can.getContext("2d"); if (!ctx) return; drawSwatches(ctx, can.width, can.height, palette.paletteHex); can.toBlob((b) => { if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "swatches.png"; a.click(); URL.revokeObjectURL(u); palette.announce("PNG downloaded"); }); }

  return <section className="space-y-4 py-2">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-2xl font-black tracking-tight">Library</h2>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <button className="pill pill-secondary text-xs" onClick={save}>Save <span className="opacity-60 hidden sm:inline">(S)</span></button>
        <button className="pill pill-secondary text-xs" disabled={palette.undoStack.length === 0} onClick={palette.undo}>Undo</button>
        <span className="pill pill-accent-ghost text-xs font-bold">{score}/100</span>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>

    {/* Current palette (editable) */}
    <div className="max-w-xl">
      <PaletteEditor palette={palette} />
    </div>

    {/* Exports */}
    <section className="border-t border-[var(--border-default)] pt-6">
      <div className="flex flex-wrap gap-2 mb-3">
        {exportFormats.map((f) => <button key={f} className={`chip ${activeFormat === f ? "chip-active" : ""}`} onClick={() => setActiveFormat(f)}>{f}</button>)}
      </div>
      <pre className="max-h-36 overflow-auto rounded-2xl bg-[var(--bg-surface-muted)] p-4 text-xs leading-relaxed"><code>{exportSnippets[activeFormat]}</code></pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="pill pill-secondary text-xs" onClick={async () => { try { await navigator.clipboard.writeText(exportSnippets[activeFormat]); palette.announce("Copied"); } catch {} }}>Copy</button>
        <button className="pill pill-secondary text-xs" onClick={() => dl(`palette.${extensionFor(activeFormat)}`, exportSnippets[activeFormat])}>Download</button>
        <button className="pill pill-secondary text-xs" onClick={dlPng}>PNG</button>
        <button className="pill pill-secondary text-xs" onClick={() => dl("palette.pdf", createSimplePdf(palette.paletteHex), "application/pdf")}>PDF</button>
        <button className="pill pill-secondary text-xs" onClick={() => dl("palette.svg", exportSnippets.SVG, "image/svg+xml")}>SVG</button>
      </div>
    </section>

    {/* Library browse */}
    <section>
      <h3 className="text-xl font-bold mb-1">Saved</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-3">{library.length} palettes</p>
      <div className="flex flex-wrap gap-3 max-w-xl mb-4">
        <input className="field flex-1 min-w-28" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="field flex-1 min-w-20" placeholder="Tags" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
        <select className="field flex-1 min-w-20" value={sort} onChange={(e) => setSort(e.target.value as LibrarySort)}>{sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      </div>
      {filtered.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No matches. Generate and save.</p>
        : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 24).map((r) => (
              <div key={r.id} className="rounded-2xl border border-[var(--border-default)] p-3 space-y-2">
                <input className="w-full bg-transparent font-semibold outline-none text-sm" value={r.name} onChange={(e) => updateRecord(r.id, { name: e.target.value })} />
                <button className="grid w-full overflow-hidden rounded-xl" style={{ gridTemplateColumns: `repeat(${r.colors.length}, 1fr)` }} onClick={() => load(r)}>
                  {r.colors.map((h, i) => <span key={`${r.id}-${i}`} className="h-7" style={{ backgroundColor: h }} />)}
                </button>
                <input className="w-full bg-transparent text-xs text-[var(--text-muted)] outline-none" placeholder="tags" value={r.tags.join(", ")} onChange={(e) => updateRecord(r.id, { tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                <div className="flex gap-2">
                  <button className="pill pill-secondary text-xs flex-1" onClick={() => updateRecord(r.id, { favorite: !r.favorite })}>{r.favorite ? "★" : "☆"}</button>
                  <button className="pill pill-danger text-xs flex-1" onClick={() => setLibrary((c) => c.filter((x) => x.id !== r.id))}>Delete</button>
                </div>
              </div>
            ))}
          </div>}
    </section>

    {history.length > 0 && <section className="border-t border-[var(--border-default)] pt-4">
      <h3 className="section-title mb-2">Recent</h3>
      <div className="grid gap-2 sm:grid-cols-5">
        {history.slice(0, 10).map((r) => (
          <button key={r.id} className="flex items-center gap-2 text-xs" onClick={() => load(r)}>
            <span className="flex-1 grid grid-flow-col overflow-hidden rounded-md">{r.colors.map((h, i) => <span key={`${r.id}-h-${i}`} className="h-5" style={{ backgroundColor: h }} />)}</span>
            <span className="text-[var(--text-muted)]">{r.mode}</span>
          </button>
        ))}
      </div>
    </section>}
  </section>;
}

function createRecord(colors: PaletteColor[], mode: PaletteMode, name: string, favorite: boolean): PaletteRecord {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name, colors: colors.map((c) => normalizeHex(c.hex) ?? "#111827"), alphas: colors.map((c) => c.alpha), mode, tags: [], collection: "Default", favorite, createdAt: now, updatedAt: now, usedAt: now };
}
