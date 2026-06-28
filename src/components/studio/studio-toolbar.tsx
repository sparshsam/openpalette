"use client";

import { useMemo } from "react";
import {
  hexToHsl,
  hslToHex,
  maxPaletteSize,
  minPaletteSize,
  paletteModes,
  type PaletteColor,
} from "@/lib/palette";
import { hexToHsv, hsvToHex } from "@/lib/palette/color-conversions";
import type { PaletteAPI } from "@/components/use-palette";

interface Props {
  palette: PaletteAPI;
}

export function StudioToolbar({ palette }: Props) {
  return (
    <>
      {/* Controls strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black tracking-tight">Studio</h1>
          <span className="text-xs text-[var(--text-muted)] opacity-60">{palette.notice}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-full surface backdrop-blur px-4 py-1.5 text-sm font-semibold text-page hover-bg-muted transition" onClick={palette.generate}>Generate (Space)</button>
          <button className="rounded-full surface backdrop-blur px-4 py-1.5 text-sm font-semibold text-page hover-bg-muted transition disabled:opacity-30" disabled={palette.undoStack.length === 0} onClick={palette.undo}>Undo (U)</button>
        </div>
      </div>

      {/* Quick-tune sliders */}
      <QuickTuneSliders palette={palette} />

      {/* Mode strip */}
      <div className="bg-[#fff5fc] dark:bg-[#2d001e] border-b border-[rgba(26,0,26,0.08)] dark:border-[rgba(255,224,245,0.06)] px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-1.5 items-center">
        {paletteModes.map((m) => <button key={m} className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${
          palette.mode === m
            ? "bg-[#ff66c4] text-[#1a001a] dark:bg-[#ff85d0] dark:text-[#1a0012] shadow-sm"
            : "text-[#6b3a5a] dark:text-[#d4a0c0] hover:bg-[#f0d6e8] dark:hover:bg-[#3d0a28] hover:text-[#3a0d2b] dark:hover:text-[#ffe0f5]"
        }`} onClick={() => palette.switchMode(m)}>{m}</button>)}
        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6b3a5a] dark:text-[#d4a0c0] ml-2">
          Size {palette.colors.length}
          <input className="w-14" min={minPaletteSize} max={maxPaletteSize} type="range" value={palette.colors.length} onChange={(e) => palette.setSize(Number(e.target.value))} />
        </label>
        <button className="rounded-full bg-[#f0d6e8] dark:bg-[#3d0a28] px-2 py-1 text-xs text-[#6b3a5a] dark:text-[#d4a0c0] hover:text-[#3a0d2b] dark:hover:text-[#ffe0f5] transition disabled:opacity-30" disabled={palette.colors.length <= minPaletteSize} onClick={() => palette.setSize(palette.colors.length - 1)}>−</button>
        <button className="rounded-full bg-[#f0d6e8] dark:bg-[#3d0a28] px-2 py-1 text-xs text-[#6b3a5a] dark:text-[#d4a0c0] hover:text-[#3a0d2b] dark:hover:text-[#ffe0f5] transition disabled:opacity-30" disabled={palette.colors.length >= maxPaletteSize} onClick={() => palette.setSize(palette.colors.length + 1)}>+</button>
      </div>
    </>
  );
}

function QuickTuneSliders({ palette }: Props) {
  const baseHex = palette.paletteHex[0] ?? "#ff66c4";
  const baseHsl = useMemo(() => hexToHsl(baseHex), [baseHex]);
  const baseHsv = useMemo(() => hexToHsv(baseHex), [baseHex]);

  function updateAll(updater: (c: PaletteColor, idx: number) => string) {
    const next = palette.colors.map((c, i) => ({
      ...c,
      hex: updater(c, i),
    }));
    palette.setColors(next);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex flex-wrap gap-4 items-center">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
        Saturation
        <input
          className="w-20"
          type="range" min={0} max={100}
          value={baseHsl.s}
          onChange={(e) => {
            const v = Number(e.target.value);
            updateAll((c) => {
              const h = hexToHsl(c.hex);
              return hslToHex(h.h, v, h.l);
            });
          }}
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
        Brightness
        <input
          className="w-20"
          type="range" min={0} max={100}
          value={baseHsv.v}
          onChange={(e) => {
            const v = Number(e.target.value);
            updateAll((c) => {
              const h = hexToHsv(c.hex);
              return hsvToHex(h.h, h.s, v);
            });
          }}
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
        Temperature
        <input
          className="w-20"
          type="range" min={-50} max={50} value={0}
          onChange={(e) => {
            const shift = Number(e.target.value);
            updateAll((c) => {
              const h = hexToHsl(c.hex);
              return hslToHex((h.h + shift + 360) % 360, h.s, h.l);
            });
          }}
        />
      </label>
    </div>
  );
}
