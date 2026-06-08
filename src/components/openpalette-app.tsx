"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createExportSnippets,
  createGradientCss,
  createGradientSvg,
  createPalette,
  decodePaletteState,
  encodePaletteState,
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
const themeStorageKey = "openpalette.theme";
const exportFormats: ExportFormat[] = ["CSS", "SCSS", "Tailwind", "JSON", "Tokens", "SVG"];
const visualizers = ["Website", "Mobile", "Dashboard", "Poster", "Social", "Typography", "Brand"] as const;
const sorts: { label: string; value: LibrarySort }[] = [
  { label: "Recently used", value: "recent" },
  { label: "Brightness", value: "brightness" },
  { label: "Contrast", value: "contrast" },
  { label: "Warm/cool", value: "temperature" },
  { label: "Favorites", value: "favorites" },
];

type Theme = "light" | "dark";
type Visualizer = (typeof visualizers)[number];
type CurrentState = { colors: PaletteColor[]; mode: PaletteMode };

export function OpenPaletteApp() {
  const [colors, setColors] = useState<PaletteColor[]>(() => createPalette());
  const [mode, setMode] = useState<PaletteMode>("Analogous");
  const [library, setLibrary] = useState<PaletteRecord[]>([]);
  const [history, setHistory] = useState<PaletteRecord[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
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
  const [extractionCount, setExtractionCount] = useState(5);
  const [extractionMode, setExtractionMode] = useState<"balanced" | "vibrant" | "muted">("balanced");
  const gradientCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const paletteHex = useMemo(() => colors.map((color) => normalizeHex(color.hex) ?? "#111827"), [colors]);
  const paletteAlphas = useMemo(() => colors.map((color) => color.alpha), [colors]);
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
  const shareUrl = useMemo(() => {
    if (!hydrated) {
      return "";
    }

    const url = new URL(window.location.href);
    url.searchParams.set("palette", encodePaletteState(colors, mode));
    return url.toString();
  }, [colors, hydrated, mode]);
  const duplicateExists = useMemo(
    () => library.some((record) => paletteSignature(record.colors) === paletteSignature(paletteHex)),
    [library, paletteHex],
  );
  const filteredLibrary = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedTag = tagFilter.trim().toLowerCase();

    return sortPalettes(library, sort).filter((record) => {
      const haystack = [record.name, record.collection, record.mode, record.colors.join(" "), record.tags.join(" ")]
        .join(" ")
        .toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      const matchesTag = normalizedTag.length === 0 || record.tags.some((tag) => tag.toLowerCase().includes(normalizedTag));
      return matchesQuery && matchesTag;
    });
  }, [library, query, sort, tagFilter]);

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
    const storedTheme = window.localStorage.getItem(themeStorageKey) as Theme | null;
    const decoded = shared ? decodePaletteState(shared) : null;
    let nextColors: PaletteColor[] | null = null;
    let nextMode: PaletteMode | null = null;
    let nextLibrary: PaletteRecord[] | null = null;
    let nextHistory: PaletteRecord[] | null = null;
    let nextTheme: Theme | null = null;
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
      } catch {
        window.localStorage.removeItem(paletteStorageKey);
      }
    }

    if (storedLibrary) {
      try {
        const parsed = JSON.parse(storedLibrary) as PaletteRecord[];
        if (Array.isArray(parsed)) {
          nextLibrary = parsed;
        }
      } catch {
        window.localStorage.removeItem(libraryStorageKey);
      }
    }

    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory) as PaletteRecord[];
        if (Array.isArray(parsed)) {
          nextHistory = parsed;
        }
      } catch {
        window.localStorage.removeItem(historyStorageKey);
      }
    }

    if (storedTheme === "light" || storedTheme === "dark") {
      nextTheme = storedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      nextTheme = "dark";
    }

    window.queueMicrotask(() => {
      if (nextColors) {
        setColors(nextColors);
      }

      if (nextMode) {
        setMode(nextMode);
      }

      if (nextLibrary) {
        setLibrary(nextLibrary);
      }

      if (nextHistory) {
        setHistory(nextHistory);
      }

      if (nextTheme) {
        setTheme(nextTheme);
      }

      if (nextNotice) {
        announce(nextNotice);
      }

      setHydrated(true);
    });
  }, [announce]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(paletteStorageKey, JSON.stringify({ colors, mode }));
  }, [colors, hydrated, mode]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(libraryStorageKey, JSON.stringify(library));
    }
  }, [hydrated, library]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(historyStorageKey, JSON.stringify(history));
    }
  }, [history, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (hydrated) {
      window.localStorage.setItem(themeStorageKey, theme);
    }
  }, [hydrated, theme]);

  useEffect(() => {
    const canvas = gradientCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    drawGradient(context, canvas.width, canvas.height, paletteHex, gradientKind, gradientAngle);
  }, [gradientAngle, gradientKind, paletteHex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
        setHelpOpen(false);
      }

      if (isEditing) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        generate();
      }

      if (event.key.toLowerCase() === "u") {
        event.preventDefault();
        undo();
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        savePalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function generate() {
    setPalette(generatePalette(colors, mode, colors.length), mode, `${mode} palette generated`);
  }

  function undo() {
    setUndoStack((stack) => {
      const [previous, ...rest] = stack;

      if (!previous) {
        announce("Nothing to undo");
        return stack;
      }

      setColors(previous.colors);
      setMode(previous.mode);
      announce("Restored previous palette");
      return rest;
    });
  }

  function savePalette() {
    const record = createRecord(colors, mode, `Palette ${library.length + 1}`, true);
    setLibrary((current) => [record, ...current.filter((item) => paletteSignature(item.colors) !== paletteSignature(record.colors))]);
    announce(duplicateExists ? "Duplicate updated in library" : "Palette saved locally");
  }

  function updateHex(id: string, value: string) {
    setColors((current) =>
      current.map((color) => (color.id === id ? { ...color, hex: normalizeHex(value) ?? value.toUpperCase() } : color)),
    );
  }

  function updateFromHsl(id: string, channel: "h" | "s" | "l", value: number) {
    setColors((current) =>
      current.map((color) => {
        if (color.id !== id) {
          return color;
        }

        const hsl = hexToHsl(color.hex);
        return { ...color, hex: hslToHex(channel === "h" ? value : hsl.h, channel === "s" ? value : hsl.s, channel === "l" ? value : hsl.l) };
      }),
    );
  }

  function updateFromRgb(id: string, channel: "r" | "g" | "b", value: number) {
    setColors((current) =>
      current.map((color) => {
        if (color.id !== id) {
          return color;
        }

        const rgb = hexToRgb(color.hex);
        return { ...color, hex: rgbToHex({ ...rgb, [channel]: value }) };
      }),
    );
  }

  function updateAlpha(id: string, alpha: number) {
    setColors((current) => current.map((color) => (color.id === id ? { ...color, alpha } : color)));
  }

  function toggleLock(id: string) {
    setColors((current) => current.map((color) => (color.id === id ? { ...color, locked: !color.locked } : color)));
  }

  function setPaletteSize(size: number) {
    setPalette(resizePalette(colors, size, mode), mode, `${size} color palette`);
  }

  function addColor() {
    setPaletteSize(colors.length + 1);
  }

  function removeColor(id: string) {
    if (colors.length <= minPaletteSize) {
      announce("Minimum palette size reached");
      return;
    }

    setPalette(colors.filter((color) => color.id !== id), mode, "Color removed");
  }

  function switchMode(nextMode: PaletteMode) {
    setPalette(generatePalette(colors, nextMode, colors.length), nextMode, `${nextMode} mode`);
  }

  function importPalette() {
    const parsed = parsePaletteInput(importText);

    if (parsed.length < minPaletteSize) {
      announce("Import needs at least two HEX colors");
      return;
    }

    setPalette(createPalette(parsed, parsed.length), mode, `Imported ${parsed.length} colors`);
  }

  function loadRecord(record: PaletteRecord) {
    const nextColors = createPalette(record.colors, record.colors.length).map((color, index) => ({
      ...color,
      alpha: record.alphas[index] ?? 100,
    }));
    setPalette(nextColors, record.mode, `${record.name} loaded`);
    setLibrary((current) => current.map((item) => (item.id === record.id ? { ...item, usedAt: new Date().toISOString() } : item)));
  }

  function updateRecord(id: string, update: Partial<PaletteRecord>) {
    setLibrary((current) =>
      current.map((record) => (record.id === id ? { ...record, ...update, updatedAt: new Date().toISOString() } : record)),
    );
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      announce(`${label} copied`);
    } catch {
      announce("Copy failed");
    }
  }

  function downloadText(filename: string, content: string, type = "text/plain") {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    announce(`${filename} downloaded`);
  }

  function downloadPng(filename: string, variant: "swatches" | "gradient") {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 840;
    const context = canvas.getContext("2d");

    if (!context) {
      announce("PNG export failed");
      return;
    }

    if (variant === "gradient") {
      drawGradient(context, canvas.width, canvas.height, paletteHex, gradientKind, gradientAngle);
    } else {
      drawSwatches(context, canvas.width, canvas.height, paletteHex);
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        announce("PNG export failed");
        return;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      announce(`${filename} downloaded`);
    });
  }

  function downloadPdf() {
    downloadText("openpalette-sheet.pdf", createSimplePdf(paletteHex), "application/pdf");
  }

  async function extractFromImage(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        announce("Image extraction unavailable");
        return;
      }

      const maxSide = 180;
      const scale = Math.min(maxSide / bitmap.width, maxSide / bitmap.height, 1);
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const extracted = extractPaletteFromPixels(context.getImageData(0, 0, canvas.width, canvas.height).data, extractionCount, extractionMode);
      if (extracted.length >= minPaletteSize) {
        setPalette(createPalette(extracted, extracted.length), "Random", `Extracted ${extracted.length} image colors`);
      } else {
        announce("No usable colors found");
      }
    } catch {
      announce("Image extraction failed");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <a href="#studio" className="inline-flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-[var(--foreground)] text-sm font-bold text-[var(--background)]">
                OP
              </span>
              <span>
                <span className="block text-xl font-semibold tracking-tight">OpenPalette</span>
                <span className="block text-sm text-[var(--muted)]">Local-first color systems for design tools.</span>
              </span>
            </a>
            <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Primary actions">
              <button className="button button-secondary" type="button" onClick={() => setCommandOpen(true)}>
                Command
              </button>
              <button className="button button-secondary" disabled={undoStack.length === 0} type="button" onClick={undo}>
                Undo
              </button>
              <button className="button button-secondary" type="button" onClick={savePalette}>
                Save
              </button>
              <button className="button button-secondary" type="button" onClick={() => copyText(shareUrl, "Share URL")}>
                Share URL
              </button>
              <button className="button button-secondary" type="button" onClick={() => setHelpOpen((open) => !open)}>
                Shortcuts
              </button>
              <button
                aria-pressed={theme === "dark"}
                className="button button-secondary"
                type="button"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? "Dark" : "Light"}
              </button>
              <button className="button button-primary" type="button" onClick={generate}>
                Generate
              </button>
            </nav>
          </div>
        </header>

        {helpOpen ? <HelpPanel onClose={() => setHelpOpen(false)} /> : null}
        {commandOpen ? (
          <CommandPalette
            onClose={() => setCommandOpen(false)}
            onGenerate={generate}
            onSave={savePalette}
            onShare={() => copyText(shareUrl, "Share URL")}
            onTheme={() => setTheme(theme === "light" ? "dark" : "light")}
          />
        ) : null}

        <section className="grid min-w-0 flex-1 gap-5 py-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]" id="studio">
          <div className="min-w-0 space-y-5">
            <section className="panel overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Palette studio</h1>
                  <p className="text-sm text-[var(--muted)]">
                    Generate 2-10 color systems, lock decisions, edit channels, export tokens, and preview locally.
                  </p>
                </div>
                <p aria-live="polite" className="status-pill" role="status">
                  {notice}
                </p>
              </div>

              <div className="grid items-start gap-3 border-b border-[var(--border)] p-4 lg:grid-cols-[1fr_220px_170px]">
                <div className="flex flex-wrap gap-2" aria-label="Palette harmony modes">
                  {paletteModes.map((paletteMode) => (
                    <button
                      aria-pressed={mode === paletteMode}
                      className={`chip ${mode === paletteMode ? "chip-active" : ""}`}
                      key={paletteMode}
                      type="button"
                      onClick={() => switchMode(paletteMode)}
                    >
                      {paletteMode}
                    </button>
                  ))}
                </div>
                <label className="control-label">
                  Palette size: {colors.length}
                  <input
                    min={minPaletteSize}
                    max={maxPaletteSize}
                    type="range"
                    value={colors.length}
                    onChange={(event) => setPaletteSize(Number(event.target.value))}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2 self-end">
                  <button className="button button-secondary" disabled={colors.length <= minPaletteSize} type="button" onClick={() => setPaletteSize(colors.length - 1)}>
                    Remove
                  </button>
                  <button className="button button-secondary" disabled={colors.length >= maxPaletteSize} type="button" onClick={addColor}>
                    Add
                  </button>
                </div>
              </div>

              <div className="palette-grid" style={{ gridTemplateColumns: `repeat(${Math.min(colors.length, 5)}, minmax(0, 1fr))` }}>
                {colors.map((color, index) => {
                  const normalizedHex = normalizeHex(color.hex) ?? "#111827";
                  const simulatedHex = simulateVision(normalizedHex, visionMode);
                  const textColor = getReadableTextColor(simulatedHex);
                  const hint = contrastHints[index];
                  const hsl = hexToHsl(normalizedHex);
                  const rgb = hexToRgb(normalizedHex);

                  return (
                    <article
                      className="group flex min-h-[330px] flex-col justify-between p-4"
                      key={color.id}
                      style={{ backgroundColor: simulatedHex, color: textColor }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-black/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex gap-2">
                          <button className="swatch-action" type="button" onClick={() => toggleLock(color.id)}>
                            {color.locked ? "Locked" : "Lock"}
                          </button>
                          <button className="swatch-action" disabled={colors.length <= minPaletteSize} type="button" onClick={() => removeColor(color.id)}>
                            -
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-xl bg-black/15 p-3 backdrop-blur">
                        <input
                          aria-label={`Visual color picker for color ${index + 1}`}
                          className="h-10 w-full cursor-pointer rounded-lg border border-white/40 bg-transparent"
                          type="color"
                          value={normalizedHex}
                          onChange={(event) => updateHex(color.id, event.target.value)}
                        />
                        <label className="block">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em]">HEX</span>
                          <input
                            className="mt-1 w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 font-mono text-base font-semibold uppercase outline-none focus:border-white"
                            value={color.hex}
                            spellCheck={false}
                            onBlur={() => updateHex(color.id, color.hex)}
                            onChange={(event) => updateHex(color.id, event.target.value)}
                          />
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["h", "s", "l"] as const).map((channel) => (
                            <label className="mini-field" key={channel}>
                              {channel.toUpperCase()}
                              <input
                                max={channel === "h" ? 360 : 100}
                                min={0}
                                type="number"
                                value={hsl[channel]}
                                onChange={(event) => updateFromHsl(color.id, channel, Number(event.target.value))}
                              />
                            </label>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(["r", "g", "b"] as const).map((channel) => (
                            <label className="mini-field" key={channel}>
                              {channel.toUpperCase()}
                              <input
                                max={255}
                                min={0}
                                type="number"
                                value={rgb[channel]}
                                onChange={(event) => updateFromRgb(color.id, channel, Number(event.target.value))}
                              />
                            </label>
                          ))}
                        </div>
                        <label className="control-label text-current">
                          Alpha {color.alpha}%
                          <input
                            min={0}
                            max={100}
                            type="range"
                            value={color.alpha}
                            onChange={(event) => updateAlpha(color.id, Number(event.target.value))}
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button className="swatch-action" type="button" onClick={() => copyText(normalizedHex, "HEX")}>
                            HEX
                          </button>
                          <button className="swatch-action" type="button" onClick={() => copyText(`rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${color.alpha}%)`, "RGB")}>
                            RGB
                          </button>
                          <button className="swatch-action" type="button" onClick={() => copyText(`hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${color.alpha}%)`, "HSL")}>
                            HSL
                          </button>
                          <button className="swatch-action" type="button" onClick={() => copyText(`--color-${index + 1}: ${normalizedHex};`, "Variable")}>
                            Var
                          </button>
                        </div>
                        <p className="text-xs font-semibold">
                          {hint.rating} contrast · {hint.ratio.toFixed(2)} with {hint.bestTextColor === "#000000" ? "black" : "white"} text
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <GradientPanel
                angle={gradientAngle}
                canvasRef={gradientCanvasRef}
                css={gradientCss}
                kind={gradientKind}
                svg={gradientSvg}
                onAngle={setGradientAngle}
                onCopy={copyText}
                onDownloadPng={() => downloadPng("openpalette-gradient.png", "gradient")}
                onDownloadSvg={() => downloadText("openpalette-gradient.svg", gradientSvg, "image/svg+xml")}
                onKind={setGradientKind}
              />
              <ImportImagePanel
                extractionCount={extractionCount}
                extractionMode={extractionMode}
                importText={importText}
                onExtract={extractFromImage}
                onImport={importPalette}
                onImportText={setImportText}
                onMode={setExtractionMode}
                onCount={setExtractionCount}
              />
            </section>

            <VisualizerPanel active={visualizer} colors={paletteHex} gradient={gradientCss} onActive={setVisualizer} />
            <AccessibilityPanel
              colors={paletteHex}
              pairContrasts={pairContrasts}
              score={accessibilityScore}
              visionMode={visionMode}
              onVisionMode={setVisionMode}
            />
          </div>

          <aside className="min-w-0 space-y-5">
            <section className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="section-title">Current palette</h2>
                <span className={`status-pill ${duplicateExists ? "border-amber-500 text-amber-700" : ""}`}>
                  {duplicateExists ? "Duplicate" : `${accessibilityScore}/100`}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {paletteHex.map((hex, index) => (
                  <button
                    aria-label={`Copy ${hex}`}
                    className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-2 text-left transition hover:bg-[var(--subtle)]"
                    key={`${hex}-${index}`}
                    type="button"
                    onClick={() => copyText(hex, hex)}
                  >
                    <span className="size-10 rounded-md border border-black/10" style={{ backgroundColor: hex }} />
                    <span>
                      <span className="block font-mono text-sm font-semibold">{hex}</span>
                      <span className="block text-xs text-[var(--muted)]">Alpha {paletteAlphas[index]}% · {mode}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="section-title">Exports</h2>
                <button className="button button-primary" type="button" onClick={() => copyText(exportSnippets[activeExportFormat], `${activeExportFormat} export`)}>
                  Copy
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Export formats">
                {exportFormats.map((format) => (
                  <button
                    aria-selected={activeExportFormat === format}
                    className={`chip ${activeExportFormat === format ? "chip-active" : ""}`}
                    key={format}
                    role="tab"
                    type="button"
                    onClick={() => setActiveExportFormat(format)}
                  >
                    {format}
                  </button>
                ))}
              </div>
              <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-[var(--subtle)] p-3 text-xs leading-5">
                <code>{exportSnippets[activeExportFormat]}</code>
              </pre>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="button button-secondary" type="button" onClick={() => downloadText(`openpalette.${extensionFor(activeExportFormat)}`, exportSnippets[activeExportFormat])}>
                  Download
                </button>
                <button className="button button-secondary" type="button" onClick={() => downloadPng("openpalette-swatches.png", "swatches")}>
                  PNG
                </button>
                <button className="button button-secondary" type="button" onClick={downloadPdf}>
                  PDF sheet
                </button>
                <button className="button button-secondary" type="button" onClick={() => downloadText("openpalette.svg", exportSnippets.SVG, "image/svg+xml")}>
                  SVG
                </button>
              </div>
            </section>

            <LibraryPanel
              history={history}
              library={filteredLibrary}
              rawCount={library.length}
              query={query}
              sort={sort}
              tagFilter={tagFilter}
              onDelete={(id) => setLibrary((current) => current.filter((record) => record.id !== id))}
              onFavorite={(record) => updateRecord(record.id, { favorite: !record.favorite })}
              onLoad={loadRecord}
              onQuery={setQuery}
              onRename={(record, name) => updateRecord(record.id, { name })}
              onSort={setSort}
              onTagFilter={setTagFilter}
              onTags={(record, tags) =>
                updateRecord(record.id, {
                  tags: tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
            />
          </aside>
        </section>
      </div>
    </main>
  );
}

function GradientPanel({
  angle,
  canvasRef,
  css,
  kind,
  svg,
  onAngle,
  onCopy,
  onDownloadPng,
  onDownloadSvg,
  onKind,
}: {
  angle: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  css: string;
  kind: GradientKind;
  svg: string;
  onAngle: (angle: number) => void;
  onCopy: (value: string, label: string) => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onKind: (kind: GradientKind) => void;
}) {
  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Gradient generator</h2>
        <div className="flex gap-2">
          {(["linear", "radial"] as const).map((item) => (
            <button className={`chip ${kind === item ? "chip-active" : ""}`} key={item} type="button" onClick={() => onKind(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} className="mt-4 h-48 w-full rounded-lg border border-[var(--border)]" width={900} height={420} />
      <label className="control-label mt-4">
        Angle {angle}deg
        <input disabled={kind === "radial"} max={360} min={0} type="range" value={angle} onChange={(event) => onAngle(Number(event.target.value))} />
      </label>
      <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-[var(--subtle)] p-3 text-xs">
        <code>{css}</code>
      </pre>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button className="button button-secondary" type="button" onClick={() => onCopy(css, "CSS gradient")}>
          CSS
        </button>
        <button className="button button-secondary" type="button" onClick={() => onCopy(svg, "SVG gradient")}>
          SVG
        </button>
        <button className="button button-secondary" type="button" onClick={onDownloadPng}>
          PNG
        </button>
      </div>
      <button className="button button-secondary mt-2 w-full" type="button" onClick={onDownloadSvg}>
        Download SVG gradient
      </button>
    </section>
  );
}

function ImportImagePanel({
  extractionCount,
  extractionMode,
  importText,
  onCount,
  onExtract,
  onImport,
  onImportText,
  onMode,
}: {
  extractionCount: number;
  extractionMode: "balanced" | "vibrant" | "muted";
  importText: string;
  onCount: (count: number) => void;
  onExtract: (file: File | null) => void;
  onImport: () => void;
  onImportText: (text: string) => void;
  onMode: (mode: "balanced" | "vibrant" | "muted") => void;
}) {
  return (
    <section className="panel p-4">
      <h2 className="section-title">Import and image extraction</h2>
      <textarea
        className="mt-4 min-h-28 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-sm outline-none focus:border-[var(--foreground)]"
        placeholder="Paste HEX lists, JSON, Tailwind colors, CSS variables, or a shared URL palette parameter."
        value={importText}
        onChange={(event) => onImportText(event.target.value)}
      />
      <button className="button button-primary mt-3 w-full" type="button" onClick={onImport}>
        Import palette
      </button>
      <div
        className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--subtle)] p-4 text-sm text-[var(--muted)]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onExtract(event.dataTransfer.files.item(0));
        }}
      >
        <label className="block cursor-pointer">
          <span className="font-semibold text-[var(--foreground)]">Upload or drop an image</span>
          <span className="mt-1 block">Dominant colors are extracted in-browser with smart deduplication.</span>
          <input
            accept="image/*"
            className="mt-3 block w-full text-sm"
            type="file"
            onChange={(event) => onExtract(event.target.files?.item(0) ?? null)}
          />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="control-label">
          Count {extractionCount}
          <input min={minPaletteSize} max={maxPaletteSize} type="range" value={extractionCount} onChange={(event) => onCount(Number(event.target.value))} />
        </label>
        <label className="control-label">
          Mode
          <select className="field" value={extractionMode} onChange={(event) => onMode(event.target.value as "balanced" | "vibrant" | "muted")}>
            <option value="balanced">Balanced</option>
            <option value="vibrant">Vibrant</option>
            <option value="muted">Muted</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">ASE binary import is documented as a future parser target; text-based Adobe exports with HEX values already import.</p>
    </section>
  );
}

function VisualizerPanel({
  active,
  colors,
  gradient,
  onActive,
}: {
  active: Visualizer;
  colors: string[];
  gradient: string;
  onActive: (active: Visualizer) => void;
}) {
  const [primary, secondary, accent, surface, ink] = fillColors(colors);

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Visualizer system</h2>
        <div className="flex flex-wrap gap-2">
          {visualizers.map((item) => (
            <button className={`chip ${active === item ? "chip-active" : ""}`} key={item} type="button" onClick={() => onActive(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
        {active === "Website" ? <WebsitePreview primary={primary} secondary={secondary} accent={accent} surface={surface} ink={ink} /> : null}
        {active === "Mobile" ? <MobilePreview primary={primary} secondary={secondary} accent={accent} surface={surface} ink={ink} /> : null}
        {active === "Dashboard" ? <DashboardPreview primary={primary} secondary={secondary} accent={accent} surface={surface} ink={ink} /> : null}
        {active === "Poster" ? <PosterPreview gradient={gradient} ink={ink} /> : null}
        {active === "Social" ? <SocialPreview primary={primary} secondary={secondary} accent={accent} surface={surface} ink={ink} /> : null}
        {active === "Typography" ? <TypographyPreview primary={primary} secondary={secondary} accent={accent} surface={surface} ink={ink} /> : null}
        {active === "Brand" ? <BrandPreview colors={colors} primary={primary} secondary={secondary} accent={accent} surface={surface} ink={ink} /> : null}
      </div>
    </section>
  );
}

function AccessibilityPanel({
  colors,
  pairContrasts,
  score,
  visionMode,
  onVisionMode,
}: {
  colors: string[];
  pairContrasts: ReturnType<typeof getPairContrasts>;
  score: number;
  visionMode: VisionMode;
  onVisionMode: (mode: VisionMode) => void;
}) {
  const weakest = pairContrasts[0];
  const replacement = weakest ? suggestAccessibleReplacement(weakest.foreground, weakest.background) : colors[0];

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Accessibility toolkit</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">WCAG checks, readability previews, warnings, and color-vision simulations.</p>
        </div>
        <strong className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm text-[var(--background)]">{score}/100</strong>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
        <label className="control-label">
          Simulation
          <select className="field" value={visionMode} onChange={(event) => onVisionMode(event.target.value as VisionMode)}>
            <option value="none">None</option>
            <option value="protanopia">Protanopia</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="tritanopia">Tritanopia</option>
          </select>
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {colors.slice(0, 3).map((hex) => {
            const hint = getContrastHint(hex);
            return (
              <div className="rounded-lg p-4" key={hex} style={{ backgroundColor: hex, color: getReadableTextColor(hex) }}>
                <p className="text-sm font-semibold">Readable text preview</p>
                <p className="mt-8 text-xs">{hint.rating} · {hint.ratio.toFixed(2)} contrast</p>
              </div>
            );
          })}
        </div>
      </div>
      {weakest ? (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-3 text-sm">
          <p className="font-semibold">Lowest pair: {weakest.foreground} on {weakest.background} · {weakest.ratio.toFixed(2)}</p>
          <p className="mt-1 text-[var(--muted)]">Suggested accessible replacement: <span className="font-mono text-[var(--foreground)]">{replacement}</span></p>
        </div>
      ) : null}
    </section>
  );
}

function LibraryPanel({
  history,
  library,
  rawCount,
  query,
  sort,
  tagFilter,
  onDelete,
  onFavorite,
  onLoad,
  onQuery,
  onRename,
  onSort,
  onTagFilter,
  onTags,
}: {
  history: PaletteRecord[];
  library: PaletteRecord[];
  rawCount: number;
  query: string;
  sort: LibrarySort;
  tagFilter: string;
  onDelete: (id: string) => void;
  onFavorite: (record: PaletteRecord) => void;
  onLoad: (record: PaletteRecord) => void;
  onQuery: (query: string) => void;
  onRename: (record: PaletteRecord, name: string) => void;
  onSort: (sort: LibrarySort) => void;
  onTagFilter: (tag: string) => void;
  onTags: (record: PaletteRecord, tags: string) => void;
}) {
  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">Local library</h2>
        <span className="text-xs text-[var(--muted)]">{rawCount} saved</span>
      </div>
      <div className="mt-4 grid gap-2">
        <input className="field" placeholder="Search palettes" value={query} onChange={(event) => onQuery(event.target.value)} />
        <input className="field" placeholder="Filter tags" value={tagFilter} onChange={(event) => onTagFilter(event.target.value)} />
        <select className="field" value={sort} onChange={(event) => onSort(event.target.value as LibrarySort)}>
          {sorts.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 space-y-3">
        {library.length === 0 ? (
          <p className="rounded-lg bg-[var(--subtle)] p-3 text-sm text-[var(--muted)]">No palettes match yet. Save the current palette to create your first local collection item.</p>
        ) : (
          library.slice(0, 12).map((record) => (
            <article className="rounded-lg border border-[var(--border)] p-3" key={record.id}>
              <input className="field font-semibold" value={record.name} onChange={(event) => onRename(record, event.target.value)} />
              <button className="mt-2 grid w-full overflow-hidden rounded-md" style={{ gridTemplateColumns: `repeat(${record.colors.length}, minmax(0, 1fr))` }} type="button" onClick={() => onLoad(record)}>
                {record.colors.map((hex, index) => (
                  <span className="h-9" key={`${record.id}-${hex}-${index}`} style={{ backgroundColor: hex }} />
                ))}
              </button>
              <input className="field mt-2 text-xs" placeholder="tags, comma separated" value={record.tags.join(", ")} onChange={(event) => onTags(record, event.target.value)} />
              <div className="mt-2 flex gap-2">
                <button className="button button-secondary flex-1" type="button" onClick={() => onFavorite(record)}>
                  {record.favorite ? "Favorited" : "Favorite"}
                </button>
                <button className="button button-secondary flex-1" type="button" onClick={() => onDelete(record.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Recent timeline</h3>
        <div className="mt-3 space-y-2">
          {history.slice(0, 5).map((record) => (
            <button className="flex w-full items-center gap-2 text-left text-xs" key={record.id} type="button" onClick={() => onLoad(record)}>
              <span className="grid flex-1 grid-flow-col overflow-hidden rounded">
                {record.colors.map((hex, index) => (
                  <span className="h-5" key={`${record.id}-history-${index}`} style={{ backgroundColor: hex }} />
                ))}
              </span>
              <span className="text-[var(--muted)]">{record.mode}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <section className="panel mt-4 p-4" aria-label="Keyboard shortcuts">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Keyboard workflow</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
            <ShortcutKey keys="Space" label="Generate unlocked colors" />
            <ShortcutKey keys="U" label="Undo generation or load" />
            <ShortcutKey keys="S" label="Save active palette" />
            <ShortcutKey keys="Ctrl/⌘ K" label="Open command palette" />
          </dl>
        </div>
        <button className="button button-secondary" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}

function CommandPalette({
  onClose,
  onGenerate,
  onSave,
  onShare,
  onTheme,
}: {
  onClose: () => void;
  onGenerate: () => void;
  onSave: () => void;
  onShare: () => void;
  onTheme: () => void;
}) {
  const commands = [
    ["Generate palette", onGenerate],
    ["Save locally", onSave],
    ["Copy share URL", onShare],
    ["Toggle theme", onTheme],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto mt-24 max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl">
        <div className="flex items-center justify-between px-2 py-1">
          <h2 className="section-title">Command palette</h2>
          <button className="button button-secondary" type="button" onClick={onClose}>
            Esc
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {commands.map(([label, action]) => (
            <button
              className="flex w-full rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-[var(--subtle)]"
              key={label}
              type="button"
              onClick={() => {
                action();
                onClose();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShortcutKey({ keys, label }: { keys: string; label: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{keys}</dt>
      <dd className="mt-1 text-[var(--foreground)]">{label}</dd>
    </div>
  );
}

function WebsitePreview({ primary, secondary, accent, surface, ink }: PreviewProps) {
  return (
    <div className="rounded-xl p-5" style={{ background: surface, color: ink }}>
      <div className="flex items-center justify-between">
        <strong>Northstar Studio</strong>
        <button className="rounded-md px-3 py-2 text-sm font-semibold" style={{ background: primary, color: getReadableTextColor(primary) }}>Start</button>
      </div>
      <div className="mt-14 max-w-xl">
        <h3 className="text-4xl font-semibold">Design systems that feel built, not borrowed.</h3>
        <p className="mt-3 text-sm opacity-75">A realistic website hero checks text, buttons, surfaces, and accent roles.</p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[primary, secondary, accent].map((color, index) => <span className="h-24 rounded-lg" key={color} style={{ background: color, opacity: index === 1 ? 0.8 : 1 }} />)}
      </div>
    </div>
  );
}

function MobilePreview({ primary, secondary, accent, surface, ink }: PreviewProps) {
  return (
    <div className="mx-auto max-w-xs rounded-[2rem] border-8 border-[var(--foreground)] p-4" style={{ background: surface, color: ink }}>
      <div className="h-6 rounded-full" style={{ background: primary }} />
      <h3 className="mt-6 text-2xl font-semibold">Today</h3>
      <div className="mt-4 space-y-3">
        {[primary, secondary, accent].map((color, index) => <div className="rounded-xl p-4 text-sm font-semibold" key={color} style={{ background: color, color: getReadableTextColor(color) }}>Task card {index + 1}</div>)}
      </div>
    </div>
  );
}

function DashboardPreview({ primary, secondary, accent, surface, ink }: PreviewProps) {
  return (
    <div className="grid gap-3 rounded-xl p-4 md:grid-cols-[180px_1fr]" style={{ background: surface, color: ink }}>
      <aside className="rounded-lg p-3" style={{ background: primary, color: getReadableTextColor(primary) }}>Analytics</aside>
      <div className="grid gap-3 sm:grid-cols-3">
        {[primary, secondary, accent].map((color) => <div className="h-28 rounded-lg p-3 text-sm font-semibold" key={color} style={{ background: color, color: getReadableTextColor(color) }}>Metric</div>)}
        <div className="h-32 rounded-lg sm:col-span-3" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
      </div>
    </div>
  );
}

function PosterPreview({ gradient, ink }: { gradient: string; ink: string }) {
  return (
    <div className="grid min-h-96 place-items-center rounded-xl p-8 text-center" style={{ background: gradient, color: ink }}>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em]">OpenPalette</p>
        <h3 className="mt-4 text-6xl font-black tracking-tight">Color Field</h3>
      </div>
    </div>
  );
}

function SocialPreview({ primary, secondary, accent, surface, ink }: PreviewProps) {
  return (
    <div className="aspect-[1.91/1] rounded-xl p-5" style={{ background: primary, color: getReadableTextColor(primary) }}>
      <div className="flex h-full flex-col justify-between rounded-lg p-5" style={{ background: surface, color: ink }}>
        <h3 className="text-3xl font-semibold">Launch palette</h3>
        <div className="flex gap-2">
          {[secondary, accent, primary].map((color) => <span className="h-12 flex-1 rounded-md" key={color} style={{ background: color }} />)}
        </div>
      </div>
    </div>
  );
}

function TypographyPreview({ primary, secondary, accent, surface, ink }: PreviewProps) {
  return (
    <div className="rounded-xl p-6" style={{ background: surface, color: ink }}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Type scale</p>
      <h3 className="mt-3 text-5xl font-semibold">Readable by default</h3>
      <p className="mt-3 max-w-2xl text-lg" style={{ color: secondary }}>Preview headings, body text, links, and callouts against the active palette.</p>
      <button className="mt-5 rounded-md px-4 py-2 font-semibold" style={{ background: primary, color: getReadableTextColor(primary) }}>Primary action</button>
    </div>
  );
}

function BrandPreview({ colors, primary, secondary, accent, surface, ink }: PreviewProps & { colors: string[] }) {
  return (
    <div className="rounded-xl p-5" style={{ background: surface, color: ink }}>
      <div className="flex items-center gap-3">
        <span className="grid size-16 place-items-center rounded-xl text-xl font-black" style={{ background: primary, color: getReadableTextColor(primary) }}>B</span>
        <div>
          <h3 className="text-3xl font-semibold">Brand kit</h3>
          <p style={{ color: secondary }}>Logo, marks, token ramps, and accents.</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {colors.map((color) => <div className="h-24 rounded-lg p-2 font-mono text-xs" key={color} style={{ background: color, color: getReadableTextColor(color) }}>{color}</div>)}
      </div>
      <div className="mt-4 h-2 rounded-full" style={{ background: accent }} />
    </div>
  );
}

type PreviewProps = { primary: string; secondary: string; accent: string; surface: string; ink: string };

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

function fillColors(colors: string[]) {
  return [colors[0] ?? "#111827", colors[1] ?? "#64748B", colors[2] ?? "#F97316", colors[3] ?? "#F8FAFC", colors[4] ?? "#111827"];
}

function drawGradient(context: CanvasRenderingContext2D, width: number, height: number, colors: string[], kind: GradientKind, angle: number) {
  const gradient =
    kind === "radial"
      ? context.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height) / 1.5)
      : createCanvasLinearGradient(context, width, height, angle);
  colors.forEach((hex, index) => gradient.addColorStop(index / Math.max(colors.length - 1, 1), hex));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function createCanvasLinearGradient(context: CanvasRenderingContext2D, width: number, height: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * width;
  const y = Math.sin(radians) * height;
  return context.createLinearGradient(width / 2 - x / 2, height / 2 - y / 2, width / 2 + x / 2, height / 2 + y / 2);
}

function drawSwatches(context: CanvasRenderingContext2D, width: number, height: number, colors: string[]) {
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);
  const swatchWidth = width / colors.length;
  colors.forEach((hex, index) => {
    context.fillStyle = hex;
    context.fillRect(index * swatchWidth, 0, swatchWidth, height * 0.78);
    context.fillStyle = "#111827";
    context.font = "28px monospace";
    context.fillText(hex, index * swatchWidth + 24, height - 70);
  });
}

function extractPaletteFromPixels(data: Uint8ClampedArray, count: number, mode: "balanced" | "vibrant" | "muted") {
  const buckets = new Map<string, { r: number; g: number; b: number; hits: number; score: number }>();

  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];
    if (alpha < 180) {
      continue;
    }

    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const lightness = (max + min) / 510;
    const wantsVibrant = mode === "vibrant" ? saturation > 0.28 : true;
    const wantsMuted = mode === "muted" ? saturation < 0.55 && lightness > 0.18 && lightness < 0.88 : true;

    if (!wantsVibrant || !wantsMuted || lightness < 0.06 || lightness > 0.96) {
      continue;
    }

    const key = `${Math.round(r / 24) * 24}-${Math.round(g / 24) * 24}-${Math.round(b / 24) * 24}`;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, hits: 0, score: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.hits += 1;
    bucket.score += saturation + (1 - Math.abs(lightness - 0.5));
    buckets.set(key, bucket);
  }

  const selected: string[] = [];
  const candidates = [...buckets.values()]
    .map((bucket) => rgbToHex({ r: bucket.r / bucket.hits, g: bucket.g / bucket.hits, b: bucket.b / bucket.hits }))
    .sort((first, second) => getContrastHint(second).ratio - getContrastHint(first).ratio);

  for (const candidate of candidates) {
    if (selected.every((hex) => colorDistance(hex, candidate) > 48)) {
      selected.push(candidate);
    }
    if (selected.length >= count) {
      break;
    }
  }

  return selected;
}

function colorDistance(first: string, second: string) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

function createSimplePdf(colors: string[]) {
  const lines = ["OpenPalette palette sheet", "", ...colors.map((hex, index) => `${index + 1}. ${hex}`)];
  const stream = `BT /F1 24 Tf 72 740 Td (${lines.join(") Tj T* (")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f "];
  const body = objects
    .map((object, index) => {
      xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
      const entry = `${index + 1} 0 obj\n${object}\nendobj\n`;
      offset += entry.length;
      return entry;
    })
    .join("");
  const table = `xref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  return `%PDF-1.4\n${body}${table}`;
}

function extensionFor(format: ExportFormat) {
  return format === "Tailwind" ? "tailwind.config.js" : format === "Tokens" ? "tokens.json" : format.toLowerCase();
}
