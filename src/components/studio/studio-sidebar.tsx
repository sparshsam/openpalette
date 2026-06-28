"use client";

import { useState } from "react";
import {
  getReadableTextColor,
  hexToHsl,
  hexToRgb,
  normalizeHex,
  simulateVision,
} from "@/lib/palette";
import { hexToHsv, hexToCmyk, hexToLab } from "@/lib/palette/color-conversions";
import { getColorInfo } from "@/lib/palette/color-info";
import type { PaletteAPI } from "@/components/use-palette";
import type { VisionMode } from "@/lib/palette/types";

type Panel = "vision" | "preview" | "view" | null;

interface Props {
  palette: PaletteAPI;
  panel: Panel;
  onClose: () => void;
}

export function StudioSidebar({ palette, panel, onClose }: Props) {
  if (!panel) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 bg-[var(--bg-base)] border-l border-[var(--border-default)] shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
        <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {panel === "vision" ? "Color Vision" : panel === "preview" ? "Preview" : "Color Details"}
        </span>
        <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {panel === "vision" && <VisionPanel palette={palette} />}
        {panel === "preview" && <PreviewPanel palette={palette} />}
        {panel === "view" && <ViewPanel palette={palette} />}
      </div>
      {panel === "vision" && (
        <div className="p-4 border-t border-[var(--border-default)] flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold bg-[var(--bg-surface)] text-[var(--text-primary)]">Cancel</button>
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white">Apply</button>
        </div>
      )}
    </div>
  );
}

function VisionPanel({ palette }: { palette: PaletteAPI }) {
  const modes = [
    { id: "none", label: "Normal" },
    { id: "protanopia", label: "Protanopia" },
    { id: "deuteranopia", label: "Deuteranopia" },
    { id: "tritanopia", label: "Tritanopia" },
    { id: "achromatopsia", label: "Achromatopsia" },
  ] as const;

  return (
    <div className="space-y-4">
      {modes.map((mode) => (
        <div key={mode.id} className="space-y-1">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">{mode.label}</p>
          <div className="flex rounded-xl overflow-hidden h-10 border border-[var(--border-default)]">
            {palette.colors.map((c) => {
              const nh = normalizeHex(c.hex) ?? "#111827";
              const sim = mode.id === "none" ? nh : simulateVision(nh, mode.id as VisionMode);
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
  );
}

function PreviewPanel({ palette }: { palette: PaletteAPI }) {
  const colors = palette.paletteHex;
  const css = `linear-gradient(135deg, ${colors.join(", ")})`;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-default)] p-4 space-y-3 bg-white">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="size-3 rounded-full bg-gray-200" />
          <div className="h-2 w-20 rounded-full bg-gray-100" />
          <div className="h-2 w-12 rounded-full bg-gray-100 ml-auto" />
        </div>
        <div className="h-24 rounded-xl" style={{ background: css }} />
        <div className="flex gap-2">
          {colors.slice(0, 3).map((c, i) => (
            <div key={i} className="flex-1 rounded-lg p-2 text-center" style={{ backgroundColor: c, color: getReadableTextColor(c) }}>
              <p className="text-xs font-bold">{["Primary","Secondary","Accent"][i]}</p>
              <p className="text-[10px] font-mono opacity-80">{c}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {colors.slice(0, 3).map((c, i) => (
            <div key={i} className="flex-1 h-8 rounded-md" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="font-semibold">Northstar</span>
          <span className="opacity-50">— Brand preview</span>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--border-default)] p-4 space-y-2" style={{ backgroundColor: colors[0] ?? "#ccc", color: getReadableTextColor(colors[0] ?? "#ccc") }}>
        <p className="text-lg font-bold">Headline</p>
        <p className="text-xs opacity-80">Body text using your palette colors for a realistic preview of how the combination reads.</p>
        <button className="rounded-full px-4 py-1.5 text-sm font-semibold" style={{ backgroundColor: colors[2] ?? "#888", color: getReadableTextColor(colors[2] ?? "#888") }}>CTA Button</button>
      </div>
    </div>
  );
}

function ViewPanel({ palette }: { palette: PaletteAPI }) {
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
    <div className="space-y-4">
      {/* Swatch strip selector */}
      <div className="flex rounded-xl overflow-hidden h-8 border border-[var(--border-default)]">
        {palette.colors.map((c, i) => (
          <button key={c.id} className={`flex-1 ${i === idx ? "ring-2 ring-[var(--accent)] z-10" : ""}`} style={{ backgroundColor: c.hex }} onClick={() => setIdx(i)} />
        ))}
      </div>
      {/* Large swatch */}
      <div className="h-32 rounded-2xl border border-[var(--border-default)] flex items-end p-4" style={{ backgroundColor: nh }}>
        <div>
          <p className="font-mono text-2xl font-black drop-shadow-sm" style={{ color: getReadableTextColor(nh) }}>{nh}</p>
          <p className="text-xs font-semibold drop-shadow-sm" style={{ color: getReadableTextColor(nh) }}>{info.name}</p>
        </div>
      </div>
      {/* Color spaces */}
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="HEX" value={nh} />
        <ColorField label="HSB" value={`${Math.round(hsv.h)}° ${Math.round(hsv.s)}% ${Math.round(hsv.v)}%`} />
        <ColorField label="HSL" value={`${Math.round(hsl.h)}° ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`} />
        <ColorField label="RGB" value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} />
        <ColorField label="CMYK" value={`${Math.round(cmyk.c)}% ${Math.round(cmyk.m)}% ${Math.round(cmyk.y)}% ${Math.round(cmyk.k)}%`} />
        <ColorField label="Lab" value={`${lab.l.toFixed(1)} ${lab.a.toFixed(1)} ${lab.b.toFixed(1)}`} />
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
