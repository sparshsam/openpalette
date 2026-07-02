"use client";

import { useCallback, useState } from "react";
import {
  hexToHsl,
  hexToRgb,
  hslToHex,
  normalizeHex,
  rgbToHex,
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
                : "surface text-secondary hover-bg-muted hover:text-page"
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
            <div key={color.id} className="rounded-2xl p-4 surface-muted backdrop-blur space-y-2">
              <p className="text-xs font-semibold text-secondary">#{idx + 1}</p>
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
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? color.hex;

  const commit = useCallback((v: string) => {
    const n = normalizeHex(v);
    if (n) {
      palette.updateHex(color.id, v);
    }
    setDraft(null);
  }, [color.id, palette]);

  return (
    <label className="text-[10px] font-bold tracking-wider uppercase text-secondary text-center block">
      Hex
      <input
        className="w-full rounded-full surface px-2 py-1.5 text-xs font-semibold text-center text-page outline-none mt-1 uppercase"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setDraft(v);
          // Auto-commit if it becomes a valid 6-digit or 3-digit hex
          const cleaned = v.replace(/^#/, "");
          if (/^[0-9A-Fa-f]{6}$/.test(cleaned) || /^[0-9A-Fa-f]{3}$/.test(cleaned)) {
            const n = normalizeHex(v);
            if (n) {
              palette.updateHex(color.id, v);
              setDraft(null);
            }
          }
        }}
        onBlur={() => commit(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(value);
          if (e.key === "Escape") setDraft(null);
        }}
      />
    </label>
  );
}

function HslEditor({ color, nh, palette }: { color: typeof palette.colors[0]; nh: string; palette: PaletteAPI }) {
  const hsl = hexToHsl(nh);
  const [draftH, setDraftH] = useState<string | null>(null);
  const [draftS, setDraftS] = useState<string | null>(null);
  const [draftL, setDraftL] = useState<string | null>(null);

  const commitHsl = useCallback((h: number, s: number, l: number) => {
    const clampedH = ((h % 360) + 360) % 360;
    const clampedS = Math.max(0, Math.min(100, s));
    const clampedL = Math.max(0, Math.min(100, l));
    palette.updateHex(color.id, hslToHex(clampedH, clampedS, clampedL));
  }, [color.id, palette]);

  return (
    <div className="grid grid-cols-3 gap-1">
      {(["h", "s", "l"] as const).map((ch) => {
        const draftMap = { h: draftH, s: draftS, l: draftL };
        const setDraftMap = { h: setDraftH, s: setDraftS, l: setDraftL };
        const val = draftMap[ch] ?? hsl[ch];
        return (
          <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-secondary text-center">
            {ch}
            <input
              className="w-full rounded-full surface px-2 py-1.5 text-xs font-semibold text-center text-page outline-none mt-1"
              max={ch === "h" ? 360 : 100} min={0} type="number"
              value={val}
              onChange={(e) => {
                setDraftMap[ch](e.target.value);
                const v = Number(e.target.value);
                if (!isNaN(v)) {
                  const cur = hexToHsl(nh);
                  const newH = ch === "h" ? v : (draftH !== null ? Number(draftH) : cur.h);
                  const newS = ch === "s" ? v : (draftS !== null ? Number(draftS) : cur.s);
                  const newL = ch === "l" ? v : (draftL !== null ? Number(draftL) : cur.l);
                  if (!isNaN(newH) && !isNaN(newS) && !isNaN(newL)) {
                    commitHsl(newH, newS, newL);
                  }
                }
              }}
              onBlur={() => {
                setDraftH(null); setDraftS(null); setDraftL(null);
              }}
            />
          </label>
        );
      })}
    </div>
  );
}

function RgbEditor({ color, nh, palette }: { color: typeof palette.colors[0]; nh: string; palette: PaletteAPI }) {
  const rgb = hexToRgb(nh);
  const [draftR, setDraftR] = useState<string | null>(null);
  const [draftG, setDraftG] = useState<string | null>(null);
  const [draftB, setDraftB] = useState<string | null>(null);

  const commitRgb = useCallback((r: number, g: number, b: number) => {
    const clampedR = Math.max(0, Math.min(255, Math.round(r)));
    const clampedG = Math.max(0, Math.min(255, Math.round(g)));
    const clampedB = Math.max(0, Math.min(255, Math.round(b)));
    palette.updateHex(color.id, rgbToHex({ r: clampedR, g: clampedG, b: clampedB }));
  }, [color.id, palette]);

  return (
    <div className="grid grid-cols-3 gap-1">
      {(["r", "g", "b"] as const).map((ch) => {
        const draftMap = { r: draftR, g: draftG, b: draftB };
        const setDraftMap = { r: setDraftR, g: setDraftG, b: setDraftB };
        const val = draftMap[ch] ?? rgb[ch];
        return (
          <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-secondary text-center">
            {ch}
            <input
              className="w-full rounded-full surface px-2 py-1.5 text-xs font-semibold text-center text-page outline-none mt-1"
              max={255} min={0} type="number"
              value={val}
              onChange={(e) => {
                setDraftMap[ch](e.target.value);
                const v = Number(e.target.value);
                if (!isNaN(v)) {
                  const cur = hexToRgb(nh);
                  const newR = ch === "r" ? v : (draftR !== null ? Number(draftR) : cur.r);
                  const newG = ch === "g" ? v : (draftG !== null ? Number(draftG) : cur.g);
                  const newB = ch === "b" ? v : (draftB !== null ? Number(draftB) : cur.b);
                  if (!isNaN(newR) && !isNaN(newG) && !isNaN(newB)) {
                    commitRgb(newR, newG, newB);
                  }
                }
              }}
              onBlur={() => {
                setDraftR(null); setDraftG(null); setDraftB(null);
              }}
            />
          </label>
        );
      })}
    </div>
  );
}

function HsvEditor({ color, nh, palette }: { color: typeof palette.colors[0]; nh: string; palette: PaletteAPI }) {
  const hsv = hexToHsv(nh);
  return (
    <div className="grid grid-cols-3 gap-1">
      {(["h", "s", "v"] as const).map((ch) => (
        <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-secondary text-center">
          {ch}
          <input
            className="w-full rounded-full surface px-2 py-1.5 text-xs font-semibold text-center text-page outline-none mt-1"
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
        <label key={ch} className="text-[10px] font-bold tracking-wider uppercase text-secondary text-center">
          {ch}
          <input
            className="w-full rounded-full surface px-2 py-1.5 text-xs font-semibold text-center text-page outline-none mt-1"
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
          <p className="text-[10px] font-bold tracking-wider uppercase text-secondary">{ch}</p>
          <p className="text-xs font-semibold text-page mt-1">{lab[ch].toFixed(1)}</p>
        </div>
      ))}
    </div>
  );
}
