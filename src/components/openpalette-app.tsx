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
  return <div>
    <nav className="flex justify-center py-4" aria-label="Tabs">
      <div className="inline-flex gap-0.5 p-1 rounded-full bg-[#fff5fc] dark:bg-[#2d001e] overflow-x-auto shadow-sm">
        {tabs.map((t) => (
          <button key={t.id} className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === t.id
              ? "bg-[#ff66c4] text-[#1a001a] dark:bg-[#ff85d0] dark:text-[#1a0012] shadow-sm"
              : "text-[#6b3a5a] dark:text-[#d4a0c0] hover:text-[#3a0d2b] dark:hover:text-[#ffe0f5]"
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
   HOOK
   ═══════════════════════════════════════════════════════════ */

type CurrentState = { colors: PaletteColor[]; mode: PaletteMode };

function usePalette() {
  const [colors, setColors] = useState<PaletteColor[]>(() => createPalette());
  const [mode, setMode] = useState<PaletteMode>("Analogous");
  const [notice, setNotice] = useState("Ready");
  const [undoStack, setUndoStack] = useState<CurrentState[]>([]);
  const paletteHex = useMemo(() => colors.map((c) => normalizeHex(c.hex) ?? "#111827"), [colors]);
  const paletteAlphas = useMemo(() => colors.map((c) => c.alpha), [colors]);
  const announce = useCallback((m: string) => { setNotice(m); setTimeout(() => setNotice("Ready"), 2200); }, []);
  const pushUndo = useCallback((s: CurrentState) => setUndoStack((st) => [s, ...st].slice(0, 20)), []);
  const setPalette = useCallback((nc: PaletteColor[], nm: PaletteMode, msg: string) => { pushUndo({ colors, mode }); setColors(nc); setMode(nm); announce(msg); }, [announce, colors, mode, pushUndo]);
  const generate = useCallback(() => setPalette(generatePalette(colors, mode, colors.length), mode, `${mode}`), [colors, mode, setPalette]);
  const undo = useCallback(() => setUndoStack((s) => { const [p, ...r] = s; if (!p) { announce("Nothing to undo"); return s; } setColors(p.colors); setMode(p.mode); announce("Undone"); return r; }), [announce]);
  return {
    colors, setColors, mode, setMode, paletteHex, paletteAlphas, notice, undoStack,
    announce, generate, undo, setPalette,
    updateHex: (id: string, v: string) => setColors((c) => c.map((x) => x.id === id ? { ...x, hex: normalizeHex(v) ?? v.toUpperCase() } : x)),
    updateHsl: (id: string, ch: "h"|"s"|"l", v: number) => setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToHsl(x.hex); return { ...x, hex: hslToHex(ch==="h"?v:h.h, ch==="s"?v:h.s, ch==="l"?v:h.l) }; })),
    updateRgb: (id: string, ch: "r"|"g"|"b", v: number) => setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToRgb(x.hex); return { ...x, hex: rgbToHex({ ...h, [ch]: v }) }; })),
    updateAlpha: (id: string, a: number) => setColors((c) => c.map((x) => x.id === id ? { ...x, alpha: a } : x)),
    toggleLock: (id: string) => setColors((c) => c.map((x) => x.id === id ? { ...x, locked: !x.locked } : x)),
    setSize: (n: number) => setPalette(resizePalette(colors, n, mode), mode, `${n}`),
    switchMode: (m: PaletteMode) => setPalette(generatePalette(colors, m, colors.length), m, `${m}`),
  };
}

/* ═══════════════════════════════════════════════════════════
   FULL-WIDTH SWATCHES (edge-to-edge)
   ═══════════════════════════════════════════════════════════ */

function FullSwatches({ palette: p }: { palette: ReturnType<typeof usePalette> }) {
  return <div className="-mx-4 sm:-mx-6 lg:-mx-8 border-y border-[rgba(255,255,255,0.2)]">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
      {p.colors.map((color, idx) => {
        const nh = normalizeHex(color.hex) ?? "#111827";
        const hsl = hexToHsl(nh);
        const rgb = hexToRgb(nh);
        const tc = getReadableTextColor(nh);
        return <div key={color.id} className="flex flex-col justify-end min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh] p-6 sm:p-8 lg:p-10" style={{ backgroundColor: nh, color: tc }}>
          {/* Top controls */}
          <div className="flex items-center justify-between mb-4">
            <span className="rounded-full bg-black/15 backdrop-blur px-3 py-1 text-xs font-semibold">{idx + 1}/{p.colors.length}</span>
            <div className="flex gap-2">
              <button className="rounded-full bg-black/15 backdrop-blur px-3 py-1 text-xs font-semibold hover:bg-black/30 transition" onClick={() => p.toggleLock(color.id)}>{color.locked ? "🔒" : "🔓"}</button>
              <button className="rounded-full bg-black/15 backdrop-blur px-3 py-1 text-xs font-semibold hover:bg-black/30 transition" disabled={p.colors.length <= minPaletteSize} onClick={() => p.setPalette(p.colors.filter((c) => c.id !== color.id), p.mode, "Removed")}>✕</button>
            </div>
          </div>

          {/* Bottom controls (pushed to bottom via justify-end) */}
          <div className="space-y-2">
            {/* Large hex label */}
            <p className="font-mono text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm">{nh}</p>
            {/* Small HSL/RGB */}
            <p className="text-xs opacity-70 font-mono">hsl({hsl.h}, {hsl.s}%, {hsl.l}%) · rgb({rgb.r}, {rgb.g}, {rgb.b})</p>

            {/* Inline editable row */}
            <div className="flex flex-wrap gap-2 items-center pt-1">
              <input className="h-9 rounded-full border border-white/30 bg-white/20 px-3 py-1 font-mono text-sm font-semibold text-center uppercase outline-none focus:border-white w-28 backdrop-blur" value={color.hex} spellCheck={false} onChange={(e) => p.updateHex(color.id, e.target.value)} />
              <input aria-label={`Color ${idx + 1}`} className="h-9 rounded-full border border-white/30 bg-transparent cursor-pointer w-12" type="color" value={nh} onChange={(e) => p.updateHex(color.id, e.target.value)} />
              <label className="flex items-center gap-1.5 text-xs font-semibold opacity-80">
                α {color.alpha}%
                <input className="w-16" min={0} max={100} type="range" value={color.alpha} onChange={(e) => p.updateAlpha(color.id, Number(e.target.value))} />
              </label>
              <button className="rounded-full bg-black/15 backdrop-blur px-3 py-1 text-xs font-semibold hover:bg-black/30 transition" onClick={async () => { try { await navigator.clipboard.writeText(nh); p.announce("HEX copied"); } catch {} }}>Copy</button>
            </div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════
   STUDIO — full palette editor + import
   ═══════════════════════════════════════════════════════════ */

function StudioSection() {
  const palette = usePalette();
  const [advanced, setAdvanced] = useState(false);
  const [importText, setImportText] = useState("");
  const [extractionCount, setExtractionCount] = useState(5);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("balanced");
  const hints = useMemo(() => palette.paletteHex.map((h) => getContrastHint(h)), [palette.paletteHex]);

  useEffect(() => { const fn = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return; if (e.code === "Space") { e.preventDefault(); palette.generate(); } if (e.key.toLowerCase() === "u") { e.preventDefault(); palette.undo(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  async function extractFromImage(file: File | null) {
    if (!file) return;
    try { const bm = await createImageBitmap(file); const can = document.createElement("canvas"); const ctx = can.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
      const ms = 180, sc = Math.min(ms / bm.width, ms / bm.height, 1); can.width = Math.max(1, Math.round(bm.width * sc)); can.height = Math.max(1, Math.round(bm.height * sc)); ctx.drawImage(bm, 0, 0, can.width, can.height);
      const ex = extractPaletteFromPixels(ctx.getImageData(0, 0, can.width, can.height).data, extractionCount, extractionMode);
      if (ex.length >= minPaletteSize) palette.setPalette(createPalette(ex, ex.length), "Random", `Extracted ${ex.length}`); else palette.announce("No colors");
    } catch { palette.announce("Extraction failed"); }
  }

  return <section>
    {/* Studio controls — compact horizontal strip */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-black tracking-tight">Studio</h1>
        <span className="text-xs text-[var(--text-muted)] opacity-60">{palette.notice}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition" onClick={palette.generate}>Generate (Space)</button>
        <button className="rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition disabled:opacity-30" disabled={palette.undoStack.length === 0} onClick={palette.undo}>Undo (U)</button>
        <button className="rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition" onClick={() => setAdvanced((o) => !o)}>{advanced ? "Hide" : "Channels"}</button>
      </div>
    </div>

    {/* Mode strip */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex flex-wrap gap-1.5 items-center">
      {paletteModes.map((m) => <button key={m} className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${
        palette.mode === m ? "bg-white text-[#1a001a] shadow-sm" : "bg-white/15 text-white/70 hover:bg-white/25 hover:text-white"
      }`} onClick={() => palette.switchMode(m)}>{m}</button>)}
      <label className="flex items-center gap-1.5 text-xs font-semibold text-white/60 ml-2">Size {palette.colors.length}<input className="w-14" min={minPaletteSize} max={maxPaletteSize} type="range" value={palette.colors.length} onChange={(e) => palette.setSize(Number(e.target.value))} /></label>
      <button className="rounded-full bg-white/15 px-2 py-1 text-xs text-white/80 hover:bg-white/25 transition" disabled={palette.colors.length <= minPaletteSize} onClick={() => palette.setSize(palette.colors.length - 1)}>−</button>
      <button className="rounded-full bg-white/15 px-2 py-1 text-xs text-white/80 hover:bg-white/25 transition" disabled={palette.colors.length >= maxPaletteSize} onClick={() => palette.setSize(palette.colors.length + 1)}>+</button>
    </div>

    {/* Edge-to-edge swatches — tall hero */}
    <FullSwatches palette={palette} />

    {/* Advanced channels */}
    {advanced && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {palette.colors.map((color, idx) => {
          const nh = normalizeHex(color.hex) ?? "#111827";
          const hsl = hexToHsl(nh);
          const rgb = hexToRgb(nh);
          const hi = hints[idx];
          return <div key={color.id} className="rounded-2xl p-4 bg-white/10 backdrop-blur space-y-2">
            <p className="text-xs font-semibold text-white/60">#{idx + 1} · {hi.rating} {hi.ratio.toFixed(1)}:1</p>
            <div className="grid grid-cols-3 gap-1">{(["h","s","l"] as const).map((ch) => <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-white/70 text-center">{ch}<input className="w-full rounded-full bg-white/15 px-2 py-1.5 text-xs font-semibold text-center text-white outline-none" max={ch==="h"?360:100} min={0} type="number" value={hsl[ch]} onChange={(e) => palette.updateHsl(color.id, ch, Number(e.target.value))} /></label>)}</div>
            <div className="grid grid-cols-3 gap-1">{(["r","g","b"] as const).map((ch) => <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-white/70 text-center">{ch}<input className="w-full rounded-full bg-white/15 px-2 py-1.5 text-xs font-semibold text-center text-white outline-none" max={255} min={0} type="number" value={rgb[ch]} onChange={(e) => palette.updateRgb(color.id, ch, Number(e.target.value))} /></label>)}</div>
          </div>;
        })}
      </div>
    </div>}

    {/* Import — below swatches */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-3">
      <h3 className="text-xs font-bold tracking-wider uppercase text-white/60">Import</h3>
      <div className="max-w-xl space-y-3">
        <textarea className="w-full rounded-2xl bg-white/15 p-4 font-mono text-sm min-h-[80px] text-white outline-none placeholder:text-white/40" placeholder="Paste HEX, JSON, CSS variables..." value={importText} onChange={(e) => setImportText(e.target.value)} />
        <div className="flex gap-2 items-center">
          <button className="rounded-full bg-white text-[#1a001a] px-5 py-2 text-sm font-semibold hover:bg-white/90 transition" onClick={() => { const p = parsePaletteInput(importText); if (p.length >= minPaletteSize) palette.setPalette(createPalette(p, p.length), palette.mode, `Imported ${p.length}`); else palette.announce("Need 2+ colors"); }}>Import</button>
          <div className="rounded-2xl px-4 py-2 bg-white/10 text-sm cursor-pointer">
            <label className="cursor-pointer text-white/80"><span className="font-semibold text-white">Drop</span> or <span className="underline decoration-white/40">browse</span><input accept="image/*" className="hidden" type="file" onChange={(e) => extractFromImage(e.target.files?.item(0) ?? null)} /></label>
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-white/60">Colors {extractionCount}<input className="w-16" min={minPaletteSize} max={maxPaletteSize} type="range" value={extractionCount} onChange={(e) => setExtractionCount(Number(e.target.value))} /></label>
          <label className="flex items-center gap-2 text-xs font-semibold text-white/60">Mode<select className="rounded-full bg-white/15 px-3 py-1 text-xs text-white outline-none" value={extractionMode} onChange={(e) => setExtractionMode(e.target.value as ExtractionMode)}><option>Balanced</option><option>Vibrant</option><option>Muted</option></select></label>
        </div>
      </div>
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   GRADIENT — compact palette strip + gradient builder
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

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-tight text-white">Gradient</h2>
      <div className="flex items-center gap-2">
        <button className="rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition" onClick={palette.generate}>Generate (Space)</button>
        <span className="text-xs text-white/50">{palette.notice}</span>
      </div>
    </div>

    {/* Compact palette strip */}
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8">
      {palette.paletteHex.map((hex, i) => <button key={i} className="flex-1 h-16 hover:h-20 transition-all duration-200 relative group" style={{ backgroundColor: hex }} onClick={() => { const el = document.createElement("input"); el.type = "color"; el.value = hex; el.oninput = () => palette.updateHex(palette.colors[i].id, el.value); el.click(); }}>
        <span className="absolute bottom-1 left-2 text-[10px] font-mono font-semibold opacity-0 group-hover:opacity-100 transition drop-shadow-sm" style={{ color: getReadableTextColor(hex) }}>{hex}</span>
      </button>)}
    </div>

    <div className="flex flex-wrap items-center gap-3">
      {(["linear", "radial"] as const).map((k) => <button key={k} className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${
        kind === k ? "bg-white text-[#1a001a]" : "bg-white/15 text-white/70 hover:bg-white/25 hover:text-white"
      }`} onClick={() => setKind(k)}>{k}</button>)}
      {kind === "linear" && <label className="flex items-center gap-2 text-xs font-semibold text-white/60">Angle {angle}°<input className="w-20" max={360} min={0} type="range" value={angle} onChange={(e) => setAngle(Number(e.target.value))} /></label>}
    </div>
    <canvas ref={canvasRef} className="w-full h-48 sm:h-64 rounded-2xl border border-white/10" width={1200} height={420} />
    <div className="flex flex-wrap gap-2">
      <button className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/25 transition" onClick={async () => { try { await navigator.clipboard.writeText(css); palette.announce("CSS copied"); } catch {} }}>Copy CSS</button>
      <button className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/25 transition" onClick={async () => { try { await navigator.clipboard.writeText(svg); palette.announce("SVG copied"); } catch {} }}>Copy SVG</button>
      <button className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/25 transition" onClick={() => { const can = document.createElement("canvas"); can.width=1200; can.height=420; const ctx=can.getContext("2d"); if(!ctx)return; drawGradient(ctx, can.width, can.height, palette.paletteHex, kind, angle); can.toBlob((b)=>{if(!b)return;const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="gradient.png";a.click();URL.revokeObjectURL(u);palette.announce("PNG downloaded");}); }}>Download PNG</button>
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   VISUALIZER — compact strip + customization
   ═══════════════════════════════════════════════════════════ */

function VisualizerSection() {
  const palette = usePalette();
  const [activeVizz, setActiveVizz] = useState<Visualizer>("Website");
  const [textColor, setTextColor] = useState("#ffffff");
  const [customBg, setCustomBg] = useState("#333333");
  const [bgMode, setBgMode] = useState<"auto"|"light"|"dark"|"custom">("auto");
  const css = useMemo(() => createGradientCss(palette.paletteHex, "linear", 90), [palette.paletteHex]);
  const appliedBg = bgMode === "auto" ? undefined : bgMode === "custom" ? customBg : bgMode === "light" ? "#ffffff" : "#000000";

  useEffect(() => { const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-tight text-white">Visualizer</h2>
      <div className="flex items-center gap-2">
        <button className="rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition" onClick={palette.generate}>Generate (Space)</button>
        <span className="text-xs text-white/50">{palette.notice}</span>
      </div>
    </div>

    {/* Compact palette strip */}
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8">
      {palette.paletteHex.map((hex, i) => <button key={i} className="flex-1 h-14 hover:h-18 transition-all duration-200" style={{ backgroundColor: hex }} onClick={() => { const el = document.createElement("input"); el.type="color"; el.value=hex; el.oninput=()=>palette.updateHex(palette.colors[i].id, el.value); el.click(); }} />)}
    </div>

    <div className="flex flex-wrap items-center gap-3">
      {visualizers.map((v) => <button key={v} className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${
        activeVizz === v ? "bg-white text-[#1a001a]" : "bg-white/15 text-white/70 hover:bg-white/25 hover:text-white"
      }`} onClick={() => setActiveVizz(v)}>{v}</button>)}
    </div>

    {/* Customization */}
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-xs font-semibold text-white/60">
        Text <input className="size-7 rounded-full cursor-pointer border border-white/30" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
      </label>
      <div className="flex items-center gap-1 text-xs font-semibold text-white/60">
        Bg {(["auto","light","dark","custom"] as const).map((o) => <button key={o} className={`rounded-full px-2.5 py-1 text-xs transition ${
          bgMode === o ? "bg-white text-[#1a001a]" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        }`} onClick={() => setBgMode(o)}>{o}</button>)}
      </div>
      {bgMode === "custom" && <label className="flex items-center gap-2 text-xs font-semibold text-white/60">
        <input className="size-7 rounded-full cursor-pointer border border-white/30" type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} />
        <span className="font-mono">{customBg}</span>
      </label>}
    </div>

    <div className="rounded-2xl border border-white/10 p-6 transition-colors" style={{ backgroundColor: appliedBg }}>
      <VisualizerPreview active={activeVizz} colors={palette.paletteHex} gradient={css} textColor={textColor} />
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   ACCESSIBILITY — compact strip + contrast tools
   ═══════════════════════════════════════════════════════════ */

function AccessibilitySection() {
  const palette = usePalette();
  const [visionMode, setVisionMode] = useState<VisionMode>("none");
  const pairContrasts = useMemo(() => getPairContrasts(palette.paletteHex), [palette.paletteHex]);
  const score = useMemo(() => getPaletteAccessibilityScore(palette.paletteHex), [palette.paletteHex]);
  const weakest = pairContrasts[0];
  const replacement = weakest ? suggestAccessibleReplacement(weakest.foreground, weakest.background) : "#000";

  useEffect(() => { const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-white">Accessibility</h2>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition" onClick={palette.generate}>Generate (Space)</button>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1a001a]">{score}/100</span>
        <span className="text-xs text-white/50">{palette.notice}</span>
      </div>
    </div>

    {/* Compact palette strip */}
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8">
      {palette.paletteHex.map((hex, i) => <button key={i} className="flex-1 h-14 hover:h-18 transition-all duration-200" style={{ backgroundColor: hex }} onClick={() => { const el = document.createElement("input"); el.type="color"; el.value=hex; el.oninput=()=>palette.updateHex(palette.colors[i].id, el.value); el.click(); }} />)}
    </div>

    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-xs font-semibold text-white/60">
        Simulation<select className="rounded-full bg-white/15 px-3 py-1.5 text-xs text-white outline-none" value={visionMode} onChange={(e) => setVisionMode(e.target.value as VisionMode)}>
          <option value="none">None</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option>
        </select>
      </label>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {palette.paletteHex.slice(0, 3).map((hex) => {
        const h = getContrastHint(hex);
        return <div key={hex} className="rounded-2xl p-6 space-y-2 min-h-[120px]" style={{ backgroundColor: hex, color: getReadableTextColor(hex) }}>
          <p className="text-sm font-semibold">Readable text</p>
          <p className="text-xs opacity-70">{h.rating} · {h.ratio.toFixed(2)}:1</p>
        </div>;
      })}
    </div>
    {weakest && <div className="rounded-2xl border border-white/10 p-4 text-sm text-white/80">
      <p><span className="font-semibold text-white">Weakest pair:</span> <span className="font-mono">{weakest.foreground}</span> on <span className="font-mono">{weakest.background}</span> · {weakest.ratio.toFixed(2)}:1</p>
      <p className="mt-1">Suggested: <span className="font-mono text-white">{replacement}</span></p>
    </div>}
    {palette.paletteHex.length >= 2 && <div className="border-t border-white/10 pt-4">
      <h3 className="text-xs font-bold tracking-wider uppercase text-white/60 mb-2">Pair contrast matrix</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {pairContrasts.slice(0, 8).map((p, i) => <div key={i} className="flex items-center gap-2 text-sm py-1.5 border-b border-white/10">
          <span className="size-4 rounded-full border border-white/20" style={{ backgroundColor: p.foreground }} />
          <span className="text-[10px] opacity-50">on</span>
          <span className="size-4 rounded-full border border-white/20" style={{ backgroundColor: p.background }} />
          <span className="font-mono text-xs font-semibold text-white ml-auto">{p.ratio.toFixed(2)}:1</span>
        </div>)}
      </div>
    </div>}
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   THEMES — theme browser with editor
   ═══════════════════════════════════════════════════════════ */

function ThemesSection() {
  const palette = usePalette();

  useEffect(() => { const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  const sets = [
    { name:"Rose Garden", desc:"Warm pink-rose light.", th:"light", colors:[{hex:"#fff5fc"},{hex:"#fae8f3"},{hex:"#ff66c4"},{hex:"#3a0d2b"},{hex:"#8a6a7e"}] },
    { name:"Noir Pink", desc:"Dark moody pink.", th:"dark", colors:[{hex:"#12000d"},{hex:"#1f0a18"},{hex:"#ff66c4"},{hex:"#ffe0f5"},{hex:"#8a6a7e"}] },
    { name:"Ocean Depth", desc:"Cool blue light.", th:"light", colors:[{hex:"#f0faff"},{hex:"#dff4fe"},{hex:"#0088cc"},{hex:"#002b3d"},{hex:"#607d8b"}] },
    { name:"Deep Ocean", desc:"Dark marine.", th:"dark", colors:[{hex:"#00101a"},{hex:"#001e30"},{hex:"#0099ff"},{hex:"#e0f0ff"},{hex:"#5a7d8a"}] },
    { name:"Amber Glow", desc:"Warm amber light.", th:"light", colors:[{hex:"#fffbf0"},{hex:"#fff3d6"},{hex:"#ff8c00"},{hex:"#1a1200"},{hex:"#8a7a5a"}] },
    { name:"Cyberpunk", desc:"Neon dark purple.", th:"dark", colors:[{hex:"#0a0014"},{hex:"#160028"},{hex:"#8844ff"},{hex:"#f0e0ff"},{hex:"#7a6a8a"}] },
    { name:"Forest Calm", desc:"Earthy green light.", th:"light", colors:[{hex:"#f5fff2"},{hex:"#e8f5e0"},{hex:"#2e7d32"},{hex:"#002400"},{hex:"#5a7a5a"}] },
    { name:"Monochrome", desc:"Clean grayscale.", th:"light", colors:[{hex:"#ffffff"},{hex:"#f5f5f5"},{hex:"#555555"},{hex:"#111111"},{hex:"#8a8a8a"}] },
    { name:"Graphite", desc:"Dark gray.", th:"dark", colors:[{hex:"#0d0d0d"},{hex:"#1a1a1a"},{hex:"#aaaaaa"},{hex:"#ffffff"},{hex:"#8a8a8a"}] },
  ];

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-white">Themes</h2>
        <p className="text-sm text-white/60">Click to load, then edit your palette below.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition" onClick={palette.generate}>Generate (Space)</button>
        <span className="text-xs text-white/50">{palette.notice}</span>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {sets.map((s) => <button key={s.name} type="button" onClick={() => { const nc = s.colors.map((c) => ({ id: crypto.randomUUID(), hex: c.hex, alpha: 100, locked: false })); palette.setPalette(nc, "Custom" as PaletteMode, `${s.name} loaded`); }}
        className="rounded-2xl border border-white/15 p-4 text-left hover:bg-white/10 transition">
        <div className="flex gap-1.5 mb-2">{s.colors.map((c) => <span key={c.hex} className="h-8 flex-1 rounded-lg" style={{ backgroundColor: c.hex }} />)}</div>
        <p className="font-semibold text-sm text-white">{s.name}</p>
        <p className="text-xs text-white/50">{s.desc} <span className="uppercase tracking-wider">{s.th}</span></p>
      </button>)}
    </div>

    {/* Palette strip for editing loaded theme */}
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 pt-4">
      {palette.paletteHex.map((hex, i) => <button key={i} className="flex-1 h-16 hover:h-20 transition-all duration-200 relative group" style={{ backgroundColor: hex }} onClick={() => { const el = document.createElement("input"); el.type="color"; el.value=hex; el.oninput=()=>palette.updateHex(palette.colors[i].id, el.value); el.click(); }}>
        <span className="absolute bottom-1 left-2 text-[10px] font-mono font-semibold opacity-0 group-hover:opacity-100 transition" style={{ color: getReadableTextColor(hex) }}>{hex}</span>
      </button>)}
    </div>

    {/* Quick controls */}
    <div className="flex flex-wrap gap-2">
      {paletteModes.slice(0, 5).map((m) => <button key={m} className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${
        palette.mode === m ? "bg-white text-[#1a001a]" : "bg-white/15 text-white/70 hover:bg-white/25 hover:text-white"
      }`} onClick={() => palette.switchMode(m)}>{m}</button>)}
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   LIBRARY — compact strip + export + browser
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

  const [library, setLibrary] = useState<PaletteRecord[]>(() => { try { const s = localStorage.getItem(libraryStorageKey); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; } } catch {} return []; });
  const [history, setHistory] = useState<PaletteRecord[]>(() => { try { const s = localStorage.getItem(historyStorageKey); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; } } catch {} return []; });
  useEffect(() => { localStorage.setItem(libraryStorageKey, JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem(historyStorageKey, JSON.stringify(history)); }, [history]);

  const filtered = useMemo(() => {
    const nq = dq.trim().toLowerCase(), nt = dt.trim().toLowerCase();
    return sortPalettes(library, sort).filter((r) => { const h = [r.name, r.collection, r.mode, ...r.colors, ...r.tags].join(" ").toLowerCase(); return (!nq || h.includes(nq)) && (!nt || r.tags.some((t) => t.toLowerCase().includes(nt))); });
  }, [dq, dt, library, sort]);

  useEffect(() => { const fn = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return; if (e.code === "Space") { e.preventDefault(); palette.generate(); } if (e.key.toLowerCase() === "s") { e.preventDefault(); save(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  function save() { const r = createRecord(palette.colors, palette.mode, `Palette ${library.length + 1}`, true); setLibrary((c) => [r, ...c.filter((i) => paletteSignature(i.colors) !== paletteSignature(r.colors))]); setHistory((h) => [r, ...h].slice(0, 40)); palette.announce("Saved"); }
  function load(r: PaletteRecord) { const c = createPalette(r.colors, r.colors.length).map((x, i) => ({ ...x, alpha: r.alphas[i] ?? 100 })); palette.setPalette(c, r.mode, `${r.name} loaded`); setLibrary((l) => l.map((x) => x.id === r.id ? { ...x, usedAt: new Date().toISOString() } : x)); }
  function upd(id: string, u: Partial<PaletteRecord>) { setLibrary((l) => l.map((r) => r.id === id ? { ...r, ...u, updatedAt: new Date().toISOString() } : r)); }

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-white">Library</h2>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition" onClick={palette.generate}>Generate (Space)</button>
        <button className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/25 transition" onClick={save}>Save (S)</button>
        <button className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/25 transition disabled:opacity-30" disabled={palette.undoStack.length === 0} onClick={palette.undo}>Undo</button>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1a001a]">{score}/100</span>
        <span className="text-xs text-white/50">{palette.notice}</span>
      </div>
    </div>

    {/* Compact palette strip */}
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8">
      {palette.paletteHex.map((hex, i) => <button key={i} className="flex-1 h-14 hover:h-18 transition-all duration-200" style={{ backgroundColor: hex }} onClick={() => { const el = document.createElement("input"); el.type="color"; el.value=hex; el.oninput=()=>palette.updateHex(palette.colors[i].id, el.value); el.click(); }} />)}
    </div>

    {/* Exports */}
    <section>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {exportFormats.map((f) => <button key={f} className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${activeFormat === f ? "bg-white text-[#1a001a]" : "bg-white/15 text-white/70 hover:bg-white/25 hover:text-white"}`} onClick={() => setActiveFormat(f)}>{f}</button>)}
      </div>
      <pre className="max-h-32 overflow-auto rounded-2xl bg-white/10 p-4 text-xs text-white/80 leading-relaxed"><code className="font-mono">{exportSnippets[activeFormat]}</code></pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition" onClick={async () => { try { await navigator.clipboard.writeText(exportSnippets[activeFormat]); palette.announce("Copied"); } catch {} }}>Copy</button>
        <button className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition" onClick={() => { const u = URL.createObjectURL(new Blob([exportSnippets[activeFormat]], { type: "text/plain" })); const a = document.createElement("a"); a.href = u; a.download = `palette.${extensionFor(activeFormat)}`; a.click(); URL.revokeObjectURL(u); palette.announce("Downloaded"); }}>Download</button>
        <button className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition" onClick={() => { const can = document.createElement("canvas"); can.width=1400; can.height=840; const ctx=can.getContext("2d"); if(!ctx)return; drawSwatches(ctx, can.width, can.height, palette.paletteHex); can.toBlob((b)=>{if(!b)return;const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="swatches.png";a.click();URL.revokeObjectURL(u);palette.announce("PNG downloaded");}); }}>PNG</button>
        <button className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition" onClick={() => { const u = URL.createObjectURL(new Blob([createSimplePdf(palette.paletteHex)], { type: "application/pdf" })); const a = document.createElement("a"); a.href = u; a.download = "palette.pdf"; a.click(); URL.revokeObjectURL(u); palette.announce("PDF downloaded"); }}>PDF</button>
      </div>
    </section>

    {/* Library */}
    <section>
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="rounded-full bg-white/15 px-4 py-2 text-sm text-white outline-none placeholder:text-white/40 flex-1 min-w-28" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="rounded-full bg-white/15 px-4 py-2 text-sm text-white outline-none placeholder:text-white/40 flex-1 min-w-20" placeholder="Tags" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
        <select className="rounded-full bg-white/15 px-4 py-2 text-sm text-white outline-none flex-1 min-w-20" value={sort} onChange={(e) => setSort(e.target.value as LibrarySort)}>{sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      </div>
      {filtered.length === 0 ? <p className="text-sm text-white/50">No matches. Generate and save.</p>
        : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 24).map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/15 p-3 space-y-2">
                <input className="w-full bg-transparent font-semibold outline-none text-sm text-white" value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} />
                <button className="grid w-full overflow-hidden rounded-xl" style={{ gridTemplateColumns: `repeat(${r.colors.length}, 1fr)` }} onClick={() => load(r)}>{r.colors.map((h, i) => <span key={`${r.id}-${i}`} className="h-8" style={{ backgroundColor: h }} />)}</button>
                <input className="w-full bg-transparent text-xs text-white/50 outline-none" placeholder="tags" value={r.tags.join(", ")} onChange={(e) => upd(r.id, { tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                <div className="flex gap-2">
                  <button className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25 transition flex-1" onClick={() => upd(r.id, { favorite: !r.favorite })}>{r.favorite ? "★" : "☆"}</button>
                  <button className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60 hover:bg-white/20 transition flex-1" onClick={() => setLibrary((c) => c.filter((x) => x.id !== r.id))}>Delete</button>
                </div>
              </div>
            ))}
          </div>}
    </section>

    {history.length > 0 && <section className="border-t border-white/10 pt-4">
      <h3 className="text-xs font-bold tracking-wider uppercase text-white/60 mb-2">Recent</h3>
      <div className="grid gap-2 sm:grid-cols-5">
        {history.slice(0, 10).map((r) => (
          <button key={r.id} className="flex items-center gap-2 text-xs" onClick={() => load(r)}>
            <span className="flex-1 grid grid-flow-col overflow-hidden rounded-md">{r.colors.map((h, i) => <span key={`${r.id}-h-${i}`} className="h-5" style={{ backgroundColor: h }} />)}</span>
            <span className="text-white/50">{r.mode}</span>
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
