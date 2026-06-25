"use client";

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [extractionCount, setExtractionCount] = useState(5);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("balanced");
  const gradientCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const paletteHex = useMemo(() => colors.map((color) => normalizeHex(color.hex) ?? "#111827"), [colors]);
  const paletteAlphas = useMemo(() => colors.map((color) => color.alpha), [colors]);
  const deferredQuery = useDeferredValue(query);
  const deferredTagFilter = useDeferredValue(tagFilter);
  const exportSnippets = useMemo(() => createExportSnippets(paletteHex, paletteAlphas), [paletteHex, paletteAlphas]);
  const gradientCss = useMemo(
    () => createGradientCss(paletteHex, gradientKind, gradientAngle),
    [gradientAngle, gradientKind, paletteHex],
  );
  const gradientSvg = useMemo(
    () => createGradientSvg(paletteHex, gradientKind, gradientAngle),
    [gradientAngle, gradientKind, paletteHex],
  );
  const contrastHints = useMemo(() => paletteHex.map((hex) => getContrastHint(hex)), [paletteHex]);
  const pairContrasts = useMemo(() => getPairContrasts(paletteHex), [paletteHex]);
  const accessibilityScore = useMemo(() => getPaletteAccessibilityScore(paletteHex), [paletteHex]);
  const tokenRows = useMemo(() => tokenPreviewRows(paletteHex), [paletteHex]);
  const shareUrl = useMemo(() => {
    if (!hydrated) return "";
    const url = new URL(window.location.href);
    url.searchParams.set("palette", encodePaletteState(colors, mode));
    return url.toString();
  }, [colors, hydrated, mode]);
  const duplicateExists = useMemo(
    () => library.some((record) => paletteSignature(record.colors) === paletteSignature(paletteHex)),
    [library, paletteHex],
  );
  const filteredLibrary = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const normalizedTag = deferredTagFilter.trim().toLowerCase();
    return sortPalettes(library, sort).filter((record) => {
      const haystack = [record.name, record.collection, record.mode, record.colors.join(" "), record.tags.join(" ")]
        .join(" ")
        .toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      const matchesTag = normalizedTag.length === 0 || record.tags.some((tag) => tag.toLowerCase().includes(normalizedTag));
      return matchesQuery && matchesTag;
    });
  }, [deferredQuery, deferredTagFilter, library, sort]);

  const announce = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice("Ready"), 2200);
  }, []);

  const pushUndo = useCallback((state: CurrentState) => {
    setUndoStack((stack) => [state, ...stack].slice(0, 20));
  }, []);

  const setPalette = useCallback(
    (nextColors: PaletteColor[], nextMode = mode, message = "Palette updated") => {
      pushUndo({ colors, mode });
      setColors(nextColors);
      setMode(nextMode);
      setHistory((current) => [createRecord(nextColors, nextMode, "History snapshot", false), ...current].slice(0, 40));
      announce(message);
    },
    [announce, colors, mode, pushUndo],
  );

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("palette");
    const storedPalette = window.localStorage.getItem(paletteStorageKey);
    const storedLibrary = window.localStorage.getItem(libraryStorageKey);
    const storedHistory = window.localStorage.getItem(historyStorageKey);
    const decoded = shared ? decodePaletteState(shared) : null;
    let nextColors: PaletteColor[] | null = null;
    let nextMode: PaletteMode | null = null;
    let nextLibrary: PaletteRecord[] | null = null;
    let nextHistory: PaletteRecord[] | null = null;
    let nextNotice: string | null = null;

    if (decoded) {
      nextColors = decoded.colors;
      nextMode = decoded.mode;
      nextNotice = "Shared URL restored";
    } else if (storedPalette) {
      try {
        const parsed = JSON.parse(storedPalette) as CurrentState;
        if (Array.isArray(parsed.colors) && parsed.colors.length >= minPaletteSize) {
          nextColors = parsed.colors;
          nextMode = parsed.mode ?? "Analogous";
        }
      } catch { window.localStorage.removeItem(paletteStorageKey); }
    }
    if (storedLibrary) {
      try { const parsed = JSON.parse(storedLibrary) as PaletteRecord[]; if (Array.isArray(parsed)) nextLibrary = parsed; }
      catch { window.localStorage.removeItem(libraryStorageKey); }
    }
    if (storedHistory) {
      try { const parsed = JSON.parse(storedHistory) as PaletteRecord[]; if (Array.isArray(parsed)) nextHistory = parsed; }
      catch { window.localStorage.removeItem(historyStorageKey); }
    }
    window.queueMicrotask(() => {
      if (nextColors) setColors(nextColors);
      if (nextMode) setMode(nextMode);
      if (nextLibrary) setLibrary(nextLibrary);
      if (nextHistory) setHistory(nextHistory);
      if (nextNotice) announce(nextNotice);
      setHydrated(true);
    });
  }, [announce]);

  useEffect(() => { if (hydrated) window.localStorage.setItem(paletteStorageKey, JSON.stringify({ colors, mode })); }, [colors, hydrated, mode]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(libraryStorageKey, JSON.stringify(library)); }, [hydrated, library]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(historyStorageKey, JSON.stringify(history)); }, [history, hydrated]);

  useEffect(() => {
    const canvas = gradientCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    drawGradient(context, canvas.width, canvas.height, paletteHex, gradientKind, gradientAngle);
  }, [gradientAngle, gradientKind, paletteHex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((open) => !open); return; }
      if (event.key === "Escape") { setCommandOpen(false); setHelpOpen(false); }
      if (isEditing) return;
      if (event.code === "Space") { event.preventDefault(); generate(); }
      if (event.key.toLowerCase() === "u") { event.preventDefault(); undo(); }
      if (event.key.toLowerCase() === "s") { event.preventDefault(); savePalette(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function generate() { setPalette(generatePalette(colors, mode, colors.length), mode, `${mode} palette generated`); }
  function undo() {
    setUndoStack((stack) => {
      const [previous, ...rest] = stack;
      if (!previous) { announce("Nothing to undo"); return stack; }
      setColors(previous.colors); setMode(previous.mode); announce("Restored previous palette");
      return rest;
    });
  }
  function savePalette() {
    const record = createRecord(colors, mode, `Palette ${library.length + 1}`, true);
    setLibrary((current) => [record, ...current.filter((item) => paletteSignature(item.colors) !== paletteSignature(record.colors))]);
    announce(duplicateExists ? "Duplicate updated in library" : "Palette saved locally");
  }
  function updateHex(id: string, value: string) { setColors((current) => current.map((color) => (color.id === id ? { ...color, hex: normalizeHex(value) ?? value.toUpperCase() } : color))); }
  function updateFromHsl(id: string, channel: "h" | "s" | "l", value: number) {
    setColors((current) => current.map((color) => {
      if (color.id !== id) return color;
      const hsl = hexToHsl(color.hex);
      return { ...color, hex: hslToHex(channel === "h" ? value : hsl.h, channel === "s" ? value : hsl.s, channel === "l" ? value : hsl.l) };
    }));
  }
  function updateFromRgb(id: string, channel: "r" | "g" | "b", value: number) {
    setColors((current) => current.map((color) => {
      if (color.id !== id) return color;
      const rgb = hexToRgb(color.hex);
      return { ...color, hex: rgbToHex({ ...rgb, [channel]: value }) };
    }));
  }
  function updateAlpha(id: string, alpha: number) { setColors((current) => current.map((color) => (color.id === id ? { ...color, alpha } : color))); }
  function toggleLock(id: string) { setColors((current) => current.map((color) => (color.id === id ? { ...color, locked: !color.locked } : color))); }
  function setPaletteSize(size: number) { setPalette(resizePalette(colors, size, mode), mode, `${size} color palette`); }
  function addColor() { setPaletteSize(colors.length + 1); }
  function removeColor(id: string) { if (colors.length <= minPaletteSize) { announce("Minimum palette size reached"); return; } setPalette(colors.filter((color) => color.id !== id), mode, "Color removed"); }
  function switchMode(nextMode: PaletteMode) { setPalette(generatePalette(colors, nextMode, colors.length), nextMode, `${nextMode} mode`); }
  function importPalette() { const parsed = parsePaletteInput(importText); if (parsed.length < minPaletteSize) { announce("Import needs at least two HEX colors"); return; } setPalette(createPalette(parsed, parsed.length), mode, `Imported ${parsed.length} colors`); }
  function loadRecord(record: PaletteRecord) {
    const nextColors = createPalette(record.colors, record.colors.length).map((color, index) => ({ ...color, alpha: record.alphas[index] ?? 100 }));
    setPalette(nextColors, record.mode, `${record.name} loaded`);
    setLibrary((current) => current.map((item) => (item.id === record.id ? { ...item, usedAt: new Date().toISOString() } : item)));
  }
  function updateRecord(id: string, update: Partial<PaletteRecord>) { setLibrary((current) => current.map((record) => (record.id === id ? { ...record, ...update, updatedAt: new Date().toISOString() } : record))); }
  async function copyText(value: string, label: string) { try { await navigator.clipboard.writeText(value); announce(`${label} copied`); } catch { announce("Copy failed"); } }
  function downloadText(filename: string, content: string, type = "text/plain") { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); announce(`${filename} downloaded`); }
  function downloadPng(filename: string, variant: "swatches" | "gradient") {
    const canvas = document.createElement("canvas"); canvas.width = 1400; canvas.height = 840; const context = canvas.getContext("2d");
    if (!context) { announce("PNG export failed"); return; }
    if (variant === "gradient") drawGradient(context, canvas.width, canvas.height, paletteHex, gradientKind, gradientAngle);
    else drawSwatches(context, canvas.width, canvas.height, paletteHex);
    canvas.toBlob((blob) => { if (!blob) { announce("PNG export failed"); return; } const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); announce(`${filename} downloaded`); });
  }
  function downloadPdf() { downloadText("openpalette-sheet.pdf", createSimplePdf(paletteHex), "application/pdf"); }
  async function extractFromImage(file: File | null) {
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file); const canvas = document.createElement("canvas"); const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) { announce("Image extraction unavailable"); return; }
      const maxSide = 180; const scale = Math.min(maxSide / bitmap.width, maxSide / bitmap.height, 1);
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const extracted = extractPaletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data, extractionCount, extractionMode);
      if (extracted.length >= minPaletteSize) setPalette(createPalette(extracted, extracted.length), "Random", `Extracted ${extracted.length} image colors`); else announce("No usable colors found");
    } catch { announce("Image extraction failed"); }
  }

  return (
    <div className="mx-auto max-w-7xl px-6">
      {/* ── HERO: Toolbar + actions on the canvas ── */}
      <section className="pt-16 sm:pt-24 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Palette Studio
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg">
              Generate color systems, lock decisions, edit channels, extract from
              images, and export as tokens. Everything happens in your browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="pill pill-secondary" type="button" onClick={() => setCommandOpen(true)}>
              Command
            </button>
            <button className="pill pill-secondary" disabled={undoStack.length === 0} type="button" onClick={undo}>
              Undo
            </button>
            <button className="pill pill-secondary" type="button" onClick={savePalette}>
              Save
            </button>
            <button className="pill pill-secondary" type="button" onClick={() => copyText(shareUrl, "Share URL")}>
              Share
            </button>
            <button className="pill pill-secondary" type="button" onClick={() => setHelpOpen((open) => !open)}>
              Shortcuts
            </button>
            <button className="pill pill-primary" type="button" onClick={generate}>
              Generate
            </button>
            <span aria-live="polite" role="status" className="text-xs text-[var(--text-muted)] ml-1">
              {notice}
            </span>
          </div>
        </div>
      </section>

      {helpOpen && (
        <section className="pb-6 max-w-lg" aria-label="Keyboard shortcuts">
          <div className="border-t border-[var(--border-default)] pt-6">
            <h2 className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)]">
              Keyboard shortcuts
            </h2>
            <dl className="mt-3 grid gap-4 sm:grid-cols-4">
              <div><dt className="font-mono text-xs font-semibold uppercase text-[var(--text-muted)]">Space</dt><dd className="mt-0.5 text-sm">Generate unlocked colors</dd></div>
              <div><dt className="font-mono text-xs font-semibold uppercase text-[var(--text-muted)]">U</dt><dd className="mt-0.5 text-sm">Undo</dd></div>
              <div><dt className="font-mono text-xs font-semibold uppercase text-[var(--text-muted)]">S</dt><dd className="mt-0.5 text-sm">Save palette</dd></div>
              <div><dt className="font-mono text-xs font-semibold uppercase text-[var(--text-muted)]">Ctrl+K</dt><dd className="mt-0.5 text-sm">Command palette</dd></div>
            </dl>
          </div>
        </section>
      )}

      {/* ── COMMAND PALETTE ── */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto mt-24 max-w-lg rounded-2xl bg-[var(--bg-surface)] p-4 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-2">
              <h2 className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)]">Command palette</h2>
              <button className="pill pill-secondary text-xs" type="button" onClick={() => setCommandOpen(false)}>Esc</button>
            </div>
            <div className="space-y-1">
              {[
                ["Generate palette", generate],
                ["Save locally", savePalette],
                ["Copy share URL", () => copyText(shareUrl, "Share URL")],
              ].map(([label, action]) => (
                <button key={label as string} className="flex w-full rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-[var(--bg-surface-muted)]" type="button" onClick={() => { (action as () => void)(); setCommandOpen(false); }}>{label as string}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HARMONY MODES + PALETTE CONTROLS (data strip) ── */}
      <div className="data-strip mb-10">
        <div className="flex flex-wrap gap-1.5">
          {paletteModes.map((paletteMode) => (
            <button key={paletteMode} className={`chip ${mode === paletteMode ? "chip-active" : ""}`} type="button" onClick={() => switchMode(paletteMode)}>
              {paletteMode}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-xs font-semibold text-[var(--text-muted)]">
          Size: {colors.length}
          <input className="w-20" min={minPaletteSize} max={maxPaletteSize} type="range" value={colors.length} onChange={(e) => setPaletteSize(Number(e.target.value))} />
        </label>
        <div className="flex gap-2">
          <button className="pill pill-secondary text-xs" disabled={colors.length <= minPaletteSize} type="button" onClick={() => setPaletteSize(colors.length - 1)}>−</button>
          <button className="pill pill-secondary text-xs" disabled={colors.length >= maxPaletteSize} type="button" onClick={addColor}>+</button>
        </div>
        <button className="pill pill-accent-ghost text-xs" type="button" onClick={() => setAdvancedOpen((o) => !o)}>
          {advancedOpen ? "Hide channels" : "Channels"}
        </button>
      </div>

      {/* ── SWATCHES (the hero of the page) ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border border-[var(--border-default)] rounded-2xl overflow-hidden">
        {colors.map((color, index) => {
          const normalizedHex = normalizeHex(color.hex) ?? "#111827";
          const simulatedHex = simulateVision(normalizedHex, visionMode);
          const textColor = getReadableTextColor(simulatedHex);
          const hint = contrastHints[index];
          const hsl = hexToHsl(normalizedHex);
          const rgb = hexToRgb(normalizedHex);

          return (
            <article
              key={color.id}
              className="group flex flex-col justify-between min-h-[320px] p-5"
              style={{ backgroundColor: simulatedHex, color: textColor }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between gap-1">
                <span className="swatch-action">{String(index + 1).padStart(2, "0")}</span>
                <div className="flex gap-1">
                  <button className="swatch-action" type="button" onClick={() => toggleLock(color.id)}>
                    {color.locked ? "🔒" : "🔓"}
                  </button>
                  <button className="swatch-action" disabled={colors.length <= minPaletteSize} type="button" onClick={() => removeColor(color.id)}>✕</button>
                </div>
              </div>

              {/* Bottom controls */}
              <div className="space-y-2.5">
                {/* Color picker */}
                <input aria-label={`Color picker ${index + 1}`} className="h-9 w-full cursor-pointer rounded-full border border-white/30 bg-transparent" type="color" value={normalizedHex} onChange={(e) => updateHex(color.id, e.target.value)} />

                {/* HEX input */}
                <input className="w-full rounded-full border border-white/30 bg-white/20 px-3 py-2 font-mono text-sm font-semibold text-center uppercase outline-none focus:border-white" value={color.hex} spellCheck={false} onChange={(e) => updateHex(color.id, e.target.value)} />

                {/* Advanced channels */}
                {advancedOpen && (
                  <>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["h", "s", "l"] as const).map((ch) => (
                        <label key={ch} className="block text-[10px] font-bold tracking-wider uppercase text-center">
                          {ch}
                          <input className="w-full rounded-full bg-white/20 px-2 py-1.5 text-xs font-semibold text-center outline-none" max={ch === "h" ? 360 : 100} min={0} type="number" value={hsl[ch]} onChange={(e) => updateFromHsl(color.id, ch, Number(e.target.value))} />
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["r", "g", "b"] as const).map((ch) => (
                        <label key={ch} className="block text-[10px] font-bold tracking-wider uppercase text-center">
                          {ch}
                          <input className="w-full rounded-full bg-white/20 px-2 py-1.5 text-xs font-semibold text-center outline-none" max={255} min={0} type="number" value={rgb[ch]} onChange={(e) => updateFromRgb(color.id, ch, Number(e.target.value))} />
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {/* Alpha */}
                <label className="flex items-center gap-2 text-xs font-semibold">
                  Alpha {color.alpha}%
                  <input className="flex-1" min={0} max={100} type="range" value={color.alpha} onChange={(e) => updateAlpha(color.id, Number(e.target.value))} />
                </label>

                {/* Copy buttons */}
                <div className="grid grid-cols-2 gap-1">
                  <button className="swatch-action text-center" type="button" onClick={() => copyText(normalizedHex, "HEX")}>HEX</button>
                  <button className="swatch-action text-center" type="button" onClick={() => copyText(`rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${color.alpha}%)`, "RGB")}>RGB</button>
                  <button className="swatch-action text-center" type="button" onClick={() => copyText(`hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${color.alpha}%)`, "HSL")}>HSL</button>
                  <button className="swatch-action text-center" type="button" onClick={() => copyText(`--color-${index + 1}: ${normalizedHex};`, "Var")}>Var</button>
                </div>

                {/* Contrast hint */}
                <p className="text-[11px] font-semibold text-center opacity-80">
                  {hint.rating} · {hint.ratio.toFixed(1)}:1 with {hint.bestTextColor === "#000000" ? "black" : "white"}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      {/* ── GRADIENT GENERATOR ── */}
      <section className="py-20 sm:py-28">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Gradient</h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {(["linear", "radial"] as const).map((item) => (
            <button key={item} className={`chip ${gradientKind === item ? "chip-active" : ""}`} type="button" onClick={() => setGradientKind(item)}>{item}</button>
          ))}
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
            Angle {gradientAngle}°
            <input className="w-20" disabled={gradientKind === "radial"} max={360} min={0} type="range" value={gradientAngle} onChange={(e) => setGradientAngle(Number(e.target.value))} />
          </label>
        </div>
        <canvas ref={gradientCanvasRef} className="mt-6 w-full h-48 sm:h-56 rounded-2xl border border-[var(--border-default)]" width={1200} height={420} />
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="pill pill-secondary text-xs" type="button" onClick={() => copyText(gradientCss, "CSS")}>Copy CSS</button>
          <button className="pill pill-secondary text-xs" type="button" onClick={() => copyText(gradientSvg, "SVG")}>Copy SVG</button>
          <button className="pill pill-secondary text-xs" type="button" onClick={() => downloadPng("openpalette-gradient.png", "gradient")}>Download PNG</button>
          <button className="pill pill-secondary text-xs" type="button" onClick={() => downloadText("openpalette-gradient.svg", gradientSvg, "image/svg+xml")}>Download SVG</button>
        </div>
      </section>

      {/* ── IMPORT + IMAGE EXTRACTION ── */}
      <section className="py-20 sm:py-28 border-t border-[var(--border-default)]">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Import</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg">
          Paste HEX lists, JSON, Tailwind config, CSS vars, or a shared URL parameter. Or drop an image to extract dominant colors.
        </p>
        <div className="mt-6 max-w-2xl space-y-4">
          <textarea
            className="w-full rounded-2xl bg-[var(--bg-surface-muted)] p-4 font-mono text-sm min-h-[100px] outline-none"
            placeholder="Paste HEX lists, JSON, Tailwind colors, CSS variables..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="pill pill-primary" type="button" onClick={importPalette}>Import palette</button>
          </div>
          <div
            className="rounded-2xl p-6 bg-[var(--bg-surface-muted)] hover:bg-[#222] cursor-pointer transition text-sm text-[var(--text-secondary)]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); extractFromImage(e.dataTransfer.files.item(0)); }}
          >
            <label className="block cursor-pointer">
              <span className="font-semibold text-[var(--text-primary)]">Drop an image or click to upload</span>
              <span className="mt-1 block">Dominant colors extracted in-browser. No uploads — everything stays local.</span>
              <input accept="image/*" className="mt-3 block w-full text-sm" type="file" onChange={(e) => extractFromImage(e.target.files?.item(0) ?? null)} />
            </label>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              Colors: {extractionCount}
              <input className="w-20" min={minPaletteSize} max={maxPaletteSize} type="range" value={extractionCount} onChange={(e) => setExtractionCount(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              Mode
              <select className="field text-xs w-auto" value={extractionMode} onChange={(e) => setExtractionMode(e.target.value as ExtractionMode)}>
                <option value="balanced">Balanced</option>
                <option value="vibrant">Vibrant</option>
                <option value="muted">Muted</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* ── VISUALIZER ── */}
      <section className="py-20 sm:py-28 border-t border-[var(--border-default)]">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Visualizer</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg">
          Preview how your palette looks as real UI patterns — website, dashboard, form, and more.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {visualizers.map((item) => (
            <button key={item} className={`chip ${visualizer === item ? "chip-active" : ""}`} type="button" onClick={() => setVisualizer(item)}>{item}</button>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-[var(--border-default)] p-6 bg-[var(--bg-surface)]">
          <VisualizerPreview active={visualizer} colors={paletteHex} gradient={gradientCss} />
        </div>
      </section>

      {/* ── DESIGN SYSTEM FOUNDATION ── */}
      <section className="py-20 sm:py-28 border-t border-[var(--border-default)]">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Tokens</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg">
          Semantic roles and scale previews showing how this palette behaves as reusable design infrastructure.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tokenRows.map((row) => (
            <div key={row.name} className="rounded-2xl overflow-hidden border border-[var(--border-default)]">
              <div className="h-20" style={{ backgroundColor: row.value }} />
              <div className="p-4">
                <p className="font-mono text-sm font-semibold">{row.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{row.value} · text {row.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACCESSIBILITY ── */}
      <section className="py-20 sm:py-28 border-t border-[var(--border-default)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Accessibility</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg">
              WCAG contrast checks, readability previews, and color-vision simulations.
            </p>
          </div>
          <span className="pill pill-accent-ghost text-sm font-bold">{accessibilityScore}/100</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
            Simulation
            <select className="field text-xs w-auto" value={visionMode} onChange={(e) => setVisionMode(e.target.value as VisionMode)}>
              <option value="none">None</option>
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
            </select>
          </label>
        </div>
        {/* Readable previews */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {paletteHex.slice(0, 3).map((hex) => {
            const hint = getContrastHint(hex);
            return (
              <div key={hex} className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: hex, color: getReadableTextColor(hex) }}>
                <p className="text-sm font-semibold">Readable text preview</p>
                <p className="text-xs opacity-70">{hint.rating} · {hint.ratio.toFixed(2)}:1 contrast</p>
              </div>
            );
          })}
        </div>
        {pairContrasts[0] && (
          <div className="mt-4 text-sm text-[var(--text-secondary)]">
            <p><span className="font-semibold text-[var(--text-primary)]">Lowest pair:</span> {pairContrasts[0].foreground} on {pairContrasts[0].background} · {pairContrasts[0].ratio.toFixed(2)}:1</p>
            <p className="mt-1">Suggested: <span className="font-mono text-[var(--accent)]">{suggestAccessibleReplacement(pairContrasts[0].foreground, pairContrasts[0].background)}</span></p>
          </div>
        )}
      </section>

      {/* ── EXPORTS ── */}
      <section className="py-20 sm:py-28 border-t border-[var(--border-default)]">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Export</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-lg">
          Copy or download your palette as CSS, Tailwind, SCSS, JSON, SVG, or PNG.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {exportFormats.map((format) => (
            <button key={format} className={`chip ${activeExportFormat === format ? "chip-active" : ""}`} role="tab" type="button" onClick={() => setActiveExportFormat(format)}>
              {format}
            </button>
          ))}
        </div>
        <pre className="mt-4 max-h-48 overflow-auto rounded-2xl bg-[var(--bg-surface-muted)] p-4 text-xs leading-relaxed">
          <code>{exportSnippets[activeExportFormat]}</code>
        </pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="pill pill-secondary text-xs" type="button" onClick={() => copyText(exportSnippets[activeExportFormat], `${activeExportFormat} export`)}>Copy</button>
          <button className="pill pill-secondary text-xs" type="button" onClick={() => downloadText(`openpalette.${extensionFor(activeExportFormat)}`, exportSnippets[activeExportFormat])}>Download</button>
          <button className="pill pill-secondary text-xs" type="button" onClick={() => downloadPng("openpalette-swatches.png", "swatches")}>PNG</button>
          <button className="pill pill-secondary text-xs" type="button" onClick={downloadPdf}>PDF</button>
          <button className="pill pill-secondary text-xs" type="button" onClick={() => downloadText("openpalette.svg", exportSnippets.SVG, "image/svg+xml")}>SVG</button>
        </div>
      </section>

      {/* ── SIDE STRIP: Current palette summary ── */}
      <section className="data-strip py-3">
        <span className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)]">Current</span>
        {paletteHex.map((hex, i) => (
          <button key={`${hex}-${i}`} className="flex items-center gap-2 text-xs" type="button" onClick={() => copyText(hex, hex)}>
            <span className="size-5 rounded-full border border-[var(--border-default)]" style={{ backgroundColor: hex }} />
            <span className="font-mono font-semibold">{hex}</span>
          </button>
        ))}
        <span className="text-xs text-[var(--text-muted)]">{mode} · {duplicateExists ? "Saved" : `${accessibilityScore}/100`}</span>
      </section>

      {/* ── LIBRARY ── */}
      <section className="py-20 sm:py-28">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Library</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{library.length} saved palettes</p>
        <div className="mt-6 flex flex-wrap gap-3 max-w-xl">
          <input className="field flex-1 min-w-32" placeholder="Search palettes" value={query} onChange={(e) => setQuery(e.target.value)} />
          <input className="field flex-1 min-w-20" placeholder="Filter tags" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
          <select className="field flex-1 min-w-20" value={sort} onChange={(e) => setSort(e.target.value as LibrarySort)}>
            {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        {library.length === 0
          ? <p className="mt-6 text-sm text-[var(--text-muted)]">No saved palettes yet. Generate one and hit Save.</p>
          : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLibrary.slice(0, 18).map((record) => (
                <div key={record.id} className="rounded-2xl border border-[var(--border-default)] p-4 space-y-3">
                  <input className="w-full bg-transparent font-semibold outline-none text-sm" value={record.name} onChange={(e) => updateRecord(record.id, { name: e.target.value })} />
                  <button className="grid w-full overflow-hidden rounded-xl" style={{ gridTemplateColumns: `repeat(${record.colors.length}, 1fr)` }} type="button" onClick={() => loadRecord(record)}>
                    {record.colors.map((hex, i) => <span key={`${record.id}-${i}`} className="h-10" style={{ backgroundColor: hex }} />)}
                  </button>
                  <input className="w-full bg-transparent text-xs text-[var(--text-muted)] outline-none" placeholder="tags" value={record.tags.join(", ")} onChange={(e) => updateRecord(record.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
                  <div className="flex gap-2">
                    <button className="pill pill-secondary text-xs flex-1" type="button" onClick={() => updateRecord(record.id, { favorite: !record.favorite })}>
                      {record.favorite ? "★" : "☆"}
                    </button>
                    <button className="pill pill-danger text-xs flex-1" type="button" onClick={() => setLibrary((c) => c.filter((r) => r.id !== record.id))}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
        }

        {/* History */}
        {history.length > 0 && (
          <div className="mt-10 border-t border-[var(--border-default)] pt-8">
            <h3 className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)]">Recent</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {history.slice(0, 10).map((record) => (
                <button key={record.id} className="flex items-center gap-2 text-xs" type="button" onClick={() => loadRecord(record)}>
                  <span className="flex-1 grid grid-flow-col overflow-hidden rounded-md">
                    {record.colors.map((hex, i) => <span key={`${record.id}-h-${i}`} className="h-6" style={{ backgroundColor: hex }} />)}
                  </span>
                  <span className="text-[var(--text-muted)]">{record.mode}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function createRecord(colors: PaletteColor[], mode: PaletteMode, name: string, favorite: boolean): PaletteRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    colors: colors.map((color) => normalizeHex(color.hex) ?? "#111827"),
    alphas: colors.map((color) => color.alpha),
    mode,
    tags: [],
    collection: "Default",
    favorite,
    createdAt: now,
    updatedAt: now,
    usedAt: now,
  };
}
