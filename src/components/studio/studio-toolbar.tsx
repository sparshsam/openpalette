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
}

export function StudioToolbar({ palette }: Props) {
  const [showQuickTune, setShowQuickTune] = useState(false);
  const [showModes, setShowModes] = useState(false);

  return (
    <div className="sticky top-16 z-40 bg-[var(--bg-base)] border-b border-[var(--border-default)]">
      <div className="max-w-full mx-auto px-2 sm:px-4 py-2 flex items-center gap-1 overflow-x-auto">
        {/* Generate */}
        <ToolbarButton onClick={palette.generate} label="Generate" title="Generate (Spacebar)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>

        {/* Import */}
        <ToolbarButton onClick={() => { document.querySelector<HTMLTextAreaElement>("textarea")?.focus(); }} label="Import" title="Import palette">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v10M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        <Divider />

        {/* View mode / size */}
        <ToolbarButton onClick={() => palette.setSize(Math.min(palette.colors.length + 1, maxPaletteSize))} label="+" title="Add color" disabled={palette.colors.length >= maxPaletteSize}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>
        <span className="text-xs text-[var(--text-muted)] font-semibold whitespace-nowrap px-1">{palette.colors.length}</span>
        <ToolbarButton onClick={() => palette.setSize(Math.max(palette.colors.length - 1, minPaletteSize))} label="−" title="Remove color" disabled={palette.colors.length <= minPaletteSize}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>

        <Divider />

        {/* Harmony modes */}
        <ToolbarButton onClick={() => setShowModes(!showModes)} label="Modes" title="Harmony modes" active={showModes}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2a6 6 0 010 12" fill="currentColor" opacity="0.3"/></svg>
        </ToolbarButton>

        {/* Accessibility / contrast */}
        <ToolbarButton onClick={() => window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "accessibility" } }))} label="AA" title="Accessibility">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">AA</text></svg>
        </ToolbarButton>

        {/* Color vision */}
        <ToolbarButton onClick={() => setShowQuickTune(!showQuickTune)} label="Eye" title="Color vision & quick-tune" active={showQuickTune}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3C4.5 3 1.5 5.5 1 8c.5 2.5 3.5 5 7 5s6.5-2.5 7-5c-.5-2.5-3.5-5-7-5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
        </ToolbarButton>

        {/* Visualizer */}
        <ToolbarButton onClick={() => window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "visualizer" } }))} label="Preview" title="Visualizer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1"/></svg>
        </ToolbarButton>

        <Divider />

        {/* Undo */}
        <ToolbarButton onClick={palette.undo} label="Undo" title="Undo (U)" disabled={palette.undoStack.length === 0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6H1V3M10 12a5 5 0 100-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        {/* Save */}
        <ToolbarButton onClick={() => window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "library" } }))} label="Save" title="Save to Library">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 15l-5-3-5 3V2a1 1 0 011-1h8a1 1 0 011 1v13z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        {/* Full editor toggle */}
        <ToolbarButton onClick={() => window.dispatchEvent(new CustomEvent("op-toggle-editor", { detail: {} }))} label="Edit" title="Full color editor">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8-4 1 1-4 8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        <Divider />

        {/* Notice */}
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap ml-auto">{palette.notice}</span>
      </div>

      {/* Quick-tune popover */}
      {showQuickTune && <QuickTunePanel palette={palette} onClose={() => setShowQuickTune(false)} />}

      {/* Modes popover */}
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
        ${active ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-[var(--border-default)] shrink-0" />;
}

function QuickTunePanel({ palette, onClose }: Props & { onClose: () => void }) {
  function updateAll(updater: (hex: string) => string) {
    const next = palette.colors.map((c) => ({
      ...c,
      hex: updater(c.hex),
    }));
    palette.setColors(next);
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
      <div className="flex gap-2 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] self-center">Vision</span>
        {(["none","protanopia","deuteranopia","tritanopia"] as const).map((m) => (
          <button key={m} className="rounded-full px-2 py-0.5 text-[10px] font-semibold border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]">{m === "none" ? "Normal" : m.slice(0, 5)}</button>
        ))}
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

function ModesPanel({ palette, onClose }: Props & { onClose: () => void }) {
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
