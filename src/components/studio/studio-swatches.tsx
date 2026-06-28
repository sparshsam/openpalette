"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  getReadableTextColor,
  hexToHsl,
  hexToRgb,
  normalizeHex,
  simulateVision,
} from "@/lib/palette";
import type { PaletteAPI } from "@/components/use-palette";
import type { VisionMode } from "@/lib/palette/types";

interface Props {
  palette: PaletteAPI;
  blindMode?: VisionMode;
}

export function StudioSwatches({ palette, blindMode }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  function handleDrop(e: DragEvent, targetIdx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) return;
    const next = [...palette.colors];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    palette.setColors(next);
    setDragIdx(null);
  }

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 border-y border-[rgba(255,255,255,0.2)]">
      <div ref={dropRef} className="flex flex-row h-dvh">
        {palette.colors.map((color, idx) => {
          const nh = normalizeHex(color.hex) ?? "#111827";
          const displayHex = blindMode && blindMode !== "none" ? simulateVision(nh, blindMode) : nh;
          const hsl = hexToHsl(nh);
          const rgb = hexToRgb(nh);
          const tc = getReadableTextColor(nh);
          return (
            <div
              key={color.id}
              className={`flex-1 flex flex-col justify-end p-4 sm:p-6 lg:p-8 min-w-0 transition-opacity ${dragIdx === idx ? "opacity-50" : ""}`}
              style={{ backgroundColor: displayHex, color: tc }}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => setDragIdx(null)}
            >
              {/* Top controls */}
              <div className="flex items-center justify-between mb-4">
                <span className="rounded-full bg-black/15 backdrop-blur px-3 py-1 text-xs font-semibold cursor-grab active:cursor-grabbing" title="Drag to reorder">
                  ⋮&#8203;{idx + 1}/{palette.colors.length}
                </span>
                <div className="flex gap-2">
                  <button className="rounded-full bg-black/15 backdrop-blur px-3 py-1 text-xs font-semibold hover:bg-black/30 transition" onClick={() => palette.toggleLock(color.id)}>{color.locked ? "🔒" : "🔓"}</button>
                  <button className="rounded-full bg-black/15 backdrop-blur px-3 py-1 text-xs font-semibold hover:bg-black/30 transition disabled:opacity-30" disabled={palette.colors.length <= 2} onClick={() => { const next = palette.colors.filter((c) => c.id !== color.id); palette.setColors(next); }}>✕</button>
                </div>
              </div>

              {/* Bottom controls */}
              <div className="space-y-2">
                <p className="font-mono text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm">{nh}</p>
                <p className="text-xs opacity-70 font-mono">hsl({hsl.h}, {hsl.s}%, {hsl.l}%) · rgb({rgb.r}, {rgb.g}, {rgb.b})</p>

                <div className="flex flex-wrap gap-2 items-center pt-1">
                  <input
                    className="h-9 rounded-full border border-default surface px-3 py-1 font-mono text-sm font-semibold text-center uppercase outline-none focus:border-white w-28 backdrop-blur"
                    value={color.hex}
                    spellCheck={false}
                    onChange={(e) => palette.updateHex(color.id, e.target.value)}
                  />
                  <input
                    aria-label={`Color ${idx + 1}`}
                    className="h-9 rounded-full border border-default bg-transparent cursor-pointer w-12"
                    type="color"
                    value={nh}
                    onChange={(e) => palette.updateHex(color.id, e.target.value)}
                  />
                  <label className="flex items-center gap-1.5 text-xs font-semibold opacity-80">
                    α {color.alpha}%
                    <input className="w-16" min={0} max={100} type="range" value={color.alpha} onChange={(e) => palette.updateAlpha(color.id, Number(e.target.value))} />
                  </label>
                  <button
                    className="rounded-full bg-black/15 backdrop-blur px-3 py-1 text-xs font-semibold hover:bg-black/30 transition"
                    onClick={async () => { try { await navigator.clipboard.writeText(nh); palette.announce("HEX copied"); } catch {} }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
