"use client";

import { useState } from "react";
import {
  getReadableTextColor,
  getContrastHint,
  getPaletteAccessibilityScore,
  hexToHsl,
  hexToRgb,
  normalizeHex,
  simulateVision,
} from "@/lib/palette";
import { hexToHsv, hexToCmyk, hexToLab } from "@/lib/palette/color-conversions";
import { getColorInfo, getSimilarColors } from "@/lib/palette/color-info";
import { explorePalettes, type ExplorePalette } from "@/lib/palette/explore-data";
import type { VisionMode } from "@/lib/palette/types";

interface Props {
  palette: ExplorePalette;
  onClose: () => void;
  onLoad: (p: ExplorePalette) => void;
}

export function PaletteDetailModal({ palette, onClose, onLoad }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const nh = normalizeHex(palette.colors[selectedIdx]) ?? "#111827";
  const hsl = hexToHsl(nh);
  const rgb = hexToRgb(nh);
  const hsv = hexToHsv(nh);
  const cmyk = hexToCmyk(nh);
  const lab = hexToLab(nh);
  const info = getColorInfo(nh);
  const score = getPaletteAccessibilityScore(palette.colors);
  const similar = getSimilarColors(nh, 6);
  const related = explorePalettes.filter((p) => p.id !== palette.id && p.tags.some((t) => palette.tags.includes(t))).slice(0, 4);

  async function copyHexes() {
    try { await navigator.clipboard.writeText(palette.colors.join(", ")); } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl border border-default w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-default sticky top-0 bg-[var(--bg-base)] z-10">
          <div>
            <h2 className="text-lg font-black tracking-tight text-page">{palette.name}</h2>
            <p className="text-xs text-muted capitalize">{palette.style} · {palette.topic} · {palette.colors.length} colors</p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-surface text-secondary">✕</button>
        </div>

        <div className="p-4 space-y-5">
          {/* Full swatch strip */}
          <div className="flex rounded-xl overflow-hidden h-16 border border-default">
            {palette.colors.map((hex, i) => (
              <button key={i} className={`flex-1 flex items-end justify-center pb-1.5 transition-shadow ${i === selectedIdx ? "ring-2 ring-[var(--accent)] z-10" : ""}`} style={{ backgroundColor: hex }} onClick={() => setSelectedIdx(i)}>
                <span className="text-[10px] font-mono font-bold drop-shadow-sm" style={{ color: getReadableTextColor(hex) }}>{hex}</span>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={copyHexes} className="rounded-full surface px-4 py-1.5 text-xs font-semibold text-page hover-bg-muted transition">Copy HEX List</button>
            <button className="rounded-full surface px-4 py-1.5 text-xs font-semibold text-page hover-bg-muted transition">♡ Save</button>
            <button onClick={() => onLoad(palette)} className="rounded-full bg-[var(--accent)] text-white px-4 py-1.5 text-xs font-semibold hover:brightness-110 transition">Open in Studio</button>
          </div>

          {/* Selected color detail */}
          <div className="rounded-2xl border border-default overflow-hidden">
            <div className="h-20 flex items-end p-3" style={{ backgroundColor: nh }}>
              <div>
                <p className="font-mono text-lg font-black drop-shadow-sm" style={{ color: getReadableTextColor(nh) }}>{nh}</p>
                <p className="text-xs font-semibold drop-shadow-sm" style={{ color: getReadableTextColor(nh) }}>{info.name}</p>
              </div>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <DataField label="HSL" value={`${Math.round(hsl.h)}° ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`} />
              <DataField label="RGB" value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} />
              <DataField label="HSV" value={`${Math.round(hsv.h)}° ${Math.round(hsv.s)}% ${Math.round(hsv.v)}%`} />
              <DataField label="CMYK" value={`${Math.round(cmyk.c)}% ${Math.round(cmyk.m)}% ${Math.round(cmyk.y)}% ${Math.round(cmyk.k)}%`} />
              <DataField label="Lab" value={`${lab.l.toFixed(1)} ${lab.a.toFixed(1)} ${lab.b.toFixed(1)}`} />
              <DataField label="Psychology" value={info.psychology} />
            </div>
          </div>

          {/* Accessibility */}
          <div className="rounded-2xl border border-default p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Accessibility · Score {score}/100</p>
            <div className="flex gap-3 text-xs text-secondary">
              {palette.colors.slice(0, 3).map((hex) => {
                const h = getContrastHint(hex);
                return <span key={hex}>{hex} <span className="text-muted">{h.rating} {h.ratio.toFixed(1)}:1</span></span>;
              })}
            </div>
          </div>

          {/* Color blindness preview */}
          <BlindPreview colors={palette.colors} />

          {/* Similar colors */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Similar Colors</p>
            <div className="flex flex-wrap gap-1.5">
              {similar.map((s) => (
                <span key={s.hex} className="flex items-center gap-1 rounded-full surface px-2 py-0.5 text-xs text-secondary">
                  <span className="size-3 rounded-full" style={{ backgroundColor: s.hex }} />{s.name}
                </span>
              ))}
            </div>
          </div>

          {/* Related palettes */}
          {related.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Similar Palettes</p>
              <div className="grid grid-cols-2 gap-2">
                {related.map((r) => (
                  <button key={r.id} onClick={() => onLoad(r)} className="rounded-xl border border-default p-2 text-left hover:bg-surface transition text-xs">
                    <div className="flex rounded-lg overflow-hidden h-6 mb-1">{r.colors.map((c, i) => <span key={i} className="flex-1" style={{ backgroundColor: c }} />)}</div>
                    <p className="font-semibold text-page">{r.name}</p>
                    <p className="text-muted">{r.style} · {r.topic}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlindPreview({ colors }: { colors: string[] }) {
  const modes: { id: VisionMode; label: string }[] = [
    { id: "protanopia", label: "Protanopia" },
    { id: "deuteranopia", label: "Deuteranopia" },
    { id: "tritanopia", label: "Tritanopia" },
    { id: "achromatopsia", label: "Achromatopsia" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Color Blindness Preview</p>
      <div className="space-y-1.5">
        {modes.map((mode) => (
          <div key={mode.id} className="flex rounded-lg overflow-hidden h-5 border border-default">
            {colors.map((hex, i) => {
              const sim = simulateVision(hex, mode.id);
              return <span key={i} className="flex-1" style={{ backgroundColor: sim }} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-xs text-page mt-0.5">{value}</p>
    </div>
  );
}
