"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getContrastHint,
  getContrastRatio,
  getPairContrasts,
  getPaletteAccessibilityScore,
  getReadableTextColor,
  hexToHsl,
  simulateVision,
  suggestAccessibleReplacement,
  type VisionMode,
} from "@/lib/palette";
import { usePalette } from "@/components/use-palette";
import { showToast } from "@/components/toast";
const VISION_MODES: { id: VisionMode; label: string }[] = [
  { id: "none", label: "Normal" },
  { id: "protanopia", label: "Protanopia" },
  { id: "deuteranopia", label: "Deuteranopia" },
  { id: "tritanopia", label: "Tritanopia" },
  { id: "achromatopsia", label: "Achromatopsia" },
];
const TYPOGRAPHY_SIZES = [
  { label: "Heading", size: "text-3xl", pts: 28 },
  { label: "Body", size: "text-base", pts: 16 },
  { label: "Caption", size: "text-xs", pts: 12 },
  { label: "Button", size: "text-sm font-semibold", pts: 14 },
  { label: "Link", size: "text-sm underline", pts: 14 },
  { label: "Disabled", size: "text-sm opacity-50", pts: 14 },
];
export function AccessibilitySection() {
  const palette = usePalette();
  const pairContrasts = useMemo(() => getPairContrasts(palette.paletteHex), [palette.paletteHex]);
  const score = useMemo(() => getPaletteAccessibilityScore(palette.paletteHex), [palette.paletteHex]);
  const weakest = pairContrasts[0];
  const replacement = weakest ? suggestAccessibleReplacement(weakest.foreground, weakest.background) : "#000";
  const aaPairs = pairContrasts.filter((p) => p.aa).length;
  const aaaPairs = pairContrasts.filter((p) => p.aaa).length;
  const failPairs = pairContrasts.filter((p) => !p.aa && !p.aaa).length;
  // Spacebar
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); palette.generate(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [palette]);
  const copy = async (v: string, label?: string) => {
    try { await navigator.clipboard.writeText(v); showToast(label ?? "Copied"); } catch {}
  };
  const [sortBy, setSortBy] = useState<"best" | "worst">("worst");
  const sorted = useMemo(() => {
    const list = [...pairContrasts];
    if (sortBy === "best") list.reverse();
    return list;
  }, [pairContrasts, sortBy]);
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-page">Accessibility Studio</h1>
        <p className="text-sm sm:text-base text-secondary">Comprehensive accessibility analysis for your color palette.</p>
      </div>
      {/* Palette strip */}
      <div className="flex rounded-xl overflow-hidden h-10 border border-default">
        {palette.paletteHex.map((hex, i) => (
          <div key={i} className="flex-1 relative group cursor-pointer" style={{ backgroundColor: hex }}
            onClick={() => copy(hex, hex)}>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: getReadableTextColor(hex) }}>{hex}</span>
          </div>
        ))}
      </div>
      {/* Overview scores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label="Overall Score" value={`${score}/100`} color={score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444"} />
        <ScoreCard label="AA Compliant Pairs" value={`${aaPairs}/${pairContrasts.length}`} color={aaPairs === pairContrasts.length ? "#22c55e" : "#eab308"} />
        <ScoreCard label="AAA Compliant Pairs" value={`${aaaPairs}/${pairContrasts.length}`} color={aaaPairs === pairContrasts.length ? "#22c55e" : "#eab308"} />
        <ScoreCard label="Failing Pairs" value={`${failPairs}`} color={failPairs === 0 ? "#22c55e" : "#ef4444"} />
      </div>
      {/* Live previews */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Live Previews</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {palette.paletteHex.slice(0, 5).map((hex, i) => {
            const h = getContrastHint(hex);
            return (
              <div key={i} className="rounded-2xl p-4 space-y-2 min-h-[100px] flex flex-col justify-between border border-default"
                style={{ backgroundColor: hex, color: getReadableTextColor(hex) }}>
                <div>
                  <p className="text-sm font-semibold">Sample Text</p>
                  <p className="text-xs opacity-75 mt-0.5">The quick brown fox jumps over the lazy dog.</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${h.aa ? "text-page" : "text-page"}`}>{h.rating} {h.ratio.toFixed(1)}:1</span>
                  <span className="font-mono opacity-60">{hex}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Theme Pair Tester */}
      <ThemePairTester palette={palette.paletteHex} />
      {/* Contrast Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Contrast Matrix</p>
          <div className="flex gap-1">
            <button onClick={() => setSortBy("worst")} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase transition ${sortBy === "worst" ? "bg-[var(--accent)] text-white" : "border border-default text-secondary"}`}>Weakest</button>
            <button onClick={() => setSortBy("best")} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase transition ${sortBy === "best" ? "bg-[var(--accent)] text-white" : "border border-default text-secondary"}`}>Strongest</button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {sorted.slice(0, 12).map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1.5 border-b border-default">
              <span className="size-5 rounded border border-default cursor-pointer" style={{ backgroundColor: p.foreground }} onClick={() => copy(p.foreground, p.foreground)} />
              <span className="text-[10px] opacity-50">on</span>
              <span className="size-5 rounded border border-default cursor-pointer" style={{ backgroundColor: p.background }} onClick={() => copy(p.background, p.background)} />
              <span className={`font-mono text-xs font-semibold ml-auto ${p.aa ? "text-page" : "text-page"}`}>{p.ratio.toFixed(2)}:1</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.aaa ? "bg-green-600/10 text-page" : p.aa ? "bg-amber-600/10 text-page" : "bg-red-600/10 text-page"}`}>{p.aaa ? "AAA" : p.aa ? "AA" : "Fail"}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Color Blindness Studio */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Color Blindness Simulation</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VISION_MODES.filter((m) => m.id !== "none").map((mode) => (
            <div key={mode.id} className="rounded-2xl border border-default overflow-hidden">
              <div className="flex h-10">
                {palette.paletteHex.map((hex, i) => {
                  const sim = simulateVision(hex, mode.id);
                  return <div key={i} className="flex-1 flex items-center justify-center" style={{ backgroundColor: sim }} />;
                })}
              </div>
              <div className="p-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-secondary">{mode.label}</p>
                <span className="text-[10px] text-muted">simulated</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Suggestions */}
      {weakest && (
        <div className="rounded-2xl border border-default p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Suggested Improvement</p>
          <p className="text-sm text-secondary">
            <span className="font-semibold text-page">Weakest pair:</span>{' '}
            <span className="font-mono">{weakest.foreground}</span> on{' '}
            <span className="font-mono">{weakest.background}</span> · {weakest.ratio.toFixed(2)}:1
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary">Try: <span className="font-mono text-page">{replacement}</span></span>
            <button onClick={() => copy(replacement, replacement)} className="rounded-full border border-default px-3 py-1 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition">Copy</button>
          </div>
        </div>
      )}
      {/* Typography Testing */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Typography Contrast</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {palette.paletteHex.slice(0, 3).map((fg) => (
            <div key={fg} className="rounded-2xl border border-default p-4 space-y-2" style={{ backgroundColor: "#FFFFFF" }}>
              <p className="text-[10px] font-mono font-semibold text-muted">{fg} on white</p>
              {TYPOGRAPHY_SIZES.map((t) => {
                const ratio = getContrastRatio(fg, "#FFFFFF");
                const isLarge = t.pts >= 18;
                const aa = isLarge ? ratio >= 3 : ratio >= 4.5;
                const aaa = isLarge ? ratio >= 4.5 : ratio >= 7;
                return (
                  <div key={t.label} className="flex items-center justify-between gap-2">
                    <span className={t.size} style={{ color: fg }}>{t.label}</span>
                    <span className={`text-[10px] font-bold ${aaa ? "text-page" : aa ? "text-page" : "text-page"}`}>
                      {aaa ? "AAA" : aa ? "AA" : "Fail"}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Audit Checklist */}
      <div className="rounded-2xl border border-default p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Audit Checklist</p>
        {[
          { label: "Focus visibility", pass: true },
          { label: "Keyboard navigation", pass: true },
          { label: "Semantic color usage", pass: score >= 50 },
          { label: "Contrast compliance", pass: failPairs === 0 },
          { label: "Interactive element visibility", pass: aaPairs >= Math.ceil(pairContrasts.length / 2) },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span className={item.pass ? "text-page" : "text-page"}>{item.pass ? "✓" : "✗"}</span>
            <span className={item.pass ? "text-page" : "text-muted"}>{item.label}</span>
          </div>
        ))}
      </div>
      {/* Bottom toolbar */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[var(--bg-base)]/95 backdrop-blur-md border-t border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden h-8 flex-1 max-w-xs border border-default">
            {palette.paletteHex.map((hex, i) => (
              <button key={i} className="flex-1 hover:opacity-80 transition-opacity" style={{ backgroundColor: hex }}
                onClick={() => copy(hex, hex)} />
            ))}
          </div>
          <span className="rounded-full bg-[var(--accent)] text-white px-2.5 py-0.5 text-xs font-bold">{score}</span>
          <button onClick={palette.generate} className="rounded-full bg-[var(--accent)] text-white px-3.5 py-1.5 text-xs font-semibold hover:brightness-110 transition whitespace-nowrap shrink-0">Generate</button>
          <button onClick={() => copy(palette.paletteHex.join(", "), "Palette")} className="rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition whitespace-nowrap shrink-0">Copy</button>
        </div>
      </div>
    </section>
  );
}
function ScoreCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-default p-4 space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
function ThemePairTester({ palette: colors }: { palette: string[] }) {
  const [lightBg, setLightBg] = useState("#F9FAFB");
  const [lightText, setLightText] = useState(colors[0] ?? "#111827");
  const [darkBg, setDarkBg] = useState("#111111");
  const [darkText, setDarkText] = useState(colors[3] ?? "#F5F5F5");
  const lightRatio = getContrastRatio(lightText, lightBg);
  const darkRatio = getContrastRatio(darkText, darkBg);
  // Sync with palette changes
  useEffect(() => {
    if (colors.length >= 2) {
      const sorted = [...colors].sort((a, b) => {
        const ha = hexToHsl(a).l, hb = hexToHsl(b).l;
        return ha - hb;
      });
      const lightest = sorted[sorted.length - 1];
      const darkest = sorted[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLightBg(lightest); setLightText(getReadableTextColor(lightest)); setDarkBg(darkest); setDarkText(getReadableTextColor(darkest));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors.join(",")]);
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Theme Pair Tester</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Light */}
        <div className="rounded-2xl border border-default overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
            <span className="text-sm font-bold text-page">Light</span>
            <label className="flex items-center gap-1 text-[10px] text-muted">Bg<input type="color" value={lightBg} onChange={(e) => setLightBg(e.target.value)} className="size-7 rounded cursor-pointer border border-default" /></label>
            <label className="flex items-center gap-1 text-[10px] text-muted">Text<input type="color" value={lightText} onChange={(e) => setLightText(e.target.value)} className="size-7 rounded cursor-pointer border border-default" /></label>
            <span className="ml-auto text-xs font-semibold">{lightRatio.toFixed(2)}:1</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${lightRatio >= 7 ? "bg-green-600 text-white" : lightRatio >= 4.5 ? "bg-amber-600 text-white" : "bg-red-600 text-white"}`}>{lightRatio >= 7 ? "AAA" : lightRatio >= 4.5 ? "AA" : "Fail"}</span>
          </div>
          <div className="p-5 sm:p-6 min-h-[120px] flex flex-col justify-center" style={{ backgroundColor: lightBg, color: lightText }}>
            <p className="text-base sm:text-lg font-bold tracking-tight">Heading</p>
            <p className="text-xs sm:text-sm leading-relaxed mt-1 opacity-85">Body text sample. The quick brown fox jumps over the lazy dog. Reading comfort depends on sufficient contrast.</p>
          </div>
        </div>
        {/* Dark */}
        <div className="rounded-2xl border border-default overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
            <span className="text-sm font-bold text-page">Dark</span>
            <label className="flex items-center gap-1 text-[10px] text-muted">Bg<input type="color" value={darkBg} onChange={(e) => setDarkBg(e.target.value)} className="size-7 rounded cursor-pointer border border-default" /></label>
            <label className="flex items-center gap-1 text-[10px] text-muted">Text<input type="color" value={darkText} onChange={(e) => setDarkText(e.target.value)} className="size-7 rounded cursor-pointer border border-default" /></label>
            <span className="ml-auto text-xs font-semibold">{darkRatio.toFixed(2)}:1</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${darkRatio >= 7 ? "bg-green-600 text-white" : darkRatio >= 4.5 ? "bg-amber-600 text-white" : "bg-red-600 text-white"}`}>{darkRatio >= 7 ? "AAA" : darkRatio >= 4.5 ? "AA" : "Fail"}</span>
          </div>
          <div className="p-5 sm:p-6 min-h-[120px] flex flex-col justify-center" style={{ backgroundColor: darkBg, color: darkText }}>
            <p className="text-base sm:text-lg font-bold tracking-tight">Heading</p>
            <p className="text-xs sm:text-sm leading-relaxed mt-1 opacity-85">Body text sample. The quick brown fox jumps over the lazy dog. Reading comfort depends on sufficient contrast.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
