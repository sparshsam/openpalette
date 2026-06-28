"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  getReadableTextColor,
  normalizeHex,
  simulateVision,
} from "@/lib/palette";
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
            <div
              key={color.id}
              className={`relative flex-1 flex flex-col justify-center items-center min-w-0 select-none transition-all
                ${dragIdx === idx ? "opacity-50 scale-95" : ""}
                ${dragIdx !== null && dragIdx !== idx ? "cursor-pointer" : ""}`}
              style={{ backgroundColor: displayHex, color: tc }}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => setDragIdx(null)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* HEX label - always visible near bottom */}
              <div className="absolute bottom-6 left-0 right-0 text-center px-2 pointer-events-none">
                <p className="font-mono text-xl sm:text-2xl lg:text-3xl font-black tracking-tight drop-shadow-sm">{nh}</p>
                <p className="text-[10px] sm:text-xs opacity-80 font-semibold mt-0.5 drop-shadow-sm">{colorInfo.name}</p>
              </div>

              {/* Hover action rail - centered vertically */}
              {hoveredIdx === idx && (
                <div className={`absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10`}>
                  <div className={`flex flex-col gap-2 p-1.5 rounded-2xl ${isDark ? "bg-white/15 backdrop-blur" : "bg-black/10 backdrop-blur"} pointer-events-auto`}>
                    <SwatchAction onClick={() => { const next = palette.colors.filter((c) => c.id !== color.id); palette.setColors(next); }} label="Delete" disabled={palette.colors.length <= 2}>✕</SwatchAction>
                    <SwatchAction onClick={async () => { try { await navigator.clipboard.writeText(nh); palette.announce("Copied"); } catch {} }} label="Copy">⬡</SwatchAction>
                    <SwatchAction onClick={() => palette.toggleLock(color.id)} label={color.locked ? "Unlock" : "Lock"}>{color.locked ? "🔒" : "🔓"}</SwatchAction>
                    {idx > 0 && <SwatchAction onClick={() => { const next = [...palette.colors]; [next[idx-1], next[idx]] = [next[idx], next[idx-1]]; palette.setColors(next); }} label="Move left">◀</SwatchAction>}
                    {idx < palette.colors.length - 1 && <SwatchAction onClick={() => { const next = [...palette.colors]; [next[idx], next[idx+1]] = [next[idx+1], next[idx]]; palette.setColors(next); }} label="Move right">▶</SwatchAction>}
                  </div>
                </div>
              )}

              {/* Drag handle indicator */}
              <div className={`absolute top-3 left-1/2 -translate-x-1/2 text-xs opacity-40 ${isDark ? "text-white" : "text-black"}`}>
                ⋮⋮
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SwatchAction({ children, onClick, label, disabled }: {
  children: React.ReactNode; onClick: () => void; label: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="size-8 flex items-center justify-center rounded-full text-sm hover:scale-110 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ background: "rgba(0,0,0,0.15)", color: "inherit" }}
    >
      {children}
    </button>
  );
}
