"use client";

import {
  getReadableTextColor,
  normalizeHex,
  simulateVision,
} from "@/lib/palette";
import type { PaletteAPI } from "@/components/use-palette";

interface Props {
  palette: PaletteAPI;
  onClose: () => void;
}

export function StudioSidebar({ palette, onClose }: Props) {
  const modes = [
    { id: "protanopia", label: "Protanopia" },
    { id: "deuteranopia", label: "Deuteranopia" },
    { id: "tritanopia", label: "Tritanopia" },
    { id: "achromatopsia", label: "Achromatopsia" },
  ] as const;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 bg-[var(--bg-base)] border-l border-[var(--border-default)] shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
        <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Color Blindness</span>
        <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original palette strip */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Original</p>
          <div className="flex rounded-xl overflow-hidden h-10 border border-[var(--border-default)]">
            {palette.colors.map((c) => {
              const nh = normalizeHex(c.hex) ?? "#111827";
              return <div key={c.id} className="flex-1" style={{ backgroundColor: nh }} />;
            })}
          </div>
        </div>

        {modes.map((mode) => (
          <div key={mode.id} className="space-y-1">
            <p className="text-xs font-semibold text-[var(--text-secondary)]">{mode.label}</p>
            <div className="flex rounded-xl overflow-hidden h-10 border border-[var(--border-default)]">
              {palette.colors.map((c) => {
                const nh = normalizeHex(c.hex) ?? "#111827";
                const sim = simulateVision(nh, mode.id);
                return (
                  <div key={c.id} className="flex-1 flex items-center justify-center" style={{ backgroundColor: sim }}>
                    <span className="text-[8px] font-mono font-bold drop-shadow-sm" style={{ color: getReadableTextColor(sim) }}>{sim}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-[var(--border-default)] flex gap-2 justify-end">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold bg-[var(--bg-surface)] text-[var(--text-primary)]">Cancel</button>
        <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white">Apply</button>
      </div>
    </div>
  );
}
