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
            >
              {/* Grab handle zone — spans full height for drag */}
              <div
                className={`absolute inset-0 z-10 ${dragIdx === idx ? "opacity-50" : ""}`}
                style={{ cursor: dragIdx !== null ? "grabbing" : hoveredIdx === idx ? "grab" : "default" }}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={() => setDragIdx(null)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* Drag handle indicator — top */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-40" style={{ color: tc, cursor: "grab" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/></svg>
              </div>

              {/* HEX label — always visible near bottom */}
              <div className="absolute bottom-6 left-0 right-0 text-center px-2 z-20 pointer-events-none">
                <p className="font-mono text-lg sm:text-xl lg:text-2xl font-black tracking-tight drop-shadow-sm" style={{ color: tc }}>{nh}</p>
                <p className="text-[10px] sm:text-xs font-semibold mt-0.5 drop-shadow-sm" style={{ color: tc, opacity: 0.8 }}>{colorInfo.name}</p>
              </div>

              {/* Lock indicator */}
              {color.locked && (
                <div className="absolute top-3 right-3 z-20 text-sm drop-shadow-sm" style={{ color: tc }}>🔒</div>
              )}

              {/* Hover action rail */}
              {hoveredIdx === idx && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-1.5 rounded-2xl px-2 py-1.5 pointer-events-auto backdrop-blur-md"
                    style={{ background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}>
                    <SwatchAction onClick={() => { if (palette.colors.length > 2) { const n = palette.colors.filter((c) => c.id !== color.id); palette.setColors(n); } }} disabled={palette.colors.length <= 2} label="Remove">✕</SwatchAction>
                    <SwatchAction onClick={async () => { try { await navigator.clipboard.writeText(nh); palette.announce("Copied"); } catch {} }} label="Copy">📋</SwatchAction>
                    <SwatchAction onClick={() => palette.toggleLock(color.id)} label={color.locked ? "Unlock" : "Lock"}>{color.locked ? "🔒" : "🔓"}</SwatchAction>
                    {idx > 0 && <SwatchAction onClick={() => { const n = [...palette.colors]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; palette.setColors(n); }} label="Left">◀</SwatchAction>}
                    {idx < palette.colors.length - 1 && <SwatchAction onClick={() => { const n = [...palette.colors]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; palette.setColors(n); }} label="Right">▶</SwatchAction>}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add button at the end */}
        {palette.colors.length < 10 && (
          <div className="flex-none w-12 flex items-center justify-center border-l border-[rgba(255,255,255,0.2)] bg-[var(--bg-surface-muted)]">
            <button onClick={() => {
              const hex = generateHex(Math.random() * 360);
              palette.setColors([...palette.colors, { id: crypto.randomUUID(), hex, alpha: 100, locked: false }]);
            }} className="size-8 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform"
              style={{ background: "rgba(0,0,0,0.1)", color: "var(--text-secondary)" }}
              title="Add color"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2v12M2 8h12"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SwatchAction({ children, onClick, label, disabled }: {
  children: React.ReactNode; onClick: () => void; label: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="size-7 flex items-center justify-center rounded-lg text-xs hover:scale-110 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ background: "rgba(0,0,0,0.15)", color: "inherit" }}
    >{children}</button>
  );
}
