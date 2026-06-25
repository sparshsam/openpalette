"use client";

/* eslint-disable react-hooks/refs -- false positive: canvasRef passed as JSX ref prop is valid React */
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { VisualizerPreview, visualizers, type Visualizer } from "@/components/studio/visualizers";
import { createSimplePdf, drawSwatches, extensionFor, tokenPreviewRows } from "@/lib/browser-exports";
import {
  createExportSnippets,
  createGradientCss,
  createGradientSvg,
  createPalette,
  decodePaletteState,
  encodePaletteState,
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

const paletteStorageKey = "openpalette.current.v1";
const libraryStorageKey = "openpalette.library.v1";
const historyStorageKey = "openpalette.history.v1";
const sorts: { label: string; value: LibrarySort }[] = [
  { label: "Recently used", value: "recent" },
  { label: "Brightness", value: "brightness" },
  { label: "Contrast", value: "contrast" },
  { label: "Warm/cool", value: "temperature" },
  { label: "Favorites", value: "favorites" },
];

type CurrentState = { colors: PaletteColor[]; mode: PaletteMode };

type Tab = "studio" | "gradient" | "visualizer" | "accessibility" | "themes" | "library";

const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "gradient", label: "Gradient" },
  { id: "visualizer", label: "Visualizer" },
  { id: "accessibility", label: "Accessibility" },
  { id: "themes", label: "Themes" },
  { id: "library", label: "Library" },
];

export function OpenPaletteApp() {
  const [colors, setColors] = useState<PaletteColor[]>(() => createPalette());
  const [mode, setMode] = useState<PaletteMode>("Analogous");
  const [library, setLibrary] = useState<PaletteRecord[]>([]);
  const [history, setHistory] = useState<PaletteRecord[]>([]);
  const [notice, setNotice] = useState("Ready");
  const [hydrated, setHydrated] = useState(false);
  const [undoStack, setUndoStack] = useState<CurrentState[]>([]);
  const [activeExportFormat, setActiveExportFormat] = useState<ExportFormat>("CSS");
  const [importText, setImportText] = useState("");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState<LibrarySort>("recent");
  const [gradientKind, setGradientKind] = useState<GradientKind>("linear");
  const [gradientAngle, setGradientAngle] = useState(90);
  const [visualizer, setVisualizer] = useState<Visualizer>("Website");
  const [visionMode, setVisionMode] = useState<VisionMode>("none");
  const [commandOpen, setCommandOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [extractionCount, setExtractionCount] = useState(5);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("balanced");
  const [activeTab, setActiveTab] = useState<Tab>("studio");
  const gradientCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const paletteHex = useMemo(() => colors.map((c) => normalizeHex(c.hex) ?? "#111827"), [colors]);
  const paletteAlphas = useMemo(() => colors.map((c) => c.alpha), [colors]);
  const deferredQuery = useDeferredValue(query);
  const deferredTagFilter = useDeferredValue(tagFilter);
  const exportSnippets = useMemo(() => createExportSnippets(paletteHex, paletteAlphas), [paletteHex, paletteAlphas]);
  const gradientCss = useMemo(() => createGradientCss(paletteHex, gradientKind, gradientAngle), [gradientAngle, gradientKind, paletteHex]);
  const gradientSvg = useMemo(() => createGradientSvg(paletteHex, gradientKind, gradientAngle), [gradientAngle, gradientKind, paletteHex]);
  const contrastHints = useMemo(() => paletteHex.map((h) => getContrastHint(h)), [paletteHex]);
  const pairContrasts = useMemo(() => getPairContrasts(paletteHex), [paletteHex]);
  const accessibilityScore = useMemo(() => getPaletteAccessibilityScore(paletteHex), [paletteHex]);
  const tokenRows = useMemo(() => tokenPreviewRows(paletteHex), [paletteHex]);
  const shareUrl = useMemo(() => {
    if (!hydrated) return "";
    const u = new URL(window.location.href);
    u.searchParams.set("palette", encodePaletteState(colors, mode));
    return u.toString();
  }, [colors, hydrated, mode]);
  const duplicateExists = useMemo(() => library.some((r) => paletteSignature(r.colors) === paletteSignature(paletteHex)), [library, paletteHex]);
  const filteredLibrary = useMemo(() => {
    const nq = deferredQuery.trim().toLowerCase();
    const nt = deferredTagFilter.trim().toLowerCase();
    return sortPalettes(library, sort).filter((r) => {
      const hay = [r.name, r.collection, r.mode, ...r.colors, ...r.tags].join(" ").toLowerCase();
      return (nq.length === 0 || hay.includes(nq)) && (nt.length === 0 || r.tags.some((t) => t.toLowerCase().includes(nt)));
    });
  }, [deferredQuery, deferredTagFilter, library, sort]);

  const announce = useCallback((msg: string) => { setNotice(msg); setTimeout(() => setNotice("Ready"), 2200); }, []);
  const pushUndo = useCallback((s: CurrentState) => setUndoStack((st) => [s, ...st].slice(0, 20)), []);
  const setPalette = useCallback((nc: PaletteColor[], nm = mode, msg = "Palette updated") => {
    pushUndo({ colors, mode }); setColors(nc); setMode(nm);
    setHistory((h) => [createRecord(nc, nm, "Snapshot", false), ...h].slice(0, 40)); announce(msg);
  }, [announce, colors, mode, pushUndo]);

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("palette");
    const sp = localStorage.getItem(paletteStorageKey);
    const sl = localStorage.getItem(libraryStorageKey);
    const sh = localStorage.getItem(historyStorageKey);
    const decoded = shared ? decodePaletteState(shared) : null;
    let nc: PaletteColor[] | null = null, nm: PaletteMode | null = null, nl: PaletteRecord[] | null = null, nh: PaletteRecord[] | null = null, ns: string | null = null;
    if (decoded) { nc = decoded.colors; nm = decoded.mode; ns = "Shared URL restored"; }
    else if (sp) try { const p = JSON.parse(sp) as CurrentState; if (Array.isArray(p.colors) && p.colors.length >= minPaletteSize) { nc = p.colors; nm = p.mode ?? "Analogous"; } } catch { localStorage.removeItem(paletteStorageKey); }
    if (sl) try { nl = JSON.parse(sl); if (!Array.isArray(nl)) nl = null; } catch { localStorage.removeItem(libraryStorageKey); }
    if (sh) try { nh = JSON.parse(sh); if (!Array.isArray(nh)) nh = null; } catch { localStorage.removeItem(historyStorageKey); }
    queueMicrotask(() => { if (nc) setColors(nc); if (nm) setMode(nm); if (nl) setLibrary(nl); if (nh) setHistory(nh); if (ns) announce(ns); setHydrated(true); });
  }, [announce]);

  useEffect(() => { if (hydrated) localStorage.setItem(paletteStorageKey, JSON.stringify({ colors, mode })); }, [colors, hydrated, mode]);
  useEffect(() => { if (hydrated) localStorage.setItem(libraryStorageKey, JSON.stringify(library)); }, [hydrated, library]);
  useEffect(() => { if (hydrated) localStorage.setItem(historyStorageKey, JSON.stringify(history)); }, [history, hydrated]);
  useEffect(() => { const c = gradientCanvasRef.current, ctx = c?.getContext("2d"); if (c && ctx) drawGradient(ctx, c.width, c.height, paletteHex, gradientKind, gradientAngle); }, [gradientAngle, gradientKind, paletteHex]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null; const ed = t?.tagName === "INPUT" || t?.tagName === "TEXTAREA";
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCommandOpen((o) => !o); return; }
      if (e.key === "Escape") { setCommandOpen(false); }
      if (ed) return;
      if (e.code === "Space") { e.preventDefault(); generate(); }
      if (e.key.toLowerCase() === "u") { e.preventDefault(); undo(); }
      if (e.key.toLowerCase() === "s") { e.preventDefault(); savePalette(); }
    };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  });

  function generate() { setPalette(generatePalette(colors, mode, colors.length), mode, `${mode} palette`); }
  function undo() { setUndoStack((s) => { const [p, ...r] = s; if (!p) { announce("Nothing to undo"); return s; } setColors(p.colors); setMode(p.mode); announce("Undone"); return r; }); }
  function savePalette() { const r = createRecord(colors, mode, `Palette ${library.length + 1}`, true); setLibrary((c) => [r, ...c.filter((i) => paletteSignature(i.colors) !== paletteSignature(r.colors))]); announce(duplicateExists ? "Updated in library" : "Saved"); }
  function updateHex(id: string, v: string) { setColors((c) => c.map((x) => x.id === id ? { ...x, hex: normalizeHex(v) ?? v.toUpperCase() } : x)); }
  function updateFromHsl(id: string, ch: "h" | "s" | "l", v: number) { setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToHsl(x.hex); return { ...x, hex: hslToHex(ch === "h" ? v : h.h, ch === "s" ? v : h.s, ch === "l" ? v : h.l) }; })); }
  function updateFromRgb(id: string, ch: "r" | "g" | "b", v: number) { setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToRgb(x.hex); return { ...x, hex: rgbToHex({ ...h, [ch]: v }) }; })); }
  function updateAlpha(id: string, a: number) { setColors((c) => c.map((x) => x.id === id ? { ...x, alpha: a } : x)); }
  function toggleLock(id: string) { setColors((c) => c.map((x) => x.id === id ? { ...x, locked: !x.locked } : x)); }
  function setPaletteSize(n: number) { setPalette(resizePalette(colors, n, mode), mode, `${n} colors`); }
  function addColor() { setPaletteSize(colors.length + 1); }
  function removeColor(id: string) { if (colors.length <= minPaletteSize) { announce("Minimum size"); return; } setPalette(colors.filter((c) => c.id !== id), mode, "Removed"); }
  function switchMode(m: PaletteMode) { setPalette(generatePalette(colors, m, colors.length), m, `${m}`); }
  function importPalette() { const p = parsePaletteInput(importText); if (p.length < minPaletteSize) { announce("Need 2+ HEX colors"); return; } setPalette(createPalette(p, p.length), mode, `Imported ${p.length}`); }
  function loadRecord(r: PaletteRecord) { const c = createPalette(r.colors, r.colors.length).map((x, i) => ({ ...x, alpha: r.alphas[i] ?? 100 })); setPalette(c, r.mode, `${r.name} loaded`); setLibrary((l) => l.map((x) => x.id === r.id ? { ...x, usedAt: new Date().toISOString() } : x)); }
  function updateRecord(id: string, u: Partial<PaletteRecord>) { setLibrary((l) => l.map((r) => r.id === id ? { ...r, ...u, updatedAt: new Date().toISOString() } : r)); }
  async function copyText(v: string, l: string) { try { await navigator.clipboard.writeText(v); announce(`${l} copied`); } catch { announce("Copy failed"); } }
  function dlText(fn: string, c: string, t = "text/plain") { const u = URL.createObjectURL(new Blob([c], { type: t })); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); announce(`${fn} downloaded`); }
  function dlPng(fn: string, v: "swatches" | "gradient") {
    const can = document.createElement("canvas"); can.width = 1400; can.height = 840; const ctx = can.getContext("2d");
    if (!ctx) { announce("PNG export failed"); return; }
    if (v === "gradient") drawGradient(ctx, can.width, can.height, paletteHex, gradientKind, gradientAngle); else drawSwatches(ctx, can.width, can.height, paletteHex);
    can.toBlob((b) => { if (!b) { announce("PNG export failed"); return; } const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); URL.revokeObjectURL(u); announce(`${fn} downloaded`); });
  }
  function dlPdf() { dlText("openpalette-sheet.pdf", createSimplePdf(paletteHex), "application/pdf"); }
  async function extractFromImage(file: File | null) {
    if (!file) return;
    try { const bm = await createImageBitmap(file); const can = document.createElement("canvas"); const ctx = can.getContext("2d", { willReadFrequently: true }); if (!ctx) { announce("Extraction unavailable"); return; }
      const ms = 180, sc = Math.min(ms / bm.width, ms / bm.height, 1); can.width = Math.max(1, Math.round(bm.width * sc)); can.height = Math.max(1, Math.round(bm.height * sc)); ctx.drawImage(bm, 0, 0, can.width, can.height);
      const ex = extractPaletteFromPixels(ctx.getImageData(0, 0, can.width, can.height).data, extractionCount, extractionMode);
      if (ex.length >= minPaletteSize) setPalette(createPalette(ex, ex.length), "Random", `Extracted ${ex.length}`); else announce("No usable colors");
    } catch { announce("Extraction failed"); }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-28">
      {/* ── Toolbar ── */}
      <section className="pt-10 sm:pt-14 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-lg">
              {activeTab === "studio" && "Generate color systems, lock decisions, tune channels, extract from images."}
              {activeTab === "gradient" && "Create linear and radial gradients from your palette."}
              {activeTab === "visualizer" && "Preview your palette as real UI patterns."}
              {activeTab === "accessibility" && "WCAG contrast checks, simulations, and readability previews."}
              {activeTab === "themes" && "Light and dark mode palette suggestions built for your palette."}
              {activeTab === "library" && "Saved palettes, history, and collection management."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span aria-live="polite" role="status" className="text-xs text-[var(--text-muted)]">{notice}</span>
            <button className="pill pill-secondary text-xs" type="button" onClick={() => setCommandOpen((o) => !o)}>⌘K</button>
            {activeTab === "studio" && <>
              <button className="pill pill-secondary text-xs" disabled={undoStack.length === 0} type="button" onClick={undo}>Undo</button>
              <button className="pill pill-primary text-xs" type="button" onClick={generate}>Generate</button>
              <button className="pill pill-secondary text-xs" type="button" onClick={savePalette}>Save</button>
              <button className="pill pill-accent-ghost text-xs" type="button" onClick={() => copyText(shareUrl, "Share URL")}>Share</button>
            </>}
          </div>
        </div>
      </section>

      {/* ── Command palette ── */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto mt-24 max-w-xs rounded-2xl bg-[var(--bg-surface)] p-4 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="section-title">Commands</span>
              <button className="pill pill-secondary text-xs" type="button" onClick={() => setCommandOpen(false)}>Esc</button>
            </div>
            <div className="space-y-1">
              {[["Generate", generate], ["Save", savePalette], ["Share URL", () => copyText(shareUrl, "Share URL")]].map(([l, a]) => (
                <button key={l as string} className="flex w-full rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-[var(--bg-surface-muted)]" type="button" onClick={() => { (a as () => void)(); setCommandOpen(false); }}>{l as string}</button>
              ))}
              {tabs.map((t) => (
                <button key={t.id} className={`flex w-full rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-[var(--bg-surface-muted)] ${activeTab === t.id ? "text-[var(--accent)]" : ""}`} type="button" onClick={() => { setActiveTab(t.id); setCommandOpen(false); }}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="min-h-[60vh]">
        {activeTab === "studio" && <StudioTab
          colors={colors} mode={mode} paletteHex={paletteHex} paletteAlphas={paletteAlphas}
          contrastHints={contrastHints} visionMode={visionMode} advancedOpen={advancedOpen}
          onUpdateHex={updateHex} onUpdateHsl={updateFromHsl} onUpdateRgb={updateFromRgb}
          onUpdateAlpha={updateAlpha} onToggleLock={toggleLock} onRemove={removeColor}
          onAdd={addColor} onSwitchMode={switchMode} onSetSize={setPaletteSize}
          onSetAdvanced={setAdvancedOpen} onCopy={copyText}
          importText={importText} onImportText={setImportText}
          extractionCount={extractionCount} extractionMode={extractionMode}
          onExtractionCount={setExtractionCount} onExtractionMode={setExtractionMode}
          onExtract={extractFromImage} onImport={importPalette}
        />}

        {activeTab === "gradient" && <GradientTab
          gradientKind={gradientKind} gradientAngle={gradientAngle}
          gradientCss={gradientCss} gradientSvg={gradientSvg}
          canvasRef={gradientCanvasRef}
          onKind={setGradientKind} onAngle={setGradientAngle}
          onCopy={copyText}
          onDownloadPng={() => dlPng("openpalette-gradient.png", "gradient")}
          onDownloadSvg={() => dlText("openpalette-gradient.svg", gradientSvg, "image/svg+xml")}
        />}

        {activeTab === "visualizer" && <VisualizerTab
          visualizer={visualizer} paletteHex={paletteHex} gradientCss={gradientCss}
          onVisualizer={setVisualizer}
        />}

        {activeTab === "accessibility" && <AccessibilityTab
          paletteHex={paletteHex} contrastHints={contrastHints}
          pairContrasts={pairContrasts} accessibilityScore={accessibilityScore}
          visionMode={visionMode} onVisionMode={setVisionMode}
        />}

        {activeTab === "themes" && <ThemesTab
          paletteHex={paletteHex} mode={mode} colors={colors}
          onSetPalette={setPalette}
        />}

        {activeTab === "library" && <LibraryTab
          library={filteredLibrary} rawCount={library.length} history={history}
          paletteHex={paletteHex} duplicateExists={duplicateExists}
          accessibilityScore={accessibilityScore} paletteAlphas={paletteAlphas}
          exportSnippets={exportSnippets} activeExportFormat={activeExportFormat}
          tokenRows={tokenRows} exportFormats={exportFormats}
          query={query} tagFilter={tagFilter} sort={sort} sorts={sorts}
          onQuery={setQuery} onTagFilter={setTagFilter} onSort={setSort}
          onLoad={loadRecord} onDelete={(id) => setLibrary((c) => c.filter((r) => r.id !== id))}
          onRename={(r, n) => updateRecord(r.id, { name: n })}
          onFavorite={(r) => updateRecord(r.id, { favorite: !r.favorite })}
          onTags={(r, t) => updateRecord(r.id, { tags: t.split(",").map((s) => s.trim()).filter(Boolean) })}
          onCopy={copyText} onExportFormat={setActiveExportFormat}
          onDownloadText={dlText} onDownloadPng={() => dlPng("openpalette-swatches.png", "swatches")}
          onDownloadPdf={dlPdf}
        />}
      </div>

      {/* ── Floating tab nav ── */}
      <nav className="tab-nav overflow-x-auto max-w-[95vw]" aria-label="Feature tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? "tab-btn-active" : ""}`} type="button" onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ════════════════════════════════════════════
   STUDIO TAB
   ════════════════════════════════════════════ */

function StudioTab(props: {
  colors: PaletteColor[]; mode: PaletteMode; paletteHex: string[]; paletteAlphas: number[];
  contrastHints: ReturnType<typeof getContrastHint>[]; visionMode: VisionMode; advancedOpen: boolean;
  onUpdateHex: (id: string, v: string) => void; onUpdateHsl: (id: string, ch: "h" | "s" | "l", v: number) => void;
  onUpdateRgb: (id: string, ch: "r" | "g" | "b", v: number) => void; onUpdateAlpha: (id: string, a: number) => void;
  onToggleLock: (id: string) => void; onRemove: (id: string) => void; onAdd: () => void;
  onSwitchMode: (m: PaletteMode) => void; onSetSize: (n: number) => void; onSetAdvanced: (o: boolean) => void;
  onCopy: (v: string, l: string) => void;
  importText: string; onImportText: (s: string) => void;
  extractionCount: number; extractionMode: ExtractionMode;
  onExtractionCount: (n: number) => void; onExtractionMode: (m: ExtractionMode) => void;
  onExtract: (f: File | null) => void; onImport: () => void;
}) {
  const { colors, mode, paletteHex, paletteAlphas, contrastHints, visionMode, advancedOpen } = props;

  return <div className="space-y-8 py-4">
    {/* Mode strip */}
    <div className="data-strip">
      <div className="flex flex-wrap gap-1.5">
        {paletteModes.map((m) => (
          <button key={m} className={`chip ${mode === m ? "chip-active" : ""}`} type="button" onClick={() => props.onSwitchMode(m)}>{m}</button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
        Size: {colors.length}
        <input className="w-20" min={minPaletteSize} max={maxPaletteSize} type="range" value={colors.length} onChange={(e) => props.onSetSize(Number(e.target.value))} />
      </label>
      <div className="flex gap-1">
        <button className="pill pill-secondary text-xs" disabled={colors.length <= minPaletteSize} type="button" onClick={() => props.onSetSize(colors.length - 1)}>−</button>
        <button className="pill pill-secondary text-xs" disabled={colors.length >= maxPaletteSize} type="button" onClick={props.onAdd}>+</button>
      </div>
      <button className="pill pill-accent-ghost text-xs" type="button" onClick={() => props.onSetAdvanced(!advancedOpen)}>
        {advancedOpen ? "Hide channels" : "Channels"}
      </button>
    </div>

    {/* Swatches */}
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border border-[var(--border-default)] rounded-2xl overflow-hidden">
      {colors.map((color, idx) => {
        const nh = normalizeHex(color.hex) ?? "#111827";
        const sh = simulateVision(nh, visionMode);
        const tc = getReadableTextColor(sh);
        const hi = contrastHints[idx];
        const hsl = hexToHsl(nh);
        const rgb = hexToRgb(nh);
        return <article key={color.id} className="group flex flex-col justify-between min-h-[300px] p-4" style={{ backgroundColor: sh, color: tc }}>
          <div className="flex items-center justify-between gap-1">
            <span className="swatch-action">{String(idx + 1).padStart(2, "0")}</span>
            <div className="flex gap-1">
              <button className="swatch-action" type="button" onClick={() => props.onToggleLock(color.id)}>{color.locked ? "🔒" : "🔓"}</button>
              <button className="swatch-action" disabled={colors.length <= minPaletteSize} type="button" onClick={() => props.onRemove(color.id)}>✕</button>
            </div>
          </div>
          <div className="space-y-2.5 mt-auto">
            <input aria-label={`Color ${idx + 1} picker`} className="h-9 w-full cursor-pointer rounded-full border border-white/30 bg-transparent" type="color" value={nh} onChange={(e) => props.onUpdateHex(color.id, e.target.value)} />
            <input className="w-full rounded-full border border-white/30 bg-white/20 px-3 py-2 font-mono text-sm font-semibold text-center uppercase outline-none focus:border-white" value={color.hex} spellCheck={false} onChange={(e) => props.onUpdateHex(color.id, e.target.value)} />
            {advancedOpen && <>
              <div className="grid grid-cols-3 gap-1">
                {(["h","s","l"] as const).map((ch) => <label key={ch} className="block text-[10px] font-bold tracking-wider uppercase text-center">{ch}<input className="w-full rounded-full bg-white/20 px-2 py-1.5 text-xs font-semibold text-center outline-none" max={ch==="h"?360:100} min={0} type="number" value={hsl[ch]} onChange={(e) => props.onUpdateHsl(color.id, ch, Number(e.target.value))} /></label>)}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(["r","g","b"] as const).map((ch) => <label key={ch} className="block text-[10px] font-bold tracking-wider uppercase text-center">{ch}<input className="w-full rounded-full bg-white/20 px-2 py-1.5 text-xs font-semibold text-center outline-none" max={255} min={0} type="number" value={rgb[ch]} onChange={(e) => props.onUpdateRgb(color.id, ch, Number(e.target.value))} /></label>)}
              </div>
            </>}
            <label className="flex items-center gap-2 text-xs font-semibold">Alpha {color.alpha}%<input className="flex-1" min={0} max={100} type="range" value={color.alpha} onChange={(e) => props.onUpdateAlpha(color.id, Number(e.target.value))} /></label>
            <div className="grid grid-cols-2 gap-1">
              <button className="swatch-action text-center" type="button" onClick={() => props.onCopy(nh, "HEX")}>HEX</button>
              <button className="swatch-action text-center" type="button" onClick={() => props.onCopy(`rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${color.alpha}%)`, "RGB")}>RGB</button>
              <button className="swatch-action text-center" type="button" onClick={() => props.onCopy(`hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${color.alpha}%)`, "HSL")}>HSL</button>
              <button className="swatch-action text-center" type="button" onClick={() => props.onCopy(`--color-${idx+1}: ${nh};`, "Var")}>Var</button>
            </div>
            <p className="text-[11px] font-semibold text-center opacity-80">{hi.rating} · {hi.ratio.toFixed(1)}:1</p>
          </div>
        </article>;
      })}
    </section>

    {/* Import */}
    <section>
      <h2 className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-3">Import</h2>
      <div className="max-w-xl space-y-3">
        <textarea className="w-full rounded-2xl bg-[var(--bg-surface-muted)] p-4 font-mono text-sm min-h-[80px] outline-none" placeholder="Paste HEX, JSON, CSS variables..." value={props.importText} onChange={(e) => props.onImportText(e.target.value)} />
        <div className="flex gap-2">
          <button className="pill pill-primary text-xs" type="button" onClick={props.onImport}>Import</button>
          <div className="rounded-2xl py-2 px-4 bg-[var(--bg-surface-muted)] text-xs flex items-center cursor-pointer" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); props.onExtract(e.dataTransfer.files.item(0)); }}>
            <label className="cursor-pointer"><span className="font-semibold text-[var(--text-primary)]">Drop image</span> or <span className="underline decoration-[var(--accent)]">browse</span><input accept="image/*" className="hidden" type="file" onChange={(e) => props.onExtract(e.target.files?.item(0) ?? null)} /></label>
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">Colors: {props.extractionCount}<input className="w-16" min={minPaletteSize} max={maxPaletteSize} type="range" value={props.extractionCount} onChange={(e) => props.onExtractionCount(Number(e.target.value))} /></label>
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">Mode<select className="field text-xs w-auto" value={props.extractionMode} onChange={(e) => props.onExtractionMode(e.target.value as ExtractionMode)}><option value="balanced">Balanced</option><option value="vibrant">Vibrant</option><option value="muted">Muted</option></select></label>
        </div>
      </div>
    </section>
  </div>;
}

/* ════════════════════════════════════════════
   GRADIENT TAB
   ════════════════════════════════════════════ */

function GradientTab(props: {
  gradientKind: GradientKind; gradientAngle: number;
  gradientCss: string; gradientSvg: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onKind: (k: GradientKind) => void; onAngle: (a: number) => void;
  onCopy: (v: string, l: string) => void;
  onDownloadPng: () => void; onDownloadSvg: () => void;
}) {
  return <div className="py-4 space-y-6">
    <div className="flex flex-wrap items-center gap-3">
      {(["linear", "radial"] as const).map((k) => <button key={k} className={`chip ${props.gradientKind === k ? "chip-active" : ""}`} type="button" onClick={() => props.onKind(k)}>{k}</button>)}
      {props.gradientKind === "linear" && <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">Angle {props.gradientAngle}°<input className="w-20" max={360} min={0} type="range" value={props.gradientAngle} onChange={(e) => props.onAngle(Number(e.target.value))} /></label>}
    </div>
    <canvas ref={props.canvasRef} className="w-full h-48 sm:h-56 rounded-2xl border border-[var(--border-default)]" width={1200} height={420} />
    <div className="flex flex-wrap gap-2">
      <button className="pill pill-secondary text-xs" type="button" onClick={() => props.onCopy(props.gradientCss, "CSS")}>Copy CSS</button>
      <button className="pill pill-secondary text-xs" type="button" onClick={() => props.onCopy(props.gradientSvg, "SVG")}>Copy SVG</button>
      <button className="pill pill-secondary text-xs" type="button" onClick={() => props.onDownloadPng()}>Download PNG</button>
      <button className="pill pill-secondary text-xs" type="button" onClick={() => props.onDownloadSvg()}>Download SVG</button>
    </div>
  </div>;
}

/* ════════════════════════════════════════════
   VISUALIZER TAB
   ════════════════════════════════════════════ */

function VisualizerTab(props: {
  visualizer: Visualizer; paletteHex: string[]; gradientCss: string;
  onVisualizer: (v: Visualizer) => void;
}) {
  return <div className="py-4 space-y-6">
    <div className="flex flex-wrap gap-2">
      {visualizers.map((v) => <button key={v} className={`chip ${props.visualizer === v ? "chip-active" : ""}`} type="button" onClick={() => props.onVisualizer(v)}>{v}</button>)}
    </div>
    <div className="rounded-2xl border border-[var(--border-default)] p-6 bg-[var(--bg-surface)]">
      <VisualizerPreview active={props.visualizer} colors={props.paletteHex} gradient={props.gradientCss} />
    </div>
  </div>;
}

/* ════════════════════════════════════════════
   ACCESSIBILITY TAB
   ════════════════════════════════════════════ */

function AccessibilityTab(props: {
  paletteHex: string[];
  contrastHints: ReturnType<typeof getContrastHint>[];
  pairContrasts: { foreground: string; background: string; ratio: number }[];
  accessibilityScore: number;
  visionMode: VisionMode; onVisionMode: (m: VisionMode) => void;
}) {
  const weakest = props.pairContrasts[0];
  const replacement = weakest ? suggestAccessibleReplacement(weakest.foreground, weakest.background) : "#000000";
  return <div className="py-4 space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
        Simulation<select className="field text-xs w-auto" value={props.visionMode} onChange={(e) => props.onVisionMode(e.target.value as VisionMode)}>
          <option value="none">None</option>
          <option value="protanopia">Protanopia</option>
          <option value="deuteranopia">Deuteranopia</option>
          <option value="tritanopia">Tritanopia</option>
        </select>
      </label>
      <span className="pill pill-accent-ghost text-sm font-bold">{props.accessibilityScore}/100</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {props.paletteHex.slice(0, 3).map((hex) => {
        const h = getContrastHint(hex);
        return <div key={hex} className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: hex, color: getReadableTextColor(hex) }}>
          <p className="text-sm font-semibold">Readable text</p>
          <p className="text-xs opacity-70">{h.rating} · {h.ratio.toFixed(2)}:1</p>
        </div>;
      })}
    </div>
    {weakest && <div className="text-sm text-[var(--text-secondary)]">
      <p><span className="font-semibold text-[var(--text-primary)]">Weakest pair:</span> {weakest.foreground} on {weakest.background} · {weakest.ratio.toFixed(2)}:1</p>
      <p className="mt-1">Suggested: <span className="font-mono text-[var(--accent)]">{replacement}</span></p>
    </div>}
    <div className="border-t border-[var(--border-default)] pt-8">
      <h3 className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-4">Pair contrast matrix</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {props.pairContrasts.slice(0, 8).map((p, i) => <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-[var(--border-default)]">
          <span className="size-5 rounded-full border" style={{ backgroundColor: p.foreground }} />
          <span className="text-xs opacity-60">on</span>
          <span className="size-5 rounded-full border" style={{ backgroundColor: p.background }} />
          <span className="font-mono text-xs font-semibold ml-auto">{p.ratio.toFixed(2)}:1</span>
        </div>)}
      </div>
    </div>
  </div>;
}

/* ════════════════════════════════════════════
   THEMES TAB — NEW FEATURE
   ════════════════════════════════════════════ */

function ThemesTab(props: {
  paletteHex: string[]; mode: PaletteMode; colors: PaletteColor[];
  onSetPalette: (colors: PaletteColor[], mode: PaletteMode, msg: string) => void;
}) {
  // Curated theme palettes for light and dark mode
  const themeSets: { name: string; description: string; theme: "light" | "dark"; colors: { name: string; hex: string; role: string }[] }[] = [
    { name: "Rose Garden", description: "Warm, romantic light palette with pink undertones.", theme: "light",
      colors: [
        { name: "Background", hex: "#fff5fc", role: "bg-base" },
        { name: "Surface", hex: "#fae8f3", role: "bg-surface" },
        { name: "Accent", hex: "#ff66c4", role: "accent" },
        { name: "Text", hex: "#3a0d2b", role: "text-primary" },
        { name: "Muted", hex: "#8a6a7e", role: "text-muted" },
      ]},
    { name: "Noir Pink", description: "Dark, moody palette with electric pink pop.", theme: "dark",
      colors: [
        { name: "Background", hex: "#12000d", role: "bg-base" },
        { name: "Surface", hex: "#1f0a18", role: "bg-surface" },
        { name: "Accent", hex: "#ff66c4", role: "accent" },
        { name: "Text", hex: "#ffe0f5", role: "text-primary" },
        { name: "Muted", hex: "#8a6a7e", role: "text-muted" },
      ]},
    { name: "Ocean Depth", description: "Cool blue-green light palette for serene UIs.", theme: "light",
      colors: [
        { name: "Background", hex: "#f0faff", role: "bg-base" },
        { name: "Surface", hex: "#dff4fe", role: "bg-surface" },
        { name: "Accent", hex: "#0088cc", role: "accent" },
        { name: "Text", hex: "#002b3d", role: "text-primary" },
        { name: "Muted", hex: "#607d8b", role: "text-muted" },
      ]},
    { name: "Deep Ocean", description: "Dark marine palette for focused interfaces.", theme: "dark",
      colors: [
        { name: "Background", hex: "#00101a", role: "bg-base" },
        { name: "Surface", hex: "#001e30", role: "bg-surface" },
        { name: "Accent", hex: "#0099ff", role: "accent" },
        { name: "Text", hex: "#e0f0ff", role: "text-primary" },
        { name: "Muted", hex: "#5a7d8a", role: "text-muted" },
      ]},
    { name: "Amber Glow", description: "Warm amber light palette, cozy and productive.", theme: "light",
      colors: [
        { name: "Background", hex: "#fffbf0", role: "bg-base" },
        { name: "Surface", hex: "#fff3d6", role: "bg-surface" },
        { name: "Accent", hex: "#ff8c00", role: "accent" },
        { name: "Text", hex: "#1a1200", role: "text-primary" },
        { name: "Muted", hex: "#8a7a5a", role: "text-muted" },
      ]},
    { name: "Ember Night", description: "Dark palette with warm amber accent.", theme: "dark",
      colors: [
        { name: "Background", hex: "#0d0800", role: "bg-base" },
        { name: "Surface", hex: "#1a1200", role: "bg-surface" },
        { name: "Accent", hex: "#ff8c00", role: "accent" },
        { name: "Text", hex: "#fff5e0", role: "text-primary" },
        { name: "Muted", hex: "#8a7a5a", role: "text-muted" },
      ]},
    { name: "Forest Calm", description: "Earthy green light palette, natural and restful.", theme: "light",
      colors: [
        { name: "Background", hex: "#f5fff2", role: "bg-base" },
        { name: "Surface", hex: "#e8f5e0", role: "bg-surface" },
        { name: "Accent", hex: "#2e7d32", role: "accent" },
        { name: "Text", hex: "#002400", role: "text-primary" },
        { name: "Muted", hex: "#5a7a5a", role: "text-muted" },
      ]},
    { name: "Cyberpunk", description: "Neon dark palette with electric blue-purple accent.", theme: "dark",
      colors: [
        { name: "Background", hex: "#0a0014", role: "bg-base" },
        { name: "Surface", hex: "#160028", role: "bg-surface" },
        { name: "Accent", hex: "#8844ff", role: "accent" },
        { name: "Text", hex: "#f0e0ff", role: "text-primary" },
        { name: "Muted", hex: "#7a6a8a", role: "text-muted" },
      ]},
    { name: "Monochrome", description: "Clean grayscale light palette for data-heavy UIs.", theme: "light",
      colors: [
        { name: "Background", hex: "#ffffff", role: "bg-base" },
        { name: "Surface", hex: "#f5f5f5", role: "bg-surface" },
        { name: "Accent", hex: "#555555", role: "accent" },
        { name: "Text", hex: "#111111", role: "text-primary" },
        { name: "Muted", hex: "#8a8a8a", role: "text-muted" },
      ]},
    { name: "Graphite", description: "Dark gray palette, minimal and high contrast.", theme: "dark",
      colors: [
        { name: "Background", hex: "#0d0d0d", role: "bg-base" },
        { name: "Surface", hex: "#1a1a1a", role: "bg-surface" },
        { name: "Accent", hex: "#aaaaaa", role: "accent" },
        { name: "Text", hex: "#ffffff", role: "text-primary" },
        { name: "Muted", hex: "#8a8a8a", role: "text-muted" },
      ]},
  ];

  return <div className="py-4 space-y-8">
    <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
      Choose from curated light and dark mode color palettes below. Each palette defines a complete
      theme system — background, surface, accent, text, and muted tones that work together. Click any
      palette to load its colors into your studio.
    </p>

    {/* Light themes */}
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-base">☀️</span> Light Themes
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {themeSets.filter((t) => t.theme === "light").map((set) => (
          <button key={set.name} type="button" onClick={() => {
            const newColors = set.colors.map((c) => ({ id: crypto.randomUUID(), hex: c.hex, alpha: 100, locked: false }));
            const mode = "Custom" as PaletteMode;
            props.onSetPalette(newColors, mode, `${set.name} loaded`);
          }} className="rounded-2xl border border-[var(--border-default)] p-4 text-left hover:border-[var(--accent)] transition-all group">
            <div className="flex gap-2 mb-3">
              {set.colors.map((c) => <span key={c.hex} className="h-8 flex-1 rounded-lg border border-[var(--border-default)]" style={{ backgroundColor: c.hex }} />)}
            </div>
            <p className="font-semibold text-sm">{set.name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{set.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {set.colors.map((c) => <span key={c.name} className="text-[10px] text-[var(--text-secondary)]"><span className="font-mono font-semibold">{c.hex}</span> <span className="opacity-60">{c.role}</span></span>).reduce((acc, el) => acc.length ? [...acc, <span key={`sep-${el.key}`} className="text-[var(--border-default)]">·</span>, el] : [el], [] as React.ReactNode[])}
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* Dark themes */}
    <div className="border-t border-[var(--border-default)] pt-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-base">🌙</span> Dark Themes
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {themeSets.filter((t) => t.theme === "dark").map((set) => (
          <button key={set.name} type="button" onClick={() => {
            const newColors = set.colors.map((c) => ({ id: crypto.randomUUID(), hex: c.hex, alpha: 100, locked: false }));
            const mode = "Custom" as PaletteMode;
            props.onSetPalette(newColors, mode, `${set.name} loaded`);
          }} className="rounded-2xl border border-[var(--border-default)] p-4 text-left hover:border-[var(--accent)] transition-all group">
            <div className="flex gap-2 mb-3">
              {set.colors.map((c) => <span key={c.hex} className="h-8 flex-1 rounded-lg border border-[var(--border-default)]" style={{ backgroundColor: c.hex }} />)}
            </div>
            <p className="font-semibold text-sm">{set.name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{set.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {set.colors.map((c) => <span key={c.name} className="text-[10px] text-[var(--text-secondary)]"><span className="font-mono font-semibold">{c.hex}</span> <span className="opacity-60">{c.role}</span></span>).reduce((acc, el) => acc.length ? [...acc, <span key={`sep-${el.key}`} className="text-[var(--border-default)]">·</span>, el] : [el], [] as React.ReactNode[])}
            </div>
          </button>
        ))}
      </div>
    </div>

    <p className="text-xs text-[var(--text-muted)] italic">
      Palettes set your color values but do not change the app&#39;s theme. Use the header toggle to switch between light and dark mode.
    </p>
  </div>;
}

/* ════════════════════════════════════════════
   LIBRARY + EXPORTS TAB
   ════════════════════════════════════════════ */

function LibraryTab(props: {
  library: PaletteRecord[]; rawCount: number; history: PaletteRecord[];
  paletteHex: string[]; duplicateExists: boolean; accessibilityScore: number; paletteAlphas: number[];
  exportSnippets: Record<string, string>; activeExportFormat: ExportFormat;
  tokenRows: ReturnType<typeof tokenPreviewRows>; exportFormats: readonly ExportFormat[];
  query: string; tagFilter: string; sort: LibrarySort; sorts: { label: string; value: LibrarySort }[];
  onQuery: (q: string) => void; onTagFilter: (t: string) => void; onSort: (s: LibrarySort) => void;
  onLoad: (r: PaletteRecord) => void; onDelete: (id: string) => void;
  onRename: (r: PaletteRecord, n: string) => void; onFavorite: (r: PaletteRecord) => void;
  onTags: (r: PaletteRecord, t: string) => void;
  onCopy: (v: string, l: string) => void; onExportFormat: (f: ExportFormat) => void;
  onDownloadText: (fn: string, c: string, t?: string) => void; onDownloadPng: () => void; onDownloadPdf: () => void;
}) {
  return <div className="py-4 space-y-10">
    {/* Export */}
    <section>
      <h2 className="text-xl font-bold mb-2">Export</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Copy or download your palette tokens.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {props.exportFormats.map((f) => <button key={f} className={`chip ${props.activeExportFormat === f ? "chip-active" : ""}`} type="button" onClick={() => props.onExportFormat(f)}>{f}</button>)}
      </div>
      <pre className="max-h-48 overflow-auto rounded-2xl bg-[var(--bg-surface-muted)] p-4 text-xs leading-relaxed"><code>{props.exportSnippets[props.activeExportFormat]}</code></pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="pill pill-secondary text-xs" type="button" onClick={() => props.onCopy(props.exportSnippets[props.activeExportFormat], `${props.activeExportFormat} export`)}>Copy</button>
        <button className="pill pill-secondary text-xs" type="button" onClick={() => props.onDownloadText(`openpalette.${extensionFor(props.activeExportFormat)}`, props.exportSnippets[props.activeExportFormat])}>Download</button>
        <button className="pill pill-secondary text-xs" type="button" onClick={props.onDownloadPng}>PNG</button>
        <button className="pill pill-secondary text-xs" type="button" onClick={props.onDownloadPdf}>PDF</button>
        <button className="pill pill-secondary text-xs" type="button" onClick={() => props.onDownloadText("openpalette.svg", props.exportSnippets.SVG, "image/svg+xml")}>SVG</button>
      </div>
    </section>

    {/* Current palette strip */}
    <div className="data-strip py-3">
      <span className="section-title shrink-0">Current</span>
      {props.paletteHex.map((hex, i) => (
        <button key={`${hex}-${i}`} className="flex items-center gap-1.5 text-xs" type="button" onClick={() => props.onCopy(hex, hex)}>
          <span className="size-4 rounded-full border border-[var(--border-default)]" style={{ backgroundColor: hex }} />
          <span className="font-mono font-semibold">{hex}</span>
        </button>
      ))}
      <span className="text-xs text-[var(--text-muted)]">{props.duplicateExists ? "Saved" : `${props.accessibilityScore}/100`}</span>
    </div>

    {/* Library */}
    <section>
      <h2 className="text-xl font-bold mb-1">Library</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{props.rawCount} saved palettes</p>
      <div className="flex flex-wrap gap-3 max-w-xl mb-6">
        <input className="field flex-1 min-w-28" placeholder="Search" value={props.query} onChange={(e) => props.onQuery(e.target.value)} />
        <input className="field flex-1 min-w-20" placeholder="Tags" value={props.tagFilter} onChange={(e) => props.onTagFilter(e.target.value)} />
        <select className="field flex-1 min-w-20" value={props.sort} onChange={(e) => props.onSort(e.target.value as LibrarySort)}>
          {props.sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {props.library.length === 0
        ? <p className="text-sm text-[var(--text-muted)]">No matches. Generate and save a palette to build your collection.</p>
        : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {props.library.slice(0, 24).map((r) => (
              <div key={r.id} className="rounded-2xl border border-[var(--border-default)] p-4 space-y-3">
                <input className="w-full bg-transparent font-semibold outline-none text-sm" value={r.name} onChange={(e) => props.onRename(r, e.target.value)} />
                <button className="grid w-full overflow-hidden rounded-xl" style={{ gridTemplateColumns: `repeat(${r.colors.length}, 1fr)` }} type="button" onClick={() => props.onLoad(r)}>
                  {r.colors.map((h, i) => <span key={`${r.id}-${i}`} className="h-9" style={{ backgroundColor: h }} />)}
                </button>
                <input className="w-full bg-transparent text-xs text-[var(--text-muted)] outline-none" placeholder="tags, comma separated" value={r.tags.join(", ")} onChange={(e) => props.onTags(r, e.target.value)} />
                <div className="flex gap-2">
                  <button className="pill pill-secondary text-xs flex-1" type="button" onClick={() => props.onFavorite(r)}>{r.favorite ? "★" : "☆"}</button>
                  <button className="pill pill-danger text-xs flex-1" type="button" onClick={() => props.onDelete(r.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
      }
    </section>

    {/* History */}
    {props.history.length > 0 && <section className="border-t border-[var(--border-default)] pt-8">
      <h3 className="section-title mb-4">Recent</h3>
      <div className="grid gap-2 sm:grid-cols-5">
        {props.history.slice(0, 10).map((r) => (
          <button key={r.id} className="flex items-center gap-2 text-xs" type="button" onClick={() => props.onLoad(r)}>
            <span className="flex-1 grid grid-flow-col overflow-hidden rounded-md">{r.colors.map((h, i) => <span key={`${r.id}-h-${i}`} className="h-5" style={{ backgroundColor: h }} />)}</span>
            <span className="text-[var(--text-muted)]">{r.mode}</span>
          </button>
        ))}
      </div>
    </section>}
  </div>;
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
