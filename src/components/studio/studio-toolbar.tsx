"use client";

import { useState, type ReactNode } from "react";
import {
  hexToHsl,
  hslToHex,
  maxPaletteSize,
  minPaletteSize,
  paletteModes,
} from "@/lib/palette";
import { hexToHsv, hsvToHex } from "@/lib/palette/color-conversions";
import type { PaletteAPI } from "@/components/use-palette";

interface Props {
  palette: PaletteAPI;
  onOpenVision: () => void;
  onOpenView: () => void;
  onOpenExport: () => void;
}

export function StudioToolbar({ palette, onOpenVision, onOpenView, onOpenExport }: Props) {
  const [showQuickTune, setShowQuickTune] = useState(false);
  const [showModes, setShowModes] = useState(false);

  return (
    <div className="sticky top-16 z-40 bg-[var(--bg-base)] border-b border-[var(--border-default)]">
      <div className="max-w-full mx-auto px-2 sm:px-4 py-2 flex items-center gap-1 overflow-x-auto">
        {/* Generate */}
        <ToolbarButton onClick={palette.generate} label="Generate" title="Spacebar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>

        {/* Import */}
        <ToolbarButton onClick={() => { document.querySelector<HTMLTextAreaElement>("[data-import-input]")?.focus(); }} label="Import" title="Import">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v10M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        <Divider />

        {/* Add / remove colors */}
        <IconBtn onClick={() => palette.setSize(Math.min(palette.colors.length + 1, maxPaletteSize))} disabled={palette.colors.length >= maxPaletteSize} title="Add color">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </IconBtn>
        <span className="text-xs text-[var(--text-muted)] font-semibold tabular-nums w-5 text-center">{palette.colors.length}</span>
        <IconBtn onClick={() => palette.setSize(Math.max(palette.colors.length - 1, minPaletteSize))} disabled={palette.colors.length <= minPaletteSize} title="Remove color">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </IconBtn>

        <Divider />

        {/* Harmony modes */}
        <ToolbarButton onClick={() => setShowModes(!showModes)} label="Modes" active={showModes}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2a6 6 0 010 12" fill="currentColor" opacity="0.3"/></svg>
        </ToolbarButton>

        {/* Color blindness sidebar */}
        <ToolbarButton onClick={onOpenVision} label="Eye">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3C4.5 3 1.5 5.5 1 8c.5 2.5 3.5 5 7 5s6.5-2.5 7-5c-.5-2.5-3.5-5-7-5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
        </ToolbarButton>

        {/* View / Color details modal */}
        <ToolbarButton onClick={onOpenView} label="View">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" fill="currentColor"/><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/></svg>
        </ToolbarButton>

        <Divider />

        {/* Undo */}
        <ToolbarButton onClick={palette.undo} label="Undo" title="U" disabled={palette.undoStack.length === 0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6H1V3M10 12a5 5 0 100-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        {/* Export modal */}
        <ToolbarButton onClick={onOpenExport} label="Export">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v8M4 5l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        <Divider />

        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap ml-auto">{palette.notice}</span>
      </div>

      {showQuickTune && <QuickTunePanel palette={palette} onClose={() => setShowQuickTune(false)} />}
      {showModes && <ModesPanel palette={palette} onClose={() => setShowModes(false)} />}
    </div>
  );
}

function ToolbarButton({ children, onClick, label, title, disabled, active }: {
  children: ReactNode; onClick: () => void; label: string; title?: string; disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors
        ${active ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--accent)]"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Divider() { return <div className="w-px h-5 bg-[var(--border-default)] shrink-0" />; }

function IconBtn({ children, onClick, disabled, title }: {
  children: ReactNode; onClick: () => void; disabled?: boolean; title?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="size-7 flex items-center justify-center rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >{children}</button>
  );
}

function QuickTunePanel({ palette, onClose }: { palette: PaletteAPI; onClose: () => void }) {
  function updateAll(updater: (hex: string) => string) {
    palette.setColors(palette.colors.map((c) => ({ ...c, hex: updater(c.hex) })));
  }
  const baseHsl = hexToHsl(palette.paletteHex[0] ?? "#ff66c4");
  const baseHsv = hexToHsv(palette.paletteHex[0] ?? "#ff66c4");
  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Quick Tune</span>
        <button onClick={onClose} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
      </div>
      <div className="flex flex-wrap gap-4">
        <SliderRow label="Saturation" value={baseHsl.s} min={0} max={100} onChange={(v) => updateAll((hex) => hslToHex(hexToHsl(hex).h, v, hexToHsl(hex).l))} />
        <SliderRow label="Brightness" value={baseHsv.v} min={0} max={100} onChange={(v) => updateAll((hex) => hsvToHex(hexToHsv(hex).h, hexToHsv(hex).s, v))} />
        <SliderRow label="Temp" value={0} min={-50} max={50} onChange={(v) => updateAll((hex) => hslToHex((hexToHsl(hex).h + v + 360) % 360, hexToHsl(hex).s, hexToHsl(hex).l))} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
      <span className="w-16 shrink-0">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-20" />
      <span className="w-8 text-right font-mono text-[var(--text-muted)]">{value}</span>
    </label>
  );
}

function ModesPanel({ palette, onClose }: { palette: PaletteAPI; onClose: () => void }) {
  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Harmony</span>
        <button onClick={onClose} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
      </div>
      <div className="flex flex-wrap gap-1">
        {paletteModes.map((m) => (
          <button key={m} onClick={() => { palette.switchMode(m); onClose(); }}
            className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${
              palette.mode === m
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
            }`}
          >{m}</button>
        ))}
      </div>
    </div>
  );
}
