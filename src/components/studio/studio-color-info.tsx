"use client";

import { useMemo } from "react";
import { normalizeHex, hexToHsl } from "@/lib/palette";
import { getColorInfo, getSimilarColors } from "@/lib/palette/color-info";
import type { PaletteAPI } from "@/components/use-palette";

interface Props {
  palette: PaletteAPI;
}

export function StudioColorInfo({ palette }: Props) {
  if (palette.colors.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Per-color psychology / meaning / applications */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {palette.colors.slice(0, 5).map((color) => {
          const nh = normalizeHex(color.hex) ?? "#111827";
          const info = getColorInfo(nh);
          return (
            <div key={color.id} className="rounded-2xl p-4 surface-muted backdrop-blur space-y-2">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full border border-white/20" style={{ backgroundColor: nh }} />
                <span className="font-semibold text-sm text-page">{info.name}</span>
                <span className="font-mono text-[10px] text-muted">{nh}</span>
              </div>
              <p className="text-xs text-secondary"><span className="font-bold text-page">Psychology:</span> {info.psychology}</p>
              <p className="text-xs text-secondary"><span className="font-bold text-page">Meaning:</span> {info.meaning}</p>
              <div className="flex flex-wrap gap-1">
                {info.applications.map((a) => (
                  <span key={a} className="rounded-full surface px-2 py-0.5 text-[10px] text-secondary">{a}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Similar colors for first palette color */}
      <SimilarColorsSection hex={palette.paletteHex[0] ?? "#111827"} />

      {/* Palette-wide analysis */}
      <PaletteAnalysisSection palette={palette} />
    </div>
  );
}

function SimilarColorsSection({ hex }: { hex: string }) {
  const similar = useMemo(() => getSimilarColors(hex, 8), [hex]);
  return (
    <div className="rounded-2xl p-4 surface-muted backdrop-blur space-y-3">
      <h3 className="text-xs font-bold tracking-wider uppercase text-secondary">Similar Colors</h3>
      <div className="flex flex-wrap gap-2">
        {similar.map((s) => (
          <div key={s.hex} className="flex items-center gap-1.5 rounded-full surface-muted px-3 py-1">
            <span className="size-3 rounded-full border border-white/20" style={{ backgroundColor: s.hex }} />
            <span className="text-xs text-secondary">{s.name}</span>
            <span className="text-[10px] text-muted">{s.distance.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaletteAnalysisSection({ palette }: Props) {
  return (
    <div className="rounded-2xl p-4 surface-muted backdrop-blur space-y-3">
      <h3 className="text-xs font-bold tracking-wider uppercase text-secondary">Palette Analysis</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnalysisCard label="Hue Range" value={palette.paletteHex.length > 1 ? computeHueRange(palette.paletteHex) : "—"} />
        <AnalysisCard label="Avg Saturation" value={computeAvgSat(palette.paletteHex)} />
        <AnalysisCard label="Avg Lightness" value={computeAvgLight(palette.paletteHex)} />
        <AnalysisCard label="Temperature" value={computeTemperature(palette.paletteHex)} />
      </div>
    </div>
  );
}

function AnalysisCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl surface-muted p-3">
      <p className="text-[10px] font-bold tracking-wider uppercase text-muted">{label}</p>
      <p className="text-sm font-semibold text-page mt-0.5">{value}</p>
    </div>
  );
}

function computeHueRange(hexes: string[]): string {
  if (hexes.length < 2) return "—";
  const hues = hexes.map((h) => hexToHsl(h).h);
  const min = Math.min(...hues);
  const max = Math.max(...hues);
  return `${Math.round(max - min)}°`;
}

function computeAvgSat(hexes: string[]): string {
  const avg = hexes.reduce((s, h) => s + hexToHsl(h).s, 0) / hexes.length;
  return `${Math.round(avg)}%`;
}

function computeAvgLight(hexes: string[]): string {
  const avg = hexes.reduce((s, h) => s + hexToHsl(h).l, 0) / hexes.length;
  return `${Math.round(avg)}%`;
}

function computeTemperature(hexes: string[]): string {
  const warm = hexes.filter((h) => { const hue = hexToHsl(h).h; return hue < 70 || hue > 310; }).length;
  const cool = hexes.filter((h) => { const hue = hexToHsl(h).h; return hue >= 150 && hue <= 270; }).length;
  if (warm > cool) return "Warm";
  if (cool > warm) return "Cool";
  return "Neutral";
}
