"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPalette,
  minPaletteSize,
  maxPaletteSize,
  parsePaletteInput,
  extractPaletteFromPixels,
  type ExtractionMode,
} from "@/lib/palette";
import { usePalette } from "@/components/use-palette";
import { useAutoSave } from "@/components/use-auto-save";
import type { VisionMode } from "@/lib/palette/types";
import { StudioToolbar } from "./studio-toolbar";
import { StudioSwatches } from "./studio-swatches";
import { StudioColorEditor } from "./studio-color-editor";
import { StudioColorInfo } from "./studio-color-info";
import { ColorBlindPreview } from "./color-blind-preview";

export function StudioSection() {
  const palette = usePalette();
  const [advanced, setAdvanced] = useState(false);
  const [importText, setImportText] = useState("");
  const [extractionCount, setExtractionCount] = useState(5);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("balanced");
  const [blindMode, setBlindMode] = useState<VisionMode>("none");

  // Auto-save / restore
  const restore = useCallback(
    (saved: { colors: { id: string; hex: string; alpha: number; locked: boolean }[]; mode: string }) => {
      const nc = saved.colors.map((c) => ({ id: c.id, hex: c.hex, alpha: c.alpha, locked: c.locked }));
      palette.setColors(nc);
      palette.setMode(saved.mode as "Analogous" | "Monochromatic" | "Complementary" | "Triadic" | "Split Complementary" | "Tetradic" | "Random");
    },
    [palette],
  );
  useAutoSave("studio", palette.colors, palette.mode, restore);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); palette.generate(); }
      if (e.key.toLowerCase() === "u") { e.preventDefault(); palette.undo(); }
      if (e.key.toLowerCase() === "l") { e.preventDefault(); if (palette.colors.length > 0) palette.toggleLock(palette.colors[0].id); }
      if (e.key.toLowerCase() === "c") { e.preventDefault(); if (palette.paletteHex[0]) { navigator.clipboard.writeText(palette.paletteHex[0]).catch(() => {}); palette.announce("HEX copied"); } }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [palette]);

  // Listen for tool navigation & editor toggle events
  useEffect(() => {
    const navHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) {
        if (detail.tab === "import") {
          document.querySelector<HTMLTextAreaElement>("textarea")?.focus();
        }
      }
    };
    const editHandler = () => setAdvanced((o) => !o);
    window.addEventListener("op-navigate", navHandler);
    window.addEventListener("op-toggle-editor", editHandler);
    return () => {
      window.removeEventListener("op-navigate", navHandler);
      window.removeEventListener("op-toggle-editor", editHandler);
    };
  }, []);

  async function extractFromImage(file: File | null) {
    if (!file) return;
    try {
      const bm = await createImageBitmap(file);
      const can = document.createElement("canvas");
      const ctx = can.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const ms = 180, sc = Math.min(ms / bm.width, ms / bm.height, 1);
      can.width = Math.max(1, Math.round(bm.width * sc));
      can.height = Math.max(1, Math.round(bm.height * sc));
      ctx.drawImage(bm, 0, 0, can.width, can.height);
      const ex = extractPaletteFromPixels(ctx.getImageData(0, 0, can.width, can.height).data, extractionCount, extractionMode);
      if (ex.length >= minPaletteSize) palette.setPalette(createPalette(ex, ex.length), "Random", `Extracted ${ex.length}`);
      else palette.announce("No colors");
    } catch { palette.announce("Extraction failed"); }
  }

  return (
    <section>
      <StudioToolbar palette={palette} />

      {/* Swatches */}
      <StudioSwatches palette={palette} blindMode={blindMode} />

      {/* Quick access: contrast hints + blind mode toggle + copy link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
          Simulate
          <select className="rounded-full surface px-3 py-1.5 text-xs text-page outline-none" value={blindMode} onChange={(e) => setBlindMode(e.target.value as VisionMode)}>
            <option value="none">Normal</option>
            <option value="protanopia">Protanopia</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="tritanopia">Tritanopia</option>
          </select>
        </label>
        <button className="rounded-full surface px-3 py-1.5 text-xs font-semibold text-page hover-bg-muted transition" onClick={() => setAdvanced((o) => !o)}>
          {advanced ? "Hide Editor" : "Full Editor"}
        </button>
        <button
          className="rounded-full surface px-3 py-1.5 text-xs font-semibold text-page hover-bg-muted transition"
          onClick={async () => {
            const { encodePaletteState } = await import("@/lib/palette/import-engine");
            const encoded = encodePaletteState(palette.colors, palette.mode);
            const url = `${window.location.origin}${window.location.pathname}?palette=${encoded}`;
            try { await navigator.clipboard.writeText(url); palette.announce("Share link copied"); } catch { palette.announce("Copy failed"); }
          }}
        >
          Copy Share Link
        </button>
      </div>

      {/* Full color editor (all spaces) */}
      {advanced && <StudioColorEditor palette={palette} />}

      {/* Color information panel */}
      {advanced && <StudioColorInfo palette={palette} />}

      {/* Color-blind rendered preview */}
      <ColorBlindPreview palette={palette} />

      {/* Import */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3">
        <h3 className="text-xs font-bold tracking-wider uppercase text-secondary">Import Palette</h3>
        <div className="max-w-xl space-y-3">
          <textarea
            className="w-full rounded-2xl surface p-4 font-mono text-sm min-h-[80px] text-page outline-none placeholder:text-muted"
            placeholder="Paste HEX (#ff66c4), JSON, CSS variables, or Coolors URL..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <button
              className="rounded-full bg-white text-[#1a001a] px-5 py-2 text-sm font-semibold hover:bg-white/90 transition"
              onClick={() => {
                const p = parsePaletteInput(importText);
                if (p.length >= minPaletteSize) palette.setPalette(createPalette(p, p.length), palette.mode, `Imported ${p.length}`);
                else palette.announce("Need 2+ colors");
              }}
            >
              Import
            </button>
            <div className="rounded-2xl px-4 py-2 surface-muted text-sm cursor-pointer">
              <label className="cursor-pointer text-secondary">
                <span className="font-semibold text-page">Drop</span> or <span className="underline">browse</span>
                <input accept="image/*" className="hidden" type="file" onChange={(e) => extractFromImage(e.target.files?.item(0) ?? null)} />
              </label>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-secondary">
              Colors {extractionCount}
              <input className="w-16" min={minPaletteSize} max={maxPaletteSize} type="range" value={extractionCount} onChange={(e) => setExtractionCount(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-secondary">
              Mode
              <select className="rounded-full surface px-3 py-1 text-xs text-page outline-none" value={extractionMode} onChange={(e) => setExtractionMode(e.target.value as ExtractionMode)}>
                <option>Balanced</option>
                <option>Vibrant</option>
                <option>Muted</option>
              </select>
            </label>
          </div>
        </div>
      </div>

    </section>
  );
}
