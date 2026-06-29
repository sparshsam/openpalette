"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import {
  getContrastRatio,
  getContrastHint,
  getReadableTextColor,
  hexToHsl,
  hexToRgb,
  hslToHex,
  normalizeHex,
  simulateVision,
} from "@/lib/palette";
import { hexToHsv, hexToCmyk, hexToLab } from "@/lib/palette/color-conversions";
import { getColorInfo, getSimilarColors } from "@/lib/palette/color-info";
import { generatePalette } from "@/lib/palette/palette-engine";
import { showToast } from "@/components/toast";

function hexToXyz(hex: string): { x: number; y: number; z: number } {
  const { r, g, b } = hexToRgb(hex);
  const sr = srgbLinear(r / 255), sg = srgbLinear(g / 255), sb = srgbLinear(b / 255);
  return {
    x: (sr * 0.4124564 + sg * 0.3575761 + sb * 0.1804375) * 100,
    y: (sr * 0.2126729 + sg * 0.7151522 + sb * 0.0721750) * 100,
    z: (sr * 0.0193339 + sg * 0.1191920 + sb * 0.9503041) * 100,
  };
}
function srgbLinear(c: number) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function hexToLch(hex: string): { l: number; c: number; h: number } {
  const lab = hexToLab(hex);
  return { l: lab.l, c: Math.hypot(lab.a, lab.b), h: Math.atan2(lab.b, lab.a) * 180 / Math.PI };
}
function hexToLuv(hex: string): { l: number; u: number; v: number } {
  const xyz = hexToXyz(hex);
  const yr = xyz.y / 100;
  const l = yr > 0.008856 ? 116 * Math.cbrt(yr) - 16 : 903.3 * yr;
  const denom = xyz.x + 15 * xyz.y + 3 * xyz.z;
  const u = 4 * xyz.x / denom, v = 9 * xyz.y / denom;
  return { l, u: 13 * l * (u - 0.19783946), v: 13 * l * (v - 0.46833623) };
}
function hexToHwb(hex: string): { h: number; w: number; b: number } {
  const hsv = hexToHsv(hex);
  return { h: hsv.h, w: (100 - hsv.s) * hsv.v / 100, b: 100 - hsv.v };
}

const SECTIONS = ["Overview","Conversion","About","Variations","Harmonies","Accessibility","Similar Colors","Libraries","Palettes"];

interface Props {
  hex: string;
  onBack: () => void;
}

export function ColorDetailPage({ hex, onBack }: Props) {
  const nh = normalizeHex(hex) ?? "#111827";
  const info = getColorInfo(nh);
  const [activeSection, setActiveSection] = useState("Overview");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = useCallback((s: string) => {
    setActiveSection(s);
    sectionRefs.current[s]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const copy = useCallback(async (v: string, label?: string) => {
    try { await navigator.clipboard.writeText(v); showToast(label ? `Copied ${label}` : `Copied ${v}`); } catch {}
  }, []);

  const hsl = hexToHsl(nh);
  const rgb = hexToRgb(nh);
  const hsv = hexToHsv(nh);
  const cmyk = hexToCmyk(nh);
  const lab = hexToLab(nh);
  const xyz = hexToXyz(nh);
  const lch = hexToLch(nh);
  const luv = hexToLuv(nh);
  const hwb = hexToHwb(nh);

  function generateVariations(type: string): string[] {
    const h = hsl.h, s = hsl.s, l = hsl.l;
    if (type === "shades") return Array.from({ length: 11 }, (_, i) => hslToHex(h, s, Math.max(5, l - i * 8)));
    if (type === "tints") return Array.from({ length: 11 }, (_, i) => hslToHex(h, s, Math.min(95, l + i * 7)));
    if (type === "tones") return Array.from({ length: 11 }, (_, i) => hslToHex(h, Math.max(3, s - i * 8), l));
    if (type === "hues") return Array.from({ length: 11 }, (_, i) => hslToHex((h + i * 30 + 360) % 360, s, l));
    if (type === "temperature") return [
      hslToHex((h - 30 + 360) % 360, s, l), hslToHex((h - 15 + 360) % 360, s, l), nh,
      hslToHex((h + 15 + 360) % 360, s, l), hslToHex((h + 30 + 360) % 360, s, l),
    ];
    return [];
  }

  const similar = getSimilarColors(nh, 12);

  const libraryMatches = (() => {
    const h = hexToHsl(nh).h, l = hexToHsl(nh).l;
    const libs: Record<string, Record<string, string>> = {
      CSS: { aliceblue: "#F0F8FF", antiquewhite: "#FAEBD7", aqua: "#00FFFF", aquamarine: "#7FFFD4", azure: "#F0FFFF", beige: "#F5F5DC", bisque: "#FFE4C4", black: "#000000" },
      Tailwind: { "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8d0", "slate-300": "#cbd5e1", "gray-50": "#f9fafb", "gray-100": "#f3f4f6", "red-500": "#ef4444", "blue-500": "#3b82f6", "green-500": "#22c55e" },
    };
    const results: { name: string; hex: string; approx: boolean }[] = [];
    Object.entries(libs).forEach(([lib, colors]) => {
      let best = "", bestHex = "", bestDist = Infinity;
      Object.entries(colors).forEach(([name, chex]) => {
        const ch = hexToHsl(chex).h;
        const dist = Math.abs(h - ch);
        if (dist < bestDist || (dist === bestDist && Math.abs(l - hexToHsl(chex).l) < Math.abs(l - hexToHsl(bestHex).l))) {
          best = name; bestHex = chex; bestDist = dist;
        }
      });
      if (best) results.push({ name: `${lib}/${best}`, hex: bestHex, approx: bestDist > 15 });
    });
    return results;
  })();

  function openInStudio() {
    window.dispatchEvent(new CustomEvent("op-load-palette", { detail: { colors: [nh], mode: "Random" } }));
    window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "studio" } }));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-secondary hover:text-[var(--accent)] transition">← Colors</button>
        <span className="text-muted">/</span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-page">{info.name}</h1>
      </div>

      {/* Sticky section nav */}
      <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[var(--bg-base)]/95 backdrop-blur-md border-b border-[var(--border-default)] overflow-x-auto flex gap-1">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => scrollTo(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition ${
              activeSection === s ? "bg-[var(--accent)] text-white" : "text-secondary hover:text-[var(--accent)]"
            }`}
          >{s}</button>
        ))}
      </div>

      {/* Overview */}
      <Section id="Overview" setRef={(el) => { sectionRefs.current["Overview"] = el; }}>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="h-64 md:h-80 rounded-2xl border border-default flex flex-col justify-end p-6" style={{ backgroundColor: nh }}>
            <p className="font-mono text-3xl sm:text-4xl font-black drop-shadow-sm" style={{ color: getReadableTextColor(nh) }}>{nh}</p>
            <p className="text-lg font-semibold mt-1 drop-shadow-sm" style={{ color: getReadableTextColor(nh) }}>{info.name}</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <CopyField label="HEX" value={nh} onCopy={() => copy(nh)} />
              <CopyField label="RGB" value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} onCopy={() => copy(`${rgb.r}, ${rgb.g}, ${rgb.b}`, "RGB")} />
              <CopyField label="HSL" value={`${Math.round(hsl.h)}° ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`} onCopy={() => copy(`${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`, "HSL")} />
              <CopyField label="CMYK" value={`${Math.round(cmyk.c)}% ${Math.round(cmyk.m)}% ${Math.round(cmyk.y)}% ${Math.round(cmyk.k)}%`} onCopy={() => copy(`${Math.round(cmyk.c)} ${Math.round(cmyk.m)}% ${Math.round(cmyk.y)}% ${Math.round(cmyk.k)}%`, "CMYK")} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy(nh)} className="rounded-full bg-[var(--accent)] text-white px-5 py-2 text-sm font-semibold hover:brightness-110 transition">Copy HEX</button>
              <button onClick={openInStudio} className="rounded-full border border-default px-5 py-2 text-sm font-semibold text-secondary hover:text-[var(--accent)] transition">Open in Studio</button>
              <button className="rounded-full border border-default px-5 py-2 text-sm font-semibold text-secondary hover:text-[var(--accent)] transition">☆ Favorite</button>
            </div>
          </div>
        </div>
      </Section>

      {/* Conversion */}
      <Section id="Conversion" setRef={(el) => { sectionRefs.current["Conversion"] = el; }}>
        <h2 className="text-xl font-black tracking-tight text-page mb-4">Conversion</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <CopyField label="HEX" value={nh} onCopy={() => copy(nh)} />
          <CopyField label="RGB" value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} onCopy={() => copy(`rgb(${rgb.r},${rgb.g},${rgb.b})`, "RGB")} />
          <CopyField label="CMYK" value={`${Math.round(cmyk.c)}% ${Math.round(cmyk.m)}% ${Math.round(cmyk.y)}% ${Math.round(cmyk.k)}%`} onCopy={() => copy(`${Math.round(cmyk.c)} ${Math.round(cmyk.m)} ${Math.round(cmyk.y)} ${Math.round(cmyk.k)}`, "CMYK")} />
          <CopyField label="HSL" value={`${Math.round(hsl.h)}° ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`} onCopy={() => copy(`${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`, "HSL")} />
          <CopyField label="HSV/HSB" value={`${Math.round(hsv.h)}° ${Math.round(hsv.s)}% ${Math.round(hsv.v)}%`} onCopy={() => copy(`${Math.round(hsv.h)} ${Math.round(hsv.s)}% ${Math.round(hsv.v)}%`, "HSV")} />
          <CopyField label="LAB" value={`${lab.l.toFixed(1)} ${lab.a.toFixed(1)} ${lab.b.toFixed(1)}`} onCopy={() => copy(`${lab.l.toFixed(1)} ${lab.a.toFixed(1)} ${lab.b.toFixed(1)}`, "LAB")} />
          <CopyField label="XYZ" value={`${xyz.x.toFixed(2)} ${xyz.y.toFixed(2)} ${xyz.z.toFixed(2)}`} onCopy={() => copy(`${xyz.x.toFixed(2)} ${xyz.y.toFixed(2)} ${xyz.z.toFixed(2)}`, "XYZ")} />
          <CopyField label="LCH" value={`${lch.l.toFixed(1)} ${lch.c.toFixed(1)} ${lch.h.toFixed(1)}°`} onCopy={() => copy(`${lch.l.toFixed(1)} ${lch.c.toFixed(1)} ${lch.h.toFixed(1)}`, "LCH")} />
          <CopyField label="LUV" value={`${luv.l.toFixed(1)} ${luv.u.toFixed(1)} ${luv.v.toFixed(1)}`} onCopy={() => copy(`${luv.l.toFixed(1)} ${luv.u.toFixed(1)} ${luv.v.toFixed(1)}`, "LUV")} />
          <CopyField label="HWB" value={`${Math.round(hwb.h)}° ${Math.round(hwb.w)}% ${Math.round(hwb.b)}%`} onCopy={() => copy(`${Math.round(hwb.h)} ${Math.round(hwb.w)}% ${Math.round(hwb.b)}%`, "HWB")} />
        </div>
      </Section>

      {/* About */}
      <Section id="About" setRef={(el) => { sectionRefs.current["About"] = el; }}>
        <h2 className="text-xl font-black tracking-tight text-page mb-4">About {info.name}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <AboutCard label="Description" value={`${info.name} (${nh}) is a ${hsl.l > 60 ? "light" : hsl.l > 35 ? "medium" : "dark"} ${hsl.s > 60 ? "vibrant" : hsl.s > 25 ? "moderate" : "muted"} color with a hue of ${Math.round(hsl.h)}°. It has a ${getReadableTextColor(nh) === "#F9FAFB" ? "dark" : "light"} reading contrast.`} />
          <AboutCard label="Psychology" value={info.psychology} />
          <AboutCard label="Meaning" value={info.meaning} />
          <AboutCard label="Branding" value={`Often used in ${hsl.h > 260 ? "tech" : hsl.h > 50 && hsl.h < 170 ? "health" : "creative"} industries. ${hsl.s > 60 ? "Commands attention as an accent color." : "Works well as a neutral background."}`} />
          <AboutCard label="UI Usage" value={`${hsl.l > 60 ? "Good for backgrounds and surfaces." : hsl.l > 35 ? "Works for text and secondary elements." : "Ideal for headings and primary text."} ${getContrastHint(nh).aa ? "Meets WCAG AA standards." : "May need pairing with a higher contrast shade for text."}`} />
          <AboutCard label="Applications" value={(info.applications ?? []).join(", ") || "Design, web, branding"} />
        </div>
      </Section>

      {/* Variations */}
      <Section id="Variations" setRef={(el) => { sectionRefs.current["Variations"] = el; }}>
        <h2 className="text-xl font-black tracking-tight text-page mb-4">Variations</h2>
        <div className="space-y-6">
          {(["shades","tints","tones","hues","temperature"] as const).map((type) => (
            <div key={type} className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted capitalize">{type}</p>
              <div className="flex rounded-xl overflow-hidden h-10 border border-default">
                {generateVariations(type).map((vhex, i) => (
                  <button key={i} className="flex-1 hover:opacity-80 transition-opacity relative group" style={{ backgroundColor: vhex }}
                    onClick={() => copy(vhex, vhex)}>
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: getReadableTextColor(vhex) }}>{vhex}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Harmonies */}
      <Section id="Harmonies" setRef={(el) => { sectionRefs.current["Harmonies"] = el; }}>
        <h2 className="text-xl font-black tracking-tight text-page mb-4">Harmonies</h2>
        <HarmonySection baseHex={nh} onCopy={copy} />
      </Section>

      {/* Accessibility */}
      <Section id="Accessibility" setRef={(el) => { sectionRefs.current["Accessibility"] = el; }}>
        <h2 className="text-xl font-black tracking-tight text-page mb-4">Accessibility</h2>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["protanopia","deuteranopia","tritanopia","achromatopsia"] as const).map((mode) => (
              <div key={mode} className="rounded-xl border border-default overflow-hidden">
                <div className="h-12" style={{ backgroundColor: simulateVision(nh, mode) }} />
                <p className="p-2 text-xs font-semibold text-secondary capitalize">{mode}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ContrastCard bg="#FFFFFF" fg={nh} />
            <ContrastCard bg="#000000" fg={nh} />
          </div>
        </div>
      </Section>

      {/* Similar Colors */}
      <Section id="Similar Colors" setRef={(el) => { sectionRefs.current["Similar Colors"] = el; }}>
        <h2 className="text-xl font-black tracking-tight text-page mb-4">Similar Colors</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((s) => (
            <button key={s.hex} onClick={() => copy(s.hex, s.hex)}
              className="flex items-center gap-3 rounded-xl border border-default p-3 hover:bg-surface transition text-left">
              <span className="size-8 rounded-lg shrink-0" style={{ backgroundColor: s.hex }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-page truncate">{s.name}</p>
                <p className="text-xs text-muted font-mono">{s.hex} · {s.distance.toFixed(0)}%</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Libraries */}
      <Section id="Libraries" setRef={(el) => { sectionRefs.current["Libraries"] = el; }}>
        <h2 className="text-xl font-black tracking-tight text-page mb-4">Color Libraries</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {libraryMatches.map((m) => (
            <button key={m.name} onClick={() => copy(m.hex, `${m.name} (${m.hex})`)}
              className="flex items-center gap-3 rounded-xl border border-default p-3 hover:bg-surface transition text-left">
              <span className="size-8 rounded-lg shrink-0" style={{ backgroundColor: m.hex }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-page truncate">{m.name}</p>
                <p className="text-xs text-muted font-mono">{m.hex}{m.approx ? " (approx)" : ""}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Palettes */}
      <Section id="Palettes" setRef={(el) => { sectionRefs.current["Palettes"] = el; }}>
        <h2 className="text-xl font-black tracking-tight text-page mb-4">Palettes with {info.name}</h2>
        <PalettesSection baseHex={nh} onCopy={copy} />
      </Section>
    </div>
  );
}

/* ─── Sub-components ─── */

function Section({ id, setRef, children }: { id: string; setRef: (el: HTMLDivElement | null) => void; children: React.ReactNode }) {
  return <div ref={setRef} id={id} className="scroll-mt-24">{children}</div>;
}

function AboutCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-default p-4 space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-sm text-page leading-relaxed">{value}</p>
    </div>
  );
}

function CopyField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="rounded-xl border border-default p-3 cursor-pointer hover:bg-surface transition" onClick={onCopy}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-xs font-mono text-page mt-0.5 truncate">{value}</p>
    </div>
  );
}

function ContrastCard({ bg, fg }: { bg: string; fg: string }) {
  const ratio = getContrastRatio(fg, bg);
  return (
    <div className="rounded-xl border border-default overflow-hidden">
      <div className="h-16 flex items-center justify-center" style={{ backgroundColor: bg }}>
        <span className="text-lg font-black" style={{ color: fg }}>Aa</span>
      </div>
      <div className="p-2 space-y-0.5 text-xs">
        <p className="font-semibold text-page">On {bg === "#FFFFFF" ? "white" : "black"}</p>
        <p className="text-muted">{ratio.toFixed(2)}:1</p>
        <p className={ratio >= 4.5 ? "text-green-500" : "text-red-500"}>{ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "Fail"}</p>
      </div>
    </div>
  );
}

function HarmonySection({ baseHex, onCopy }: { baseHex: string; onCopy: (v: string, l?: string) => void }) {
  const modes = ["Analogous","Complementary","Split Complementary","Triadic","Tetradic","Square"] as const;
  const offsets: Record<string, number[]> = {
    Analogous: [-36,-18,0,18,36], Complementary: [0,180], "Split Complementary": [0,150,210],
    Triadic: [0,120,240], Tetradic: [0,60,180,240], Square: [0,90,180,270],
  };
  const baseHsl = hexToHsl(baseHex);
  return (
    <div className="space-y-4">
      {modes.map((mode) => {
        const colors = (offsets[mode] ?? [0]).map((off) => hslToHex((baseHsl.h + off + 360) % 360, baseHsl.s, baseHsl.l));
        return (
          <div key={mode} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{mode}</p>
              <button onClick={() => onCopy(colors.join(", "), `${mode} harmony`)} className="text-xs text-secondary hover:text-[var(--accent)] transition">Copy</button>
            </div>
            <div className="flex rounded-xl overflow-hidden h-10 border border-default">
              {colors.map((c, i) => (
                <button key={i} className="flex-1 hover:opacity-80 transition-opacity" style={{ backgroundColor: c }}
                  onClick={() => onCopy(c, c)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PalettesSection({ baseHex, onCopy }: { baseHex: string; onCopy: (v: string, l?: string) => void }) {
  const palettes = useMemo(() => {
    const modes = ["Analogous","Complementary","Triadic","Tetradic","Random"] as const;
    return modes.map((mode) => {
      const generated = generatePalette(
        [{ id: "base", hex: baseHex, alpha: 100, locked: true }, { id: "fill", hex: "#FFFFFF", alpha: 100, locked: false }],
        mode as "Analogous" | "Monochromatic" | "Complementary" | "Triadic" | "Split Complementary" | "Tetradic" | "Random", 5,
      );
      return { mode, colors: generated.map((c) => c.hex) };
    });
  }, [baseHex]);

  function loadInStudio(colors: string[]) {
    window.dispatchEvent(new CustomEvent("op-load-palette", { detail: { colors, mode: "Random" } }));
    window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "studio" } }));
  }

  return (
    <div className="space-y-4">
      {palettes.map((p) => (
        <div key={p.mode} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{p.mode}</p>
            <div className="flex gap-2">
              <button onClick={() => onCopy(p.colors.join(", "), "Palette")} className="text-xs text-secondary hover:text-[var(--accent)] transition">Copy</button>
              <button onClick={() => loadInStudio(p.colors)} className="text-xs text-secondary hover:text-[var(--accent)] transition">Studio</button>
            </div>
          </div>
          <div className="flex rounded-xl overflow-hidden h-10 border border-default">
            {p.colors.map((c, i) => (
              <button key={i} className="flex-1 hover:opacity-80 transition-opacity" style={{ backgroundColor: c }}
                onClick={() => onCopy(c, c)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
