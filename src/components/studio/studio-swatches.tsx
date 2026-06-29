"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  getReadableTextColor,
  normalizeHex,
  simulateVision,
} from "@/lib/palette";
import { generateHex } from "@/lib/palette/palette-engine";
import { getColorInfo } from "@/lib/palette/color-info";
import type { PaletteAPI } from "@/components/use-palette";
import type { VisionMode } from "@/lib/palette/types";

interface Props {
  palette: PaletteAPI;
  blindMode?: VisionMode;
}

export function StudioSwatches({ palette, blindMode }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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

  function moveColor(from: number, to: number) {
    const next = [...palette.colors];
    [next[from], next[to]] = [next[to], next[from]];
    palette.setColors(next);
  }

  function addColorAt(idx: number) {
    if (palette.colors.length >= 10) return;
    const hex = generateHex(Math.random() * 360);
    const insertAt = Math.min(idx + 1, palette.colors.length);
    palette.setColors([
      ...palette.colors.slice(0, insertAt),
      { id: crypto.randomUUID(), hex, alpha: 100, locked: false },
      ...palette.colors.slice(insertAt),
    ]);
  }

  function removeColor(id: string) {
    if (palette.colors.length <= 2) return;
    palette.setColors(palette.colors.filter((c) => c.id !== id));
  }

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 relative">
      <div ref={dropRef} className="flex flex-row" style={{ minHeight: "calc(100vh - 14rem)" }}>
        {palette.colors.map((color, idx) => {
          const nh = normalizeHex(color.hex) ?? "#111827";
          const displayHex = blindMode && blindMode !== "none" ? simulateVision(nh, blindMode) : nh;
          const tc = getReadableTextColor(nh);
          const colorInfo = getColorInfo(nh);
          const isDark = tc === "#F9FAFB";

          return (
            <div key={color.id} className="relative flex-1 flex flex-col min-w-0 select-none"
              style={{ backgroundColor: displayHex }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                navigator.clipboard.writeText(nh).catch(() => {});
                window.dispatchEvent(new CustomEvent("op-toast", { detail: { msg: `Copied ${nh}` } }));
              }}
            >
              {/* Grab handle — full height */}
              <div
                className={`absolute inset-0 z-10 ${dragIdx === idx ? "opacity-50" : ""}`}
                style={{ cursor: dragIdx !== null ? "grabbing" : hoveredIdx === idx ? "grab" : "default" }}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={() => setDragIdx(null)}
              />

              {/* Grip dots */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 opacity-30 pointer-events-none" style={{ color: tc }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/><circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/></svg>
              </div>

              {/* Lock indicator */}
              {color.locked && (
                <div className="absolute top-2 right-2 z-20 text-xs drop-shadow-sm pointer-events-none" style={{ color: tc }}>🔒</div>
              )}

              {/* HEX + color name */}
              <div className="absolute bottom-5 left-0 right-0 text-center px-2 z-20 pointer-events-none">
                <p className="font-mono text-lg sm:text-xl lg:text-2xl font-black tracking-tight drop-shadow-sm" style={{ color: tc }}>{nh}</p>
                <p className="text-[10px] sm:text-xs font-semibold mt-0.5 drop-shadow-sm" style={{ color: tc, opacity: 0.8 }}>{colorInfo.name}</p>
              </div>

              {/* Vertical hover action rail — centered */}
              {hoveredIdx === idx && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col gap-1.5 p-1.5 rounded-2xl pointer-events-auto backdrop-blur-lg"
                    style={{ background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)" }}>
                    <RailBtn onClick={() => removeColor(color.id)} disabled={palette.colors.length <= 2} label="Remove">✕</RailBtn>
                    <RailBtn onClick={async () => { try { await navigator.clipboard.writeText(nh); palette.announce("Copied"); } catch {} }} label="Copy">📋</RailBtn>
                    <RailBtn onClick={() => palette.toggleLock(color.id)} label={color.locked ? "Unlock" : "Lock"}>{color.locked ? "🔒" : "🔓"}</RailBtn>
                    {idx > 0 && <RailBtn onClick={() => moveColor(idx, idx - 1)} label="Move left">◀</RailBtn>}
                    {idx < palette.colors.length - 1 && <RailBtn onClick={() => moveColor(idx, idx + 1)} label="Move right">▶</RailBtn>}
                    <RailBtn onClick={() => addColorAt(idx)} label="Insert after" disabled={palette.colors.length >= 10}>+</RailBtn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RailBtn({ children, onClick, label, disabled }: {
  children: React.ReactNode; onClick: () => void; label: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      aria-label={label} title={label}
      className="size-8 flex items-center justify-center rounded-xl text-sm font-bold transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ background: "rgba(0,0,0,0.2)", color: "inherit" }}
    >{children}</button>
  );
}
