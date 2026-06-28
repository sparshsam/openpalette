"use client";

import { useState } from "react";
import {
  getReadableTextColor,
  hexToHsl,
  hexToRgb,
  normalizeHex,
} from "@/lib/palette";
import { hexToHsv, hexToCmyk, hexToLab } from "@/lib/palette/color-conversions";
import { getColorInfo } from "@/lib/palette/color-info";
import type { PaletteAPI } from "@/components/use-palette";

interface Props {
  palette: PaletteAPI;
  onClose: () => void;
}

export function ViewModal({ palette, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const color = palette.colors[idx];
  if (!color) return null;

  const nh = normalizeHex(color.hex) ?? "#111827";
  const hsl = hexToHsl(nh);
  const rgb = hexToRgb(nh);
  const hsv = hexToHsv(nh);
  const cmyk = hexToCmyk(nh);
  const lab = hexToLab(nh);
  const info = getColorInfo(nh);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl border border-[var(--border-default)] w-full max-w-md max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Color Details</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Palette strip selector */}
          <div className="flex rounded-xl overflow-hidden h-8 border border-[var(--border-default)]">
            {palette.colors.map((c, i) => (
              <button key={c.id} className={`flex-1 transition-shadow ${i === idx ? "ring-2 ring-[var(--accent)] z-10" : ""}`} style={{ backgroundColor: c.hex }} onClick={() => setIdx(i)} />
            ))}
          </div>

          {/* Large swatch */}
          <div className="h-32 rounded-2xl border border-[var(--border-default)] flex items-end p-4" style={{ backgroundColor: nh }}>
            <div>
              <p className="font-mono text-2xl font-black drop-shadow-sm" style={{ color: getReadableTextColor(nh) }}>{nh}</p>
              <p className="text-xs font-semibold drop-shadow-sm" style={{ color: getReadableTextColor(nh) }}>{info.name}</p>
            </div>
          </div>

          {/* Color spaces grid */}
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="HEX" value={nh} />
            <ColorField label="HSB" value={`${Math.round(hsv.h)}° ${Math.round(hsv.s)}% ${Math.round(hsv.v)}%`} />
            <ColorField label="HSL" value={`${Math.round(hsl.h)}° ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`} />
            <ColorField label="RGB" value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} />
            <ColorField label="CMYK" value={`${Math.round(cmyk.c)}% ${Math.round(cmyk.m)}% ${Math.round(cmyk.y)}% ${Math.round(cmyk.k)}%`} />
            <ColorField label="Lab" value={`${lab.l.toFixed(1)} ${lab.a.toFixed(1)} ${lab.b.toFixed(1)}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-surface)] p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="text-xs font-mono text-[var(--text-primary)] mt-0.5">{value}</p>
    </div>
  );
}
