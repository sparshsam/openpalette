"use client";

import { useState } from "react";
import {
  hexToHsl,
  hexToRgb,
  normalizeHex,
} from "@/lib/palette";
import { hexToHsv, hsvToHex, hexToCmyk, cmykToHex, hexToLab } from "@/lib/palette/color-conversions";
import type { PaletteAPI } from "@/components/use-palette";

interface Props {
  palette: PaletteAPI;
}

type ColorTab = "hex" | "hsl" | "rgb" | "hsv" | "cmyk" | "lab";

export function StudioColorEditor({ palette }: Props) {
  const [openTab, setOpenTab] = useState<ColorTab>("hex");
  const tabs: { id: ColorTab; label: string }[] = [
    { id: "hex", label: "HEX" },
    { id: "hsl", label: "HSL" },
    { id: "rgb", label: "RGB" },
    { id: "hsv", label: "HSV" },
    { id: "cmyk", label: "CMYK" },
    { id: "lab", label: "Lab" },
  ];

  if (palette.colors.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${
              openTab === t.id
                ? "bg-white text-[#1a001a]"
                : "bg-white/15 text-white/70 hover:bg-white/25 hover:text-white"
            }`}
            onClick={() => setOpenTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {palette.colors.map((color, idx) => {
          const nh = normalizeHex(color.hex) ?? "#111827";
          return (
            <div key={color.id} className="rounded-2xl p-4 bg-white/10 backdrop-blur space-y-2">
              <p className="text-xs font-semibold text-white/60">#{idx + 1}</p>
              {openTab === "hex" && <HexEditor color={color} palette={palette} />}
              {openTab === "hsl" && <HslEditor color={color} nh={nh} palette={palette} />}
              {openTab === "rgb" && <RgbEditor color={color} nh={nh} palette={palette} />}
              {openTab === "hsv" && <HsvEditor color={color} nh={nh} palette={palette} />}
              {openTab === "cmyk" && <CmykEditor color={color} nh={nh} palette={palette} />}
              {openTab === "lab" && <LabDisplay nh={nh} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HexEditor({ color, palette }: { color: typeof palette.colors[0]; palette: PaletteAPI }) {
  return (
    <label className="text-[10px] font-bold tracking-wider uppercase text-white/70 text-center block">
      Hex
      <input
        className="w-full rounded-full bg-white/15 px-2 py-1.5 text-xs font-semibold text-center text-white outline-none mt-1 uppercase"
        value={color.hex}
        onChange={(e) => palette.updateHex(color.id, e.target.value)}
      />
    </label>
  );
}

function HslEditor({ color, nh, palette }: { color: typeof palette.colors[0]; nh: string; palette: PaletteAPI }) {
  const hsl = hexToHsl(nh);
  return (
    <div className="grid grid-cols-3 gap-1">
      {(["h", "s", "l"] as const).map((ch) => (
        <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-white/70 text-center">
          {ch}
          <input
            className="w-full rounded-full bg-white/15 px-2 py-1.5 text-xs font-semibold text-center text-white outline-none mt-1"
            max={ch === "h" ? 360 : 100} min={0} type="number"
            value={hsl[ch]}
            onChange={(e) => palette.updateHsl(color.id, ch, Number(e.target.value))}
          />
        </label>
      ))}
    </div>
  );
}

function RgbEditor({ color, nh, palette }: { color: typeof palette.colors[0]; nh: string; palette: PaletteAPI }) {
  const rgb = hexToRgb(nh);
  return (
    <div className="grid grid-cols-3 gap-1">
      {(["r", "g", "b"] as const).map((ch) => (
        <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-white/70 text-center">
          {ch}
          <input
            className="w-full rounded-full bg-white/15 px-2 py-1.5 text-xs font-semibold text-center text-white outline-none mt-1"
            max={255} min={0} type="number"
            value={rgb[ch]}
            onChange={(e) => palette.updateRgb(color.id, ch, Number(e.target.value))}
          />
        </label>
      ))}
    </div>
  );
}

function HsvEditor({ color, nh, palette }: { color: typeof palette.colors[0]; nh: string; palette: PaletteAPI }) {
  const hsv = hexToHsv(nh);
  return (
    <div className="grid grid-cols-3 gap-1">
      {(["h", "s", "v"] as const).map((ch) => (
        <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-white/70 text-center">
          {ch}
          <input
            className="w-full rounded-full bg-white/15 px-2 py-1.5 text-xs font-semibold text-center text-white outline-none mt-1"
            max={ch === "h" ? 360 : 100} min={0} type="number"
            value={hsv[ch]}
            onChange={(e) => {
              const v = Number(e.target.value);
              const cur = hexToHsv(nh);
              const newHsv = { h: cur.h, s: cur.s, v: cur.v, [ch]: v };
              const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
              palette.updateHex(color.id, newHex);
            }}
          />
        </label>
      ))}
    </div>
  );
}

function CmykEditor({ color, nh, palette }: { color: typeof palette.colors[0]; nh: string; palette: PaletteAPI }) {
  const cmyk = hexToCmyk(nh);
  return (
    <div className="grid grid-cols-2 gap-1">
      {(["c", "m", "y", "k"] as const).map((ch) => (
        <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-white/70 text-center">
          {ch}
          <input
            className="w-full rounded-full bg-white/15 px-2 py-1.5 text-xs font-semibold text-center text-white outline-none mt-1"
            max={100} min={0} type="number"
            value={cmyk[ch]}
            onChange={(e) => {
              const v = Number(e.target.value);
              const cur = hexToCmyk(nh);
              const newCmyk = { c: cur.c, m: cur.m, y: cur.y, k: cur.k, [ch]: v };
              palette.updateHex(color.id, cmykToHex(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k));
            }}
          />
        </label>
      ))}
    </div>
  );
}

function LabDisplay({ nh: hex }: { nh: string }) {
  const lab = hexToLab(hex);
  return (
    <div className="grid grid-cols-3 gap-1">
      {(["l", "a", "b"] as const).map((ch) => (
        <div key={ch} className="text-center">
          <p className="text-[10px] font-bold tracking-wider uppercase text-white/70">{ch}</p>
          <p className="text-xs font-semibold text-white mt-1">{lab[ch].toFixed(1)}</p>
        </div>
      ))}
    </div>
  );
}
