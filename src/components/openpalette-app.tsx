"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPalette,
  generatePalette,
  getReadableTextColor,
  normalizeHex,
  type PaletteColor,
  type SavedPalette,
} from "@/lib/palette";

const paletteStorageKey = "openpalette.current";
const savedStorageKey = "openpalette.saved";
const themeStorageKey = "openpalette.theme";

type Theme = "light" | "dark";

export function OpenPaletteApp() {
  const [colors, setColors] = useState<PaletteColor[]>(() => createPalette());
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
  const [notice, setNotice] = useState("Ready");
  const [hydrated, setHydrated] = useState(false);

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

  const paletteHex = useMemo(() => colors.map((color) => color.hex), [colors]);

  const announce = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice("Ready"), 1800);
  }, []);

  const generate = useCallback(() => {
    setColors((current) => generatePalette(current));
    announce("Generated a fresh palette");
  }, [announce]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.code === "Space" && !isEditing) {
        event.preventDefault();
        generate();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [generate]);

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

  function savePalette() {
    const savedPalette: SavedPalette = {
      id: crypto.randomUUID(),
      name: `Palette ${savedPalettes.length + 1}`,
      colors: paletteHex,
      createdAt: new Date().toISOString(),
    };

    setSavedPalettes((current) => [savedPalette, ...current].slice(0, 12));
    announce("Palette saved locally");
  }

  function loadPalette(savedPalette: SavedPalette) {
    setColors(createPalette(savedPalette.colors));
    announce(`${savedPalette.name} loaded`);
  }

  function removeSavedPalette(id: string) {
    setSavedPalettes((current) => current.filter((palette) => palette.id !== id));
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
              type="button"
              onClick={() => copyText(paletteHex.join(" "), "Palette")}
            >
              Copy palette
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

        <section className="grid flex-1 gap-6 py-6 lg:grid-cols-[1fr_320px]" id="generator">
          <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Five colors. Fast decisions.</h1>
                <p className="text-sm text-[var(--muted)]">Press Space to generate. Lock colors you want to keep.</p>
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
                const textColor = getReadableTextColor(color.hex);

                return (
                  <article
                    className="group flex min-h-[180px] flex-col justify-between p-4 transition-transform sm:min-h-0"
                    key={color.id}
                    style={{ backgroundColor: normalizeHex(color.hex) ?? "#111827", color: textColor }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-black/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <button
                        aria-label={color.locked ? `Unlock ${color.hex}` : `Lock ${color.hex}`}
                        className="rounded-full bg-black/15 px-3 py-1 text-xs font-semibold backdrop-blur transition hover:bg-black/25"
                        type="button"
                        onClick={() => toggleLock(color.id)}
                      >
                        {color.locked ? "Locked" : "Lock"}
                      </button>
                    </div>

                    <div className="space-y-3">
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
                        onClick={() => copyText(normalizeHex(color.hex) ?? color.hex, color.hex)}
                      >
                        Copy HEX
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Current palette</h2>
              <div className="mt-4 space-y-3">
                {paletteHex.map((hex) => (
                  <button
                    aria-label={`Copy ${hex}`}
                    className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-2 text-left transition hover:bg-[var(--subtle)]"
                    key={hex}
                    type="button"
                    onClick={() => copyText(hex, hex)}
                  >
                    <span aria-hidden="true" className="size-9 rounded-md border border-black/10" style={{ backgroundColor: hex }} />
                    <span className="font-mono text-sm font-semibold">{hex}</span>
                  </button>
                ))}
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
                      <button className="w-full text-left" type="button" onClick={() => loadPalette(savedPalette)}>
                        <span className="block text-sm font-semibold">{savedPalette.name}</span>
                        <span className="mt-2 grid grid-cols-5 overflow-hidden rounded-md">
                          {savedPalette.colors.map((hex) => (
                            <span aria-hidden="true" className="h-8" key={hex} style={{ backgroundColor: hex }} />
                          ))}
                        </span>
                      </button>
                      <button
                        aria-label={`Remove ${savedPalette.name}`}
                        className="mt-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
                        type="button"
                        onClick={() => removeSavedPalette(savedPalette.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
