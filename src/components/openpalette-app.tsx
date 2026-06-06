"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createExportSnippets,
  createPalette,
  generatePalette,
  getContrastHint,
  getReadableTextColor,
  normalizeHex,
  type ExportFormat,
  type PaletteColor,
  type SavedPalette,
} from "@/lib/palette";

const paletteStorageKey = "openpalette.current";
const savedStorageKey = "openpalette.saved";
const themeStorageKey = "openpalette.theme";
const exportFormats: ExportFormat[] = ["CSS", "Tailwind", "JSON", "SVG"];

type Theme = "light" | "dark";

export function OpenPaletteApp() {
  const [colors, setColors] = useState<PaletteColor[]>(() => createPalette());
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
  const [notice, setNotice] = useState("Ready");
  const [hydrated, setHydrated] = useState(false);
  const [undoStack, setUndoStack] = useState<PaletteColor[][]>([]);
  const [activeExportFormat, setActiveExportFormat] = useState<ExportFormat>("CSS");
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const storedPalette = window.localStorage.getItem(paletteStorageKey);
    const storedSaved = window.localStorage.getItem(savedStorageKey);
    const storedTheme = window.localStorage.getItem(themeStorageKey) as Theme | null;
    let nextColors: PaletteColor[] | null = null;
    let nextSavedPalettes: SavedPalette[] | null = null;
    let nextTheme: Theme | null = null;

    if (storedPalette) {
      try {
        const parsed = JSON.parse(storedPalette) as PaletteColor[];
        if (Array.isArray(parsed) && parsed.length === 5) {
          nextColors = parsed;
        }
      } catch {
        window.localStorage.removeItem(paletteStorageKey);
      }
    }

    if (storedSaved) {
      try {
        const parsed = JSON.parse(storedSaved) as SavedPalette[];
        if (Array.isArray(parsed)) {
          nextSavedPalettes = parsed;
        }
      } catch {
        window.localStorage.removeItem(savedStorageKey);
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

      if (nextSavedPalettes) {
        setSavedPalettes(nextSavedPalettes);
      }

      if (nextTheme) {
        setTheme(nextTheme);
      }

      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(paletteStorageKey, JSON.stringify(colors));
  }, [colors, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(savedStorageKey, JSON.stringify(savedPalettes));
  }, [savedPalettes, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    if (hydrated) {
      window.localStorage.setItem(themeStorageKey, theme);
    }
  }, [theme, hydrated]);

  const paletteHex = useMemo(() => colors.map((color) => normalizeHex(color.hex) ?? color.hex), [colors]);
  const exportSnippets = useMemo(() => createExportSnippets(paletteHex), [paletteHex]);
  const contrastHints = useMemo(() => paletteHex.map((hex) => getContrastHint(hex)), [paletteHex]);

  const announce = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice("Ready"), 1800);
  }, []);

  const generate = useCallback(() => {
    setColors((current) => {
      setUndoStack((stack) => [current, ...stack].slice(0, 12));
      return generatePalette(current);
    });
    announce("Generated a fresh palette");
  }, [announce]);

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      const [previous, ...rest] = stack;

      if (!previous) {
        announce("Nothing to undo");
        return stack;
      }

      setColors(previous);
      announce("Restored previous palette");
      return rest;
    });
  }, [announce]);

  const savePalette = useCallback(() => {
    const savedPalette: SavedPalette = {
      id: crypto.randomUUID(),
      name: `Palette ${savedPalettes.length + 1}`,
      colors: paletteHex,
      createdAt: new Date().toISOString(),
    };

    setSavedPalettes((current) => [savedPalette, ...current].slice(0, 12));
    announce("Palette saved locally");
  }, [announce, paletteHex, savedPalettes.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        setHelpOpen(false);
        setPendingDeleteId(null);
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

      if (event.key === "?") {
        event.preventDefault();
        setHelpOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [generate, savePalette, undo]);

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      announce(`${label} copied`);
    } catch {
      announce("Copy failed");
    }
  }

  function updateHex(id: string, value: string) {
    const normalized = normalizeHex(value);
    setColors((current) =>
      current.map((color) => (color.id === id ? { ...color, hex: normalized ?? value.toUpperCase() } : color)),
    );
  }

  function commitHex(id: string) {
    setColors((current) =>
      current.map((color) => {
        if (color.id !== id) {
          return color;
        }

        return { ...color, hex: normalizeHex(color.hex) ?? "#111827" };
      }),
    );
  }

  function toggleLock(id: string) {
    setColors((current) =>
      current.map((color) => (color.id === id ? { ...color, locked: !color.locked } : color)),
    );
  }

  function renameSavedPalette(id: string, name: string) {
    setSavedPalettes((current) =>
      current.map((palette) => (palette.id === id ? { ...palette, name } : palette)),
    );
  }

  function commitSavedPaletteName(id: string) {
    setSavedPalettes((current) =>
      current.map((palette, index) => {
        if (palette.id !== id) {
          return palette;
        }

        const trimmed = palette.name.trim();

        return {
          ...palette,
          name: trimmed.length > 0 ? trimmed : `Palette ${index + 1}`,
        };
      }),
    );
  }

  function loadPalette(savedPalette: SavedPalette) {
    setUndoStack((stack) => [colors, ...stack].slice(0, 12));
    setColors(createPalette(savedPalette.colors));
    setPendingDeleteId(null);
    announce(`${savedPalette.name} loaded`);
  }

  function removeSavedPalette(id: string) {
    setSavedPalettes((current) => current.filter((palette) => palette.id !== id));
    setPendingDeleteId(null);
    announce("Saved palette removed");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="#generator" className="inline-flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-[var(--foreground)] text-sm font-bold text-[var(--background)]">
                OP
              </span>
              <span>
                <span className="block text-xl font-semibold tracking-tight">OpenPalette</span>
                <span className="block text-sm text-[var(--muted)]">Open-source color systems, generated locally.</span>
              </span>
            </a>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Palette actions">
            <button className="button button-secondary" type="button" onClick={savePalette}>
              Save
            </button>
            <button
              className="button button-secondary"
              disabled={undoStack.length === 0}
              type="button"
              onClick={undo}
            >
              Undo
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => copyText(paletteHex.join(" "), "Palette")}
            >
              Copy palette
            </button>
            <button
              aria-expanded={helpOpen}
              className="button button-secondary"
              type="button"
              onClick={() => setHelpOpen((open) => !open)}
            >
              Shortcuts
            </button>
            <button
              aria-pressed={theme === "dark"}
              className="button button-secondary"
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? "Dark" : "Light"} mode
            </button>
            <button className="button button-primary" type="button" onClick={generate}>
              Generate
            </button>
          </nav>
        </header>

        {helpOpen ? (
          <section
            aria-label="Keyboard shortcuts"
            className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Keyboard shortcuts
                </h2>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                  <ShortcutKey keys="Space" label="Generate unlocked colors" />
                  <ShortcutKey keys="U" label="Undo generation or load" />
                  <ShortcutKey keys="S" label="Save active palette" />
                  <ShortcutKey keys="?" label="Toggle this panel" />
                </dl>
              </div>
              <button className="button button-secondary" type="button" onClick={() => setHelpOpen(false)}>
                Close
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid min-w-0 flex-1 gap-6 py-6 lg:grid-cols-[1fr_340px]" id="generator">
          <div className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Five colors. Fast decisions.</h1>
                <p className="text-sm text-[var(--muted)]">
                  Press Space to generate. Lock colors you want to keep. Export when the set feels right.
                </p>
              </div>
              <p
                aria-live="polite"
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]"
                role="status"
              >
                {notice}
              </p>
            </div>

            <div className="grid flex-1 grid-cols-1 sm:grid-cols-5">
              {colors.map((color, index) => {
                const normalizedHex = normalizeHex(color.hex) ?? "#111827";
                const textColor = getReadableTextColor(normalizedHex);
                const hint = contrastHints[index];

                return (
                  <article
                    className="group flex min-h-[210px] flex-col justify-between p-4 transition-transform sm:min-h-0"
                    key={color.id}
                    style={{ backgroundColor: normalizedHex, color: textColor }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-black/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <button
                        aria-label={color.locked ? `Unlock ${normalizedHex}` : `Lock ${normalizedHex}`}
                        className="rounded-full bg-black/15 px-3 py-1 text-xs font-semibold backdrop-blur transition hover:bg-black/25"
                        type="button"
                        onClick={() => toggleLock(color.id)}
                      >
                        {color.locked ? "Locked" : "Lock"}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg bg-black/15 p-3 text-xs font-semibold backdrop-blur">
                        <p>Best text: {hint.bestTextColor === "#000000" ? "black" : "white"}</p>
                        <p>
                          Contrast: {hint.ratio.toFixed(2)} · {hint.rating}
                        </p>
                      </div>
                      <label className="block">
                        <span className="sr-only">HEX value for color {index + 1}</span>
                        <input
                          className="w-full rounded-lg border border-white/30 bg-white/20 px-3 py-2 font-mono text-lg font-semibold uppercase outline-none backdrop-blur placeholder:text-current/70 focus:border-white"
                          inputMode="text"
                          maxLength={7}
                          pattern="#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?"
                          value={color.hex}
                          spellCheck={false}
                          onBlur={() => commitHex(color.id)}
                          onChange={(event) => updateHex(color.id, event.target.value)}
                        />
                      </label>
                      <button
                        className="w-full rounded-lg bg-black/20 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-black/30"
                        type="button"
                        onClick={() => copyText(normalizedHex, normalizedHex)}
                      >
                        Copy HEX
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Current palette</h2>
              <div className="mt-4 space-y-3">
                {paletteHex.map((hex, index) => {
                  const hint = contrastHints[index];

                  return (
                    <button
                      aria-label={`Copy ${hex}`}
                      className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-2 text-left transition hover:bg-[var(--subtle)]"
                      key={`${hex}-${index}`}
                      type="button"
                      onClick={() => copyText(hex, hex)}
                    >
                      <span
                        aria-hidden="true"
                        className="size-9 rounded-md border border-black/10"
                        style={{ backgroundColor: hex }}
                      />
                      <span>
                        <span className="block font-mono text-sm font-semibold">{hex}</span>
                        <span className="block text-xs text-[var(--muted)]">
                          {hint.bestTextColor === "#000000" ? "Black" : "White"} text · {hint.ratio.toFixed(2)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Saved locally</h2>
                <span className="text-xs text-[var(--muted)]">{savedPalettes.length}/12</span>
              </div>

              {savedPalettes.length === 0 ? (
                <p className="mt-4 rounded-lg bg-[var(--subtle)] p-3 text-sm text-[var(--muted)]">
                  Saved palettes stay in this browser with localStorage.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {savedPalettes.map((savedPalette) => (
                    <div className="rounded-lg border border-[var(--border)] p-3" key={savedPalette.id}>
                      <label className="block">
                        <span className="sr-only">Saved palette name</span>
                        <input
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm font-semibold outline-none focus:border-[var(--foreground)]"
                          value={savedPalette.name}
                          onBlur={() => commitSavedPaletteName(savedPalette.id)}
                          onChange={(event) => renameSavedPalette(savedPalette.id, event.target.value)}
                        />
                      </label>
                      <button className="mt-2 w-full text-left" type="button" onClick={() => loadPalette(savedPalette)}>
                        <span className="sr-only">Load {savedPalette.name}</span>
                        <span className="grid grid-cols-5 overflow-hidden rounded-md">
                          {savedPalette.colors.map((hex, index) => (
                            <span
                              aria-hidden="true"
                              className="h-8"
                              key={`${hex}-${index}`}
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                      </button>
                      {pendingDeleteId === savedPalette.id ? (
                        <div className="mt-3 flex gap-2">
                          <button className="button button-primary flex-1" type="button" onClick={() => removeSavedPalette(savedPalette.id)}>
                            Confirm
                          </button>
                          <button className="button button-secondary flex-1" type="button" onClick={() => setPendingDeleteId(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          aria-label={`Delete ${savedPalette.name}`}
                          className="mt-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
                          type="button"
                          onClick={() => setPendingDeleteId(savedPalette.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>

        <section className="grid min-w-0 gap-4 pb-8 lg:grid-cols-[260px_1fr]" id="exports">
          <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Export palette</h2>
            <div className="mt-4 grid gap-2" role="tablist" aria-label="Export formats">
              {exportFormats.map((format) => (
                <button
                  aria-selected={activeExportFormat === format}
                  className={`button justify-start ${
                    activeExportFormat === format ? "button-primary" : "button-secondary"
                  }`}
                  key={format}
                  role="tab"
                  type="button"
                  onClick={() => setActiveExportFormat(format)}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{activeExportFormat} export</h2>
                <p className="text-sm text-[var(--muted)]">
                  Copy this snippet into your design tokens, app styles, docs, or handoff notes.
                </p>
              </div>
              <button
                className="button button-primary"
                type="button"
                onClick={() => copyText(exportSnippets[activeExportFormat], `${activeExportFormat} export`)}
              >
                Copy {activeExportFormat}
              </button>
            </div>
            <pre className="mt-4 max-h-[420px] max-w-full overflow-auto rounded-lg bg-[var(--subtle)] p-4 text-sm leading-6">
              <code>{exportSnippets[activeExportFormat]}</code>
            </pre>
          </div>
        </section>
      </div>
    </main>
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
