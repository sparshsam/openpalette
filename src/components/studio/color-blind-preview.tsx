"use client";

import {
  normalizeHex,
  simulateVision,
  getReadableTextColor,
  type VisionMode,
} from "@/lib/palette";
import type { PaletteAPI } from "@/components/use-palette";

interface Props {
  palette: PaletteAPI;
}

const modes: { id: VisionMode; label: string }[] = [
  { id: "none", label: "Normal" },
  { id: "protanopia", label: "Protanopia" },
  { id: "deuteranopia", label: "Deuteranopia" },
  { id: "tritanopia", label: "Tritanopia" },
];

export function ColorBlindPreview({ palette }: Props) {
  if (palette.colors.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <h3 className="text-xs font-bold tracking-wider uppercase text-secondary">Color Vision Simulation</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((mode) => (
          <div key={mode.id} className="rounded-2xl p-3 surface-muted backdrop-blur space-y-2">
            <p className="text-[10px] font-bold tracking-wider uppercase text-muted">{mode.label}</p>
            <div className="flex rounded-xl overflow-hidden h-10">
              {palette.colors.map((color, idx) => {
                const nh = normalizeHex(color.hex) ?? "#111827";
                const sim = mode.id === "none" ? nh : simulateVision(nh, mode.id);
                return (
                  <div
                    key={idx}
                    className="flex-1 flex items-center justify-center"
                    style={{ backgroundColor: sim }}
                  >
                    <span className="text-[8px] font-mono font-bold drop-shadow-sm" style={{ color: getReadableTextColor(sim) }}>
                      {sim}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
