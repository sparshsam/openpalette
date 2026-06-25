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
  simulateVision,
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
  { label: "Recently used", value: "recent" },
  { label: "Brightness", value: "brightness" },
  { label: "Contrast", value: "contrast" },
  { label: "Warm/cool", value: "temperature" },
  { label: "Favorites", value: "favorites" },
];

type Tab = "studio" | "gradient" | "visualizer" | "accessibility" | "themes" | "library";
const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "gradient", label: "Gradient" },
  { id: "visualizer", label: "Visualizer" },
  { id: "accessibility", label: "Accessibility" },
  { id: "themes", label: "Themes" },
  { id: "library", label: "Library" },
];

/* ═══════════════════════════════════════════════════════════
   SHELL — tab nav at top, renders active section
   ═══════════════════════════════════════════════════════════ */

export function OpenPaletteApp() {
  const [activeTab, setActiveTab] = useState<Tab>("studio");

  return (
    <div className="mx-auto max-w-7xl px-6 pt-4 pb-20">
      {/* Tab nav — top, below header */}
      <nav className="flex justify-center mb-6" aria-label="Feature tabs">
        <div className="inline-flex gap-0.5 p-1 rounded-full bg-[var(--bg-surface-muted)]">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === t.id
                  ? "bg-[var(--accent)] text-[#11000d] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              type="button"
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "studio" && <StudioSection />}
      {activeTab === "gradient" && <GradientSection />}
      {activeTab === "visualizer" && <VisualizerSection />}
      {activeTab === "accessibility" && <AccessibilitySection />}
      {activeTab === "themes" && <ThemesSection />}
      {activeTab === "library" && <LibrarySection />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOOK — shared palette state management
   Each section can call this for its own independent state
   ═══════════════════════════════════════════════════════════ */

type CurrentState = { colors: PaletteColor[]; mode: PaletteMode };

function usePalette(initial?: { colors: PaletteColor[]; mode: PaletteMode } | null) {
  const [colors, setColors] = useState<PaletteColor[]>(() => initial?.colors ?? createPalette());
  const [mode, setMode] = useState<PaletteMode>(() => initial?.mode ?? "Analogous");

  const [notice, setNotice] = useState("Ready");
  const [hydrated, setHydrated] = useState(false);
  const [undoStack, setUndoStack] = useState<CurrentState[]>([]);

  const paletteHex = useMemo(() => colors.map((c) => normalizeHex(c.hex) ?? "#111827"), [colors]);
  const paletteAlphas = useMemo(() => colors.map((c) => c.alpha), [colors]);

  const announce = useCallback((msg: string) => { setNotice(msg); setTimeout(() => setNotice("Ready"), 2200); }, []);

  const pushUndo = useCallback((state: CurrentState) => setUndoStack((s) => [state, ...s].slice(0, 20)), []);

  const setPalette = useCallback((nc: PaletteColor[], nm: PaletteMode, msg: string) => {
    pushUndo({ colors, mode });
    setColors(nc);
    setMode(nm);
    announce(msg);
  }, [announce, colors, mode, pushUndo]);

  const generate = useCallback(() => setPalette(generatePalette(colors, mode, colors.length), mode, `${mode} palette`), [colors, mode, setPalette]);

  const undo = useCallback(() => setUndoStack((s) => {
    const [p, ...r] = s;
    if (!p) { announce("Nothing to undo"); return s; }
    setColors(p.colors); setMode(p.mode); announce("Undone");
    return r;
  }), [announce]);

  function updateHex(id: string, v: string) { setColors((c) => c.map((x) => x.id === id ? { ...x, hex: normalizeHex(v) ?? v.toUpperCase() } : x)); }
  function updateHsl(id: string, ch: "h" | "s" | "l", v: number) { setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToHsl(x.hex); return { ...x, hex: hslToHex(ch === "h" ? v : h.h, ch === "s" ? v : h.s, ch === "l" ? v : h.l) }; })); }
  function updateRgb(id: string, ch: "r" | "g" | "b", v: number) { setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToRgb(x.hex); return { ...x, hex: rgbToHex({ ...h, [ch]: v }) }; })); }
  function updateAlpha(id: string, a: number) { setColors((c) => c.map((x) => x.id === id ? { ...x, alpha: a } : x)); }
  function toggleLock(id: string) { setColors((c) => c.map((x) => x.id === id ? { ...x, locked: !x.locked } : x)); }
  function setSize(n: number) { setPalette(resizePalette(colors, n, mode), mode, `${n} colors`); }
  function switchMode(m: PaletteMode) { setPalette(generatePalette(colors, m, colors.length), m, `${m}`); }

  return {
    colors, setColors, mode, setMode, paletteHex, paletteAlphas,
    notice, hydrated, setHydrated, undoStack,
    announce, generate, undo, setPalette,
    updateHex, updateHsl, updateRgb, updateAlpha, toggleLock, setSize, switchMode,
  };
}

/* ═══════════════════════════════════════════════════════════
   STUDIO — full independent palette studio
   ═══════════════════════════════════════════════════════════ */

function StudioSection() {
  const palette = usePalette();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [visionMode, setVisionMode] = useState<VisionMode>("none");
  const [importText, setImportText] = useState("");
  const [extractionCount, setExtractionCount] = useState(5);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("balanced");

  const contrastHints = useMemo(() => palette.paletteHex.map((h) => getContrastHint(h)), [palette.paletteHex]);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); palette.generate(); }
      if (e.key.toLowerCase() === "u") { e.preventDefault(); palette.undo(); }
    };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  });

  async function extractFromImage(file: File | null) {
    if (!file) return;
    try {
      const bm = await createImageBitmap(file);
      const can = document.createElement("canvas");
      const ctx = can.getContext("2d", { willReadFrequently: true });
      if (!ctx) { palette.announce("Extraction unavailable"); return; }
      const ms = 180, sc = Math.min(ms / bm.width, ms / bm.height, 1);
      can.width = Math.max(1, Math.round(bm.width * sc));
      can.height = Math.max(1, Math.round(bm.height * sc));
      ctx.drawImage(bm, 0, 0, can.width, can.height);
      const ex = extractPaletteFromPixels(ctx.getImageData(0, 0, can.width, can.height).data, extractionCount, extractionMode);
      if (ex.length >= minPaletteSize) palette.setPalette(createPalette(ex, ex.length), "Random", `Extracted ${ex.length}`); else palette.announce("No usable colors");
    } catch { palette.announce("Extraction failed"); }
  }

  function importPaletteFn() {
    const p = parsePaletteInput(importText);
    if (p.length < minPaletteSize) { palette.announce("Need 2+ HEX colors"); return; }
    palette.setPalette(createPalette(p, p.length), palette.mode, `Imported ${p.length}`);
  }

  async function copyText(v: string, l: string) { try { await navigator.clipboard.writeText(v); palette.announce(`${l} copied`); } catch { palette.announce("Copy failed"); } }

  return <section className="space-y-6 py-4">
    {/* Toolbar */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className="pill pill-primary text-xs" type="button" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <button className="pill pill-secondary text-xs" disabled={palette.undoStack.length === 0} type="button" onClick={palette.undo}>Undo <span className="opacity-60 hidden sm:inline">(U)</span></button>
      </div>
      <span aria-live="polite" role="status" className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
    </div>

    {/* Mode strip */}
    <div className="data-strip">
      <div className="flex flex-wrap gap-1.5">
        {paletteModes.map((m) => (
          <button key={m} className={`chip ${palette.mode === m ? "chip-active" : ""}`} type="button" onClick={() => palette.switchMode(m)}>{m}</button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
        Size {palette.colors.length}
        <input className="w-16" min={minPaletteSize} max={maxPaletteSize} type="range" value={palette.colors.length} onChange={(e) => palette.setSize(Number(e.target.value))} />
      </label>
      <div className="flex gap-1">
        <button className="pill pill-secondary text-xs" disabled={palette.colors.length <= minPaletteSize} onClick={() => palette.setSize(palette.colors.length - 1)}>−</button>
        <button className="pill pill-secondary text-xs" disabled={palette.colors.length >= maxPaletteSize} onClick={palette.setSize.bind(null, palette.colors.length + 1)}>+</button>
      </div>
      <button className="pill pill-accent-ghost text-xs" onClick={() => setAdvancedOpen((o) => !o)}>
        {advancedOpen ? "Hide channels" : "Channels"}
      </button>
      <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
        Simulate<select className="field text-xs w-auto" value={visionMode} onChange={(e) => setVisionMode(e.target.value as VisionMode)}>
          <option value="none">None</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option>
        </select>
      </label>
    </div>

    {/* Swatches */}
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border border-[var(--border-default)] rounded-2xl overflow-hidden">
      {palette.colors.map((color, idx) => {
        const nh = normalizeHex(color.hex) ?? "#111827";
        const sh = simulateVision(nh, visionMode);
        const tc = getReadableTextColor(sh);
        const hi = contrastHints[idx];
        const hsl = hexToHsl(nh);
        const rgb = hexToRgb(nh);
        return <article key={color.id} className="group flex flex-col justify-between min-h-[280px] p-4" style={{ backgroundColor: sh, color: tc }}>
          <div className="flex items-center justify-between">
            <span className="swatch-action">{String(idx + 1).padStart(2, "0")}</span>
            <div className="flex gap-1">
              <button className="swatch-action" onClick={() => palette.toggleLock(color.id)}>{color.locked ? "🔒" : "🔓"}</button>
              <button className="swatch-action" disabled={palette.colors.length <= minPaletteSize} onClick={() => palette.setPalette(palette.colors.filter((c) => c.id !== color.id), palette.mode, "Removed")}>✕</button>
            </div>
          </div>
          <div className="space-y-2 mt-auto">
            <input aria-label={`Color ${idx + 1} picker`} className="h-8 w-full cursor-pointer rounded-full border border-white/30 bg-transparent" type="color" value={nh} onChange={(e) => palette.updateHex(color.id, e.target.value)} />
            <input className="w-full rounded-full border border-white/30 bg-white/20 px-3 py-1.5 font-mono text-sm font-semibold text-center uppercase outline-none focus:border-white" value={color.hex} spellCheck={false} onChange={(e) => palette.updateHex(color.id, e.target.value)} />
            {advancedOpen && <>
              <div className="grid grid-cols-3 gap-1">{(["h","s","l"] as const).map((ch) => <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-center">{ch}<input className="w-full rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-center outline-none" max={ch==="h"?360:100} min={0} type="number" value={hsl[ch]} onChange={(e) => palette.updateHsl(color.id, ch, Number(e.target.value))} /></label>)}</div>
              <div className="grid grid-cols-3 gap-1">{(["r","g","b"] as const).map((ch) => <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-center">{ch}<input className="w-full rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-center outline-none" max={255} min={0} type="number" value={rgb[ch]} onChange={(e) => palette.updateRgb(color.id, ch, Number(e.target.value))} /></label>)}</div>
            </>}
            <label className="flex items-center gap-2 text-xs font-semibold">Alpha {color.alpha}%<input className="flex-1" min={0} max={100} type="range" value={color.alpha} onChange={(e) => palette.updateAlpha(color.id, Number(e.target.value))} /></label>
            <div className="grid grid-cols-2 gap-1">
              <button className="swatch-action text-center" onClick={() => copyText(nh, "HEX")}>HEX</button>
              <button className="swatch-action text-center" onClick={() => copyText(`rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${color.alpha}%)`, "RGB")}>RGB</button>
              <button className="swatch-action text-center" onClick={() => copyText(`hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${color.alpha}%)`, "HSL")}>HSL</button>
              <button className="swatch-action text-center" onClick={() => copyText(`--color-${idx+1}: ${nh};`, "Var")}>Var</button>
            </div>
            <p className="text-[11px] font-semibold text-center opacity-80">{hi.rating} · {hi.ratio.toFixed(1)}:1</p>
          </div>
        </article>;
      })}
    </section>

    {/* Import */}
    <section className="max-w-xl space-y-3">
      <h2 className="section-title">Import</h2>
      <textarea className="w-full rounded-2xl bg-[var(--bg-surface-muted)] p-4 font-mono text-sm min-h-[80px] outline-none" placeholder="Paste HEX, JSON, CSS variables..." value={importText} onChange={(e) => setImportText(e.target.value)} />
      <div className="flex gap-2 items-center">
        <button className="pill pill-primary text-xs" type="button" onClick={importPaletteFn}>Import</button>
        <div className="rounded-2xl px-4 py-2 bg-[var(--bg-surface-muted)] text-xs cursor-pointer" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); extractFromImage(e.dataTransfer.files.item(0)); }}>
          <label className="cursor-pointer"><span className="font-semibold text-[var(--text-primary)]">Drop image</span> or <span className="underline decoration-[var(--accent)]">browse</span><input accept="image/*" className="hidden" type="file" onChange={(e) => extractFromImage(e.target.files?.item(0) ?? null)} /></label>
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
   GRADIENT — independent gradient generator
   ═══════════════════════════════════════════════════════════ */

function GradientSection() {
  const palette = usePalette();
  const [kind, setKind] = useState<GradientKind>("linear");
  const [angle, setAngle] = useState(90);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const css = useMemo(() => createGradientCss(palette.paletteHex, kind, angle), [kind, angle, palette.paletteHex]);
  const svg = useMemo(() => createGradientSvg(palette.paletteHex, kind, angle), [kind, angle, palette.paletteHex]);

  useEffect(() => {
    const c = canvasRef.current, ctx = c?.getContext("2d");
    if (c && ctx) drawGradient(ctx, c.width, c.height, palette.paletteHex, kind, angle);
  }, [kind, angle, palette.paletteHex]);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "INPUT") return;
      if (e.code === "Space") { e.preventDefault(); palette.generate(); }
    };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  });

  async function copyText(v: string, l: string) { try { await navigator.clipboard.writeText(v); palette.announce(`${l} copied`); } catch {} }
  function dl(fn: string, c: string, t = "text/plain") { const u = URL.createObjectURL(new Blob([c], { type: t })); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); palette.announce(`${fn} downloaded`); }
  function dlPng() {
    const can = document.createElement("canvas"); can.width = 1200; can.height = 420; const ctx = can.getContext("2d");
    if (!ctx) return; drawGradient(ctx, can.width, can.height, palette.paletteHex, kind, angle);
    can.toBlob((b) => { if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "gradient.png"; a.click(); URL.revokeObjectURL(u); palette.announce("Gradient downloaded"); });
  }

  return <section className="py-4 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-black tracking-tight">Gradient</h2>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" type="button" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <span aria-live="polite" className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {(["linear", "radial"] as const).map((k) => <button key={k} className={`chip ${kind === k ? "chip-active" : ""}`} onClick={() => setKind(k)}>{k}</button>)}
      {kind === "linear" && <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">Angle {angle}°<input className="w-20" max={360} min={0} type="range" value={angle} onChange={(e) => setAngle(Number(e.target.value))} /></label>}
    </div>
    <canvas ref={canvasRef} className="w-full h-48 sm:h-56 rounded-2xl border border-[var(--border-default)]" width={1200} height={420} />
    <div className="flex flex-wrap gap-2">
      <button className="pill pill-secondary text-xs" onClick={() => copyText(css, "CSS")}>Copy CSS</button>
      <button className="pill pill-secondary text-xs" onClick={() => copyText(svg, "SVG")}>Copy SVG</button>
      <button className="pill pill-secondary text-xs" onClick={dlPng}>Download PNG</button>
      <button className="pill pill-secondary text-xs" onClick={() => dl("gradient.svg", svg, "image/svg+xml")}>Download SVG</button>
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   VISUALIZER — independent visualizer
   ═══════════════════════════════════════════════════════════ */

function VisualizerSection() {
  const palette = usePalette();
  const [active, setActive] = useState<Visualizer>("Website");
  const css = useMemo(() => createGradientCss(palette.paletteHex, "linear", 90), [palette.paletteHex]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  });

  return <section className="py-4 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-black tracking-tight">Visualizer</h2>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" type="button" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {visualizers.map((v) => <button key={v} className={`chip ${active === v ? "chip-active" : ""}`} onClick={() => setActive(v)}>{v}</button>)}
    </div>
    <div className="rounded-2xl border border-[var(--border-default)] p-6 bg-[var(--bg-surface)]">
      <VisualizerPreview active={active} colors={palette.paletteHex} gradient={css} />
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   ACCESSIBILITY — independent accessibility checker
   ═══════════════════════════════════════════════════════════ */

function AccessibilitySection() {
  const palette = usePalette();
  const [visionMode, setVisionMode] = useState<VisionMode>("none");
  const pairContrasts = useMemo(() => getPairContrasts(palette.paletteHex), [palette.paletteHex]);
  const score = useMemo(() => getPaletteAccessibilityScore(palette.paletteHex), [palette.paletteHex]);
  const weakest = pairContrasts[0];
  const replacement = weakest ? suggestAccessibleReplacement(weakest.foreground, weakest.background) : "#000";

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  });

  return <section className="py-4 space-y-8">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-black tracking-tight">Accessibility</h2>
      <div className="flex items-center gap-2">
        <button className="pill pill-primary text-xs" type="button" onClick={palette.generate}>Generate <span className="opacity-60 hidden sm:inline">(Space)</span></button>
        <span className="pill pill-accent-ghost text-sm font-bold">{score}/100</span>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>
    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
      Simulation<select className="field text-xs w-auto" value={visionMode} onChange={(e) => setVisionMode(e.target.value as VisionMode)}>
        <option value="none">None</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option>
      </select>
    </label>
    <div className="grid gap-4 sm:grid-cols-3">
      {palette.paletteHex.slice(0, 3).map((hex) => {
        const h = getContrastHint(hex);
        return <div key={hex} className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: hex, color: getReadableTextColor(hex) }}>
          <p className="text-sm font-semibold">Readable text</p>
          <p className="text-xs opacity-70">{h.rating} · {h.ratio.toFixed(2)}:1</p>
        </div>;
      })}
    </div>
    {weakest && <div className="text-sm text-[var(--text-secondary)]">
      <p><span className="font-semibold text-[var(--text-primary)]">Weakest:</span> {weakest.foreground} on {weakest.background} · {weakest.ratio.toFixed(2)}:1</p>
      <p className="mt-1">Suggested: <span className="font-mono text-[var(--accent)]">{replacement}</span></p>
    </div>}
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   THEMES — independent theme palette browser
   ═══════════════════════════════════════════════════════════ */

function ThemesSection() {
  const palette = usePalette();

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  });

  const themeSets: { name: string; description: string; theme: "light" | "dark"; colors: { name: string; hex: string; role: string }[] }[] = [
    { name: "Rose Garden", description: "Warm, romantic light palette with pink undertones.", theme: "light", colors: [
      { name: "Background", hex: "#fff5fc", role: "bg-base" }, { name: "Surface", hex: "#fae8f3", role: "bg-surface" },
      { name: "Accent", hex: "#ff66c4", role: "accent" }, { name: "Text", hex: "#3a0d2b", role: "text-primary" }, { name: "Muted", hex: "#8a6a7e", role: "text-muted" },
    ]},
    { name: "Noir Pink", description: "Dark, moody palette with electric pink pop.", theme: "dark", colors: [
      { name: "Background", hex: "#12000d", role: "bg-base" }, { name: "Surface", hex: "#1f0a18", role: "bg-surface" },
      { name: "Accent", hex: "#ff66c4", role: "accent" }, { name: "Text", hex: "#ffe0f5", role: "text-primary" }, { name: "Muted", hex: "#8a6a7e", role: "text-muted" },
    ]},
    { name: "Ocean Depth", description: "Cool blue-green light palette for serene UIs.", theme: "light", colors: [
      { name: "Background", hex: "#f0faff", role: "bg-base" }, { name: "Surface", hex: "#dff4fe", role: "bg-surface" },
      { name: "Accent", hex: "#0088cc", role: "accent" }, { name: "Text", hex: "#002b3d", role: "text-primary" }, { name: "Muted", hex: "#607d8b", role: "text-muted" },
    ]},
    { name: "Deep Ocean", description: "Dark marine palette for focused interfaces.", theme: "dark", colors: [
      { name: "Background", hex: "#00101a", role: "bg-base" }, { name: "Surface", hex: "#001e30", role: "bg-surface" },
      { name: "Accent", hex: "#0099ff", role: "accent" }, { name: "Text", hex: "#e0f0ff", role: "text-primary" }, { name: "Muted", hex: "#5a7d8a", role: "text-muted" },
    ]},
    { name: "Amber Glow", description: "Warm amber light palette.", theme: "light", colors: [
      { name: "Background", hex: "#fffbf0", role: "bg-base" }, { name: "Surface", hex: "#fff3d6", role: "bg-surface" },
      { name: "Accent", hex: "#ff8c00", role: "accent" }, { name: "Text", hex: "#1a1200", role: "text-primary" }, { name: "Muted", hex: "#8a7a5a", role: "text-muted" },
    ]},
    { name: "Ember Night", description: "Dark palette with warm amber accent.", theme: "dark", colors: [
      { name: "Background", hex: "#0d0800", role: "bg-base" }, { name: "Surface", hex: "#1a1200", role: "bg-surface" },
      { name: "Accent", hex: "#ff8c00", role: "accent" }, { name: "Text", hex: "#fff5e0", role: "text-primary" }, { name: "Muted", hex: "#8a7a5a", role: "text-muted" },
    ]},
    { name: "Forest Calm", description: "Earthy green light palette.", theme: "light", colors: [
      { name: "Background", hex: "#f5fff2", role: "bg-base" }, { name: "Surface", hex: "#e8f5e0", role: "bg-surface" },
      { name: "Accent", hex: "#2e7d32", role: "accent" }, { name: "Text", hex: "#002400", role: "text-primary" }, { name: "Muted", hex: "#5a7a5a", role: "text-muted" },
    ]},
    { name: "Cyberpunk", description: "Neon dark with electric blue-purple accent.", theme: "dark", colors: [
      { name: "Background", hex: "#0a0014", role: "bg-base" }, { name: "Surface", hex: "#160028", role: "bg-surface" },
      { name: "Accent", hex: "#8844ff", role: "accent" }, { name: "Text", hex: "#f0e0ff", role: "text-primary" }, { name: "Muted", hex: "#7a6a8a", role: "text-muted" },
    ]},
    { name: "Monochrome", description: "Clean grayscale light palette.", theme: "light", colors: [
      { name: "Background", hex: "#ffffff", role: "bg-base" }, { name: "Surface", hex: "#f5f5f5", role: "bg-surface" },
      { name: "Accent", hex: "#555555", role: "accent" }, { name: "Text", hex: "#111111", role: "text-primary" }, { name: "Muted", hex: "#8a8a8a", role: "text-muted" },
    ]},
    { name: "Graphite", description: "Dark gray palette, high contrast.", theme: "dark", colors: [
      { name: "Background", hex: "#0d0d0d", role: "bg-base" }, { name: "Surface", hex: "#1a1a1a", role: "bg-surface" },
      { name: "Accent", hex: "#aaaaaa", role: "accent" }, { name: "Text", hex: "#ffffff", role: "text-primary" }, { name: "Muted", hex: "#8a8a8a", role: "text-muted" },
    ]},
  ];

  return <section className="py-4 space-y-8">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Themes</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl mt-1">Curated color systems for light and dark mode. Click one to load it.</p>
      </div>
      <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
    </div>

    <div>
      <h3 className="section-title mb-3 flex items-center gap-2"><span>☀️</span> Light</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {themeSets.filter((t) => t.theme === "light").map((set) => (
          <button key={set.name} type="button" onClick={() => { const nc = set.colors.map((c) => ({ id: crypto.randomUUID(), hex: c.hex, alpha: 100, locked: false })); palette.setPalette(nc, "Custom" as PaletteMode, `${set.name} loaded`); }}
            className="rounded-2xl border border-[var(--border-default)] p-3 text-left hover:border-[var(--accent)] transition-all">
            <div className="flex gap-1.5 mb-2">{set.colors.map((c) => <span key={c.hex} className="h-7 flex-1 rounded-lg border" style={{ backgroundColor: c.hex }} />)}</div>
            <p className="font-semibold text-sm">{set.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{set.description}</p>
          </button>
        ))}
      </div>
    </div>

    <div className="border-t border-[var(--border-default)] pt-6">
      <h3 className="section-title mb-3 flex items-center gap-2"><span>🌙</span> Dark</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {themeSets.filter((t) => t.theme === "dark").map((set) => (
          <button key={set.name} type="button" onClick={() => { const nc = set.colors.map((c) => ({ id: crypto.randomUUID(), hex: c.hex, alpha: 100, locked: false })); palette.setPalette(nc, "Custom" as PaletteMode, `${set.name} loaded`); }}
            className="rounded-2xl border border-[var(--border-default)] p-3 text-left hover:border-[var(--accent)] transition-all">
            <div className="flex gap-1.5 mb-2">{set.colors.map((c) => <span key={c.hex} className="h-7 flex-1 rounded-lg border" style={{ backgroundColor: c.hex }} />)}</div>
            <p className="font-semibold text-sm">{set.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{set.description}</p>
          </button>
        ))}
      </div>
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   LIBRARY — full library + exports, own palette
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

  const [library, setLibrary] = useState<PaletteRecord[]>(() => {
    try { const sl = localStorage.getItem(libraryStorageKey); if (sl) { const p = JSON.parse(sl); if (Array.isArray(p)) return p; } } catch {}
    return [];
  });
  const [history, setHistory] = useState<PaletteRecord[]>(() => {
    try { const sh = localStorage.getItem(historyStorageKey); if (sh) { const p = JSON.parse(sh); if (Array.isArray(p)) return p; } } catch {}
    return [];
  });
  // Persist library and history changes to localStorage
  useEffect(() => { localStorage.setItem(libraryStorageKey, JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem(historyStorageKey, JSON.stringify(history)); }, [history]);

  const filtered = useMemo(() => {
    const nq = dq.trim().toLowerCase();
    const nt = dt.trim().toLowerCase();
    return sortPalettes(library, sort).filter((r) => {
      const hay = [r.name, r.collection, r.mode, ...r.colors, ...r.tags].join(" ").toLowerCase();
      return (!nq || hay.includes(nq)) && (!nt || r.tags.some((t) => t.toLowerCase().includes(nt)));
    });
  }, [dq, dt, library, sort]);

  function save() {
    const r = createRecord(palette.colors, palette.mode, `Palette ${library.length + 1}`, true);
    setLibrary((c) => [r, ...c.filter((i) => paletteSignature(i.colors) !== paletteSignature(r.colors))]);
    setHistory((h) => [r, ...h].slice(0, 40));
    palette.announce("Saved to library");
  }

  function load(r: PaletteRecord) {
    const c = createPalette(r.colors, r.colors.length).map((x, i) => ({ ...x, alpha: r.alphas[i] ?? 100 }));
    palette.setPalette(c, r.mode, `${r.name} loaded`);
    setLibrary((l) => l.map((x) => x.id === r.id ? { ...x, usedAt: new Date().toISOString() } : x));
  }

  function updateRecord(id: string, u: Partial<PaletteRecord>) { setLibrary((l) => l.map((r) => r.id === id ? { ...r, ...u, updatedAt: new Date().toISOString() } : r)); }

  async function copyText(v: string, l: string) { try { await navigator.clipboard.writeText(v); palette.announce(`${l} copied`); } catch {} }
  function dl(fn: string, c: string, t = "text/plain") { const u = URL.createObjectURL(new Blob([c], { type: t })); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); palette.announce(`${fn} downloaded`); }
  function dlPng() {
    const can = document.createElement("canvas"); can.width = 1400; can.height = 840; const ctx = can.getContext("2d");
    if (!ctx) return; drawSwatches(ctx, can.width, can.height, palette.paletteHex);
    can.toBlob((b) => { if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "swatches.png"; a.click(); URL.revokeObjectURL(u); palette.announce("PNG downloaded"); });
  }
  function dlPdf() { dl("palette-sheet.pdf", createSimplePdf(palette.paletteHex), "application/pdf"); }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); palette.generate(); }
      if (e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  });

  return <section className="py-4 space-y-10">
    {/* Current palette strip */}
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-wrap">
        <span className="section-title shrink-0">Current</span>
        {palette.paletteHex.map((hex, i) => (
          <button key={`${hex}-${i}`} className="flex items-center gap-1.5 text-xs shrink-0" type="button" onClick={() => copyText(hex, hex)}>
            <span className="size-4 rounded-full border border-[var(--border-default)]" style={{ backgroundColor: hex }} />
            <span className="font-mono font-semibold">{hex}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button className="pill pill-primary text-xs" onClick={palette.generate}>Generate</button>
        <button className="pill pill-secondary text-xs" onClick={save}>Save</button>
        <button className="pill pill-secondary text-xs" disabled={palette.undoStack.length === 0} onClick={palette.undo}>Undo</button>
        <span className="text-xs text-[var(--text-muted)]">{score}/100</span>
        <span className="text-xs text-[var(--text-muted)]">{palette.notice}</span>
      </div>
    </div>

    {/* Export */}
    <section>
      <div className="flex flex-wrap gap-2 mb-3">
        {exportFormats.map((f) => <button key={f} className={`chip ${activeFormat === f ? "chip-active" : ""}`} onClick={() => setActiveFormat(f)}>{f}</button>)}
      </div>
      <pre className="max-h-40 overflow-auto rounded-2xl bg-[var(--bg-surface-muted)] p-4 text-xs leading-relaxed"><code>{exportSnippets[activeFormat]}</code></pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="pill pill-secondary text-xs" onClick={() => copyText(exportSnippets[activeFormat], `${activeFormat}`)}>Copy</button>
        <button className="pill pill-secondary text-xs" onClick={() => dl(`palette.${extensionFor(activeFormat)}`, exportSnippets[activeFormat])}>Download</button>
        <button className="pill pill-secondary text-xs" onClick={dlPng}>PNG</button>
        <button className="pill pill-secondary text-xs" onClick={dlPdf}>PDF</button>
        <button className="pill pill-secondary text-xs" onClick={() => dl("palette.svg", exportSnippets.SVG, "image/svg+xml")}>SVG</button>
      </div>
    </section>

    {/* Library */}
    <section>
      <h2 className="text-xl font-bold mb-1">Library</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{library.length} saved</p>
      <div className="flex flex-wrap gap-3 max-w-xl mb-6">
        <input className="field flex-1 min-w-28" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="field flex-1 min-w-20" placeholder="Tags" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
        <select className="field flex-1 min-w-20" value={sort} onChange={(e) => setSort(e.target.value as LibrarySort)}>
          {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {filtered.length === 0
        ? <p className="text-sm text-[var(--text-muted)]">No matches. Generate a palette and hit Save.</p>
        : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 24).map((r) => (
              <div key={r.id} className="rounded-2xl border border-[var(--border-default)] p-3 space-y-2">
                <input className="w-full bg-transparent font-semibold outline-none text-sm" value={r.name} onChange={(e) => updateRecord(r.id, { name: e.target.value })} />
                <button className="grid w-full overflow-hidden rounded-xl" style={{ gridTemplateColumns: `repeat(${r.colors.length}, 1fr)` }} onClick={() => load(r)}>
                  {r.colors.map((h, i) => <span key={`${r.id}-${i}`} className="h-8" style={{ backgroundColor: h }} />)}
                </button>
                <input className="w-full bg-transparent text-xs text-[var(--text-muted)] outline-none" placeholder="tags" value={r.tags.join(", ")} onChange={(e) => updateRecord(r.id, { tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                <div className="flex gap-2">
                  <button className="pill pill-secondary text-xs flex-1" onClick={() => updateRecord(r.id, { favorite: !r.favorite })}>{r.favorite ? "★" : "☆"}</button>
                  <button className="pill pill-danger text-xs flex-1" onClick={() => setLibrary((c) => c.filter((x) => x.id !== r.id))}>Delete</button>
                </div>
              </div>
            ))}
          </div>
      }
    </section>

    {/* History */}
    {history.length > 0 && <section className="border-t border-[var(--border-default)] pt-6">
      <h3 className="section-title mb-3">Recent</h3>
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
  return {
    id: crypto.randomUUID(), name,
    colors: colors.map((c) => normalizeHex(c.hex) ?? "#111827"),
    alphas: colors.map((c) => c.alpha), mode, tags: [], collection: "Default",
    favorite, createdAt: now, updatedAt: now, usedAt: now,
  };
}
