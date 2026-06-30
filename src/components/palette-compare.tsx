"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { analyzePalette } from "@/lib/palette/health-score";
import { showToast } from "./toast";

const PRESETS = [
  { name: "Ocean Blues", colors: ["#001F3F","#003366","#00509E","#0074D9","#7FDBFF"], mode: "Complementary" as const },
  { name: "Sunset Warm", colors: ["#FF4500","#FF6B35","#FFA500","#FFD700","#FFE4B5"], mode: "Analogous" as const },
  { name: "Forest Earth", colors: ["#1B3A2D","#2D5A3D","#4A7C59","#8FBC8F","#D4E7C5"], mode: "Complementary" as const },
  { name: "Midnight Purple", colors: ["#1A0028","#3D0066","#6600A3","#9933FF","#CC99FF"], mode: "Monochromatic" as const },
];

export function PaletteCompare() {
  const ws = useWorkspace();
  const [compareColors, setCompareColors] = useState<string[]>(PRESETS[0].colors);
  const [compareMode, setCompareMode] = useState(PRESETS[0].mode);

  const current = useMemo(() => analyzePalette(ws.paletteHex, ws.mode), [ws.paletteHex, ws.mode]);
  const other = useMemo(() => analyzePalette(compareColors, compareMode), [compareColors, compareMode]);

  // Similarity: compare hue distributions
  const similarity = useMemo(() => {
    const c1 = ws.paletteHex.map((h) => h.slice(1)).join("");
    const c2 = compareColors.map((h) => h.slice(1)).join("");
    let matches = 0;
    for (let i = 0; i < Math.min(c1.length, c2.length); i += 6) {
      if (c1.slice(i, i + 6) === c2.slice(i, i + 6)) matches++;
    }
    const max = Math.max(ws.paletteHex.length, compareColors.length);
    return Math.round((matches / max) * 100);
  }, [ws.paletteHex, compareColors]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Palette Compare</p>

      {/* Preset selector */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button key={p.name} onClick={() => { setCompareColors(p.colors); setCompareMode(p.mode); }}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
              compareColors === p.colors ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)]"
            }`}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Side by side preview */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-muted mb-1">Current</p>
          <div className="flex rounded-lg overflow-hidden h-8 border border-default">
            {ws.paletteHex.map((h, i) => <div key={i} className="flex-1" style={{ backgroundColor: h }} />)}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted mb-1">Compare</p>
          <div className="flex rounded-lg overflow-hidden h-8 border border-default">
            {compareColors.map((h, i) => <div key={i} className="flex-1" style={{ backgroundColor: h }} />)}
          </div>
        </div>
      </div>

      {/* Similarity */}
      <div className="text-center">
        <span className="text-sm font-bold text-page">{similarity}%</span>
        <span className="text-xs text-muted ml-1">similar</span>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-default p-2 space-y-1">
          <p className="font-semibold text-page">Health: {current.overall}</p>
          <p className="text-muted text-[10px]">Access: {current.accessibility} · Harmony: {current.harmony}</p>
        </div>
        <div className="rounded-xl border border-default p-2 space-y-1">
          <p className="font-semibold text-page">Health: {other.overall}</p>
          <p className="text-muted text-[10px]">Access: {other.accessibility} · Harmony: {other.harmony}</p>
        </div>
      </div>

      {/* Load compare palette */}
      <button onClick={() => { ws.loadPalette(compareColors, compareMode, "Compare palette loaded"); showToast("Compare palette loaded"); }}
        className="w-full rounded-full bg-[var(--accent)] text-white px-4 py-2 text-xs font-semibold hover:brightness-110 transition bounce-press">
        Load Compare Palette
      </button>
    </div>
  );
}
