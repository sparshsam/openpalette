"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeHex, hexToHsl, hslToHex } from "@/lib/palette";

/* ═══════════════════════════════════════════════════════════
   Color helpers
   ═══════════════════════════════════════════════════════════ */

/** Generate an 11-shade token scale from a base hex */
function generateTokenScale(baseHex: string): { shade: number; hex: string }[] {
  const hsl = hexToHsl(baseHex);
  const h = hsl.h;
  const s = hsl.s;
  const targets: Record<number, number> = {
    50: 95, 100: 88, 200: 78, 300: 66, 400: 54,
    500: 44, 600: 34, 700: 26, 800: 18, 900: 12, 950: 6,
  };
  return [50,100,200,300,400,500,600,700,800,900,950].map((shade) => {
    const l = targets[shade];
    const satWeight = shade === 500 ? 1 : shade < 500 ? shade / 500 : (1000 - shade) / 500;
    const sat = Math.max(4, Math.round(s * satWeight));
    return { shade, hex: hslToHex(h, sat, l) };
  });
}

/** Pick a contrasting readable text color */
function contrastText(bg: string): string {
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 128 ? "#111111" : "#F9FAFB";
}

/* ═══════════════════════════════════════════════════════════
   Sample palettes
   ═══════════════════════════════════════════════════════════ */

const SAMPLE_PALETTES = [
  ["#ff66c4","#7c3aed","#06b6d4","#10b981","#f59e0b"],  // Studio
  ["#ff6b35","#f7c59f","#efefd0","#004e89","#1a659e"],  // Sunset
  ["#e8f5e9","#c8e6c9","#66bb6a","#2e7d32","#1b5e20"],  // Mint
  ["#12000d","#1f0a18","#ff66c4","#ffe0f5","#8a6a7e"],  // Noir
  ["#e0f7fa","#80deea","#26c6da","#00838f","#004d40"],  // Ocean
  ["#fce4ec","#f48fb1","#ec407a","#ad1457","#4a0024"],  // Berry
  ["#0a0020","#1a0040","#7b2dff","#b388ff","#00ddff"],  // Cyber
  ["#fff8e1","#ffecb3","#ffd54f","#f57f17","#795548"],  // Gold
];

/* ═══════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════ */

const FEATURES_DATA = [
  { title: "Studio", href: "/studio", desc: "Full palette editor with drag swatches, quick-tune sliders, harmony modes, undo/redo, and inline color picker.", cta: "Open Studio" },
  { title: "Explore", href: "/studio#explore", desc: "320 curated palettes across 8 styles and 8 topics. Search, filter, and open any palette directly in the Studio.", cta: "Browse Palettes" },
  { title: "Extract", href: "/studio#extract", desc: "Upload any image and extract a palette in one click. Six extraction modes for any creative direction.", cta: "Extract Colors" },
  { title: "Contrast", href: "/studio#contrast", desc: "WCAG contrast checker with AA/AAA pass/fail grades and smart replacement suggestions for failing pairs.", cta: "Check Contrast" },
  { title: "Visualizer", href: "/studio#visualizer", desc: "Preview palettes across 7 real-world templates — hero, dashboard, buttons, forms, tables, alerts, pricing.", cta: "Preview Palettes" },
  { title: "Colors", href: "/studio#colors", desc: "150-color library organized by category. Browse, search, and copy individual colors with a single click.", cta: "Browse Colors" },
  { title: "Tokens", href: "/studio#tokens", desc: "Generate complete design token scales from any base color. Export as CSS, Tailwind, JSON, SCSS, XML, or Swift.", cta: "Generate Tokens" },
  { title: "Gradient", href: "/studio#gradient", desc: "Gradient studio with 14 presets and a full stop editor. Create smooth linear and radial gradients.", cta: "Make Gradients" },
  { title: "Accessibility", href: "/studio#accessibility", desc: "Contrast matrix, color blindness simulation, theme pair tester, typography contrast, and full audit checklist.", cta: "Audit Colors" },
];

const WORKFLOWS_DATA = [
  { title: "Design a brand palette", steps: ["Generate a palette in Studio", "Check contrast in Accessibility", "Preview across UI templates", "Export tokens for your dev team"] },
  { title: "Extract from inspiration", steps: ["Drop a photo into Extract", "Choose an extraction mode", "Fine-tune colors in Studio", "Save and share the URL"] },
  { title: "Build a design system", steps: ["Lock in your primary color", "Generate the full token scale", "Preview on real UI components", "Export as CSS, Tailwind, or JSON"] },
];

/* ═══════════════════════════════════════════════════════════
   Landing Page
   ═══════════════════════════════════════════════════════════ */

export function LandingPage() {
  /* ── State ── */
  const [heroPalette, setHeroPalette] = useState(SAMPLE_PALETTES[0]);
  const [tokenHex, setTokenHex] = useState("#7C3AED");
  const [selectedExport, setSelectedExport] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, number[]>>({});
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const tokenScale = useMemo(() => generateTokenScale(tokenHex), [tokenHex]);
  const nh = useMemo(() => normalizeHex(tokenHex) ?? "#7C3AED", [tokenHex]);

  /* ── Spacebar: shuffle hero palette ── */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        const next = SAMPLE_PALETTES[Math.floor(Math.random() * SAMPLE_PALETTES.length)];
        setHeroPalette(next);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* ── Spacebar on token input ── */
  const shuffleToken = useCallback(() => {
    const h = Math.floor(Math.random() * 360);
    const s = 40 + Math.floor(Math.random() * 50);
    const l = 35 + Math.floor(Math.random() * 25);
    setTokenHex(hslToHex(h, s, l));
  }, []);

  /* ── Step toggles ── */
  const toggleStep = useCallback((wfTitle: string, idx: number) => {
    setCheckedSteps((prev) => {
      const current = prev[wfTitle] ?? [];
      if (current.includes(idx)) {
        return { ...prev, [wfTitle]: current.filter((i) => i !== idx) };
      }
      return { ...prev, [wfTitle]: [...current, idx] };
    });
  }, []);

  /* ── Feature palette shuffle (per card) ── */
  const [shuffledFeatures, setShuffledFeatures] = useState<Record<string, number>>({});
  const shuffleFeaturePalette = useCallback((title: string) => {
    setShuffledFeatures((prev) => ({
      ...prev,
      [title]: ((prev[title] ?? 0) + 1) % SAMPLE_PALETTES.length,
    }));
  }, []);

  return (
    <div className="flex flex-col" suppressHydrationWarning>

      {/* ═══════ TOAST ═══════ */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[var(--accent)] text-white px-5 py-2 text-xs font-semibold shadow-lg transition-opacity duration-200">
          {toast}
        </div>
      )}

      {/* ═══════ HERO ═══════ */}
      <section className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-14 sm:pb-18">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-center">
          {/* Text side */}
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)] mb-5">
              Local-First Color Studio
            </p>
            <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-black tracking-tight text-[var(--text-primary)] leading-[1.08]">
              Create color systems that work.
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-5 leading-relaxed">
              OpenPalette is a local-first, open-source color studio for designers and developers.
              Generate palettes, check accessibility, build token scales, and export production-ready
              color systems — all in your browser. No account needed.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/studio"
                className="rounded-full bg-[var(--accent)] text-white px-7 py-3 text-sm font-semibold hover:brightness-110 transition bounce-press"
              >
                Enter Studio
              </Link>
              <a
                href="https://github.com/sparshsam/openpalette"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-7 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition bounce-press"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
          {/* Visual side — interactive app mockup */}
          <div className="rounded-2xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-surface)] shadow-sm">
            {/* Mockup toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)] bg-[var(--bg-base)]">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-500/60" />
                <span className="size-2.5 rounded-full bg-yellow-500/60" />
                <span className="size-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex gap-1.5 ml-3">
                {["Studio","Explore","Extract","Tokens"].map((t) => (
                  <span key={t} className={`rounded-full px-3 py-1 text-[10px] font-semibold ${t === "Studio" ? "bg-[var(--accent)] text-white" : "border border-[var(--border-default)] text-[var(--text-muted)]"}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {/* Interactive palette strip — click to copy */}
            <div className="flex h-16 sm:h-20 cursor-pointer" onClick={() => showToast("Palette shuffled. Press Space to shuffle again.")}>
              {heroPalette.map((hex, i) => (
                <div
                  key={i}
                  className="flex-1 flex items-end relative group hover:flex-[1.3] transition-all duration-300"
                  style={{ backgroundColor: hex }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(hex).catch(() => {});
                    showToast(`Copied ${hex}`);
                  }}
                >
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold drop-shadow-sm opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ color: contrastText(hex) }}>{hex}</span>
                </div>
              ))}
            </div>
            {/* Mockup action row — Generate shuffles the palette */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border-default)] bg-[var(--bg-base)]">
              <button onClick={() => {
                const next = SAMPLE_PALETTES[Math.floor(Math.random() * SAMPLE_PALETTES.length)];
                setHeroPalette(next);
              }} className="rounded-full bg-[var(--accent)] text-white px-4 py-1.5 text-[11px] font-semibold hover:brightness-110 transition bounce-press">
                Generate
              </button>
              <button onClick={() => showToast("Palette copied")} className="rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--accent)] transition bounce-press">
                Copy
              </button>
              <Link href="/studio" className="rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--accent)] transition bounce-press">
                Export
              </Link>
              <div className="flex rounded overflow-hidden h-5 ml-auto border border-[var(--border-default)]">
                {heroPalette.map((h, i) => (
                  <span key={i} className="w-4" style={{ backgroundColor: h }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ POSITIONING STRIP ═══════ */}
      <div className="border-t border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-3 flex flex-wrap gap-x-8 gap-y-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span>Open Source</span>
          <span>Privacy First</span>
          <span>No Account Required</span>
          <span>Local-First</span>
          <span>Zero Tracking</span>
          <span>MIT Licensed</span>
          <span>11 Export Formats</span>
        </div>
      </div>

      {/* ═══════ FEATURES ═══════ */}
      <section className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="max-w-xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Everything you need to work with color.
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-3">
            Nine integrated tools that share a single palette. No context switching, no cloud sync.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES_DATA.map((f, fi) => {
            const palIdx = shuffledFeatures[f.title] ?? fi;
            const pal = SAMPLE_PALETTES[palIdx % SAMPLE_PALETTES.length];
            return (
              <Link
                key={f.title}
                href={f.href}
                className="group rounded-2xl border border-[var(--border-default)] overflow-hidden hover:border-[var(--accent)]/50 hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Clickable palette strip — shuffles on click */}
                <div
                  className="flex h-10 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    shuffleFeaturePalette(f.title);
                  }}
                  title="Click to shuffle palette"
                >
                  {pal.map((hex, i) => (
                    <div key={i} className="flex-1 transition-all duration-200 group-hover:flex-[1.15]" style={{ backgroundColor: hex }} />
                  ))}
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {f.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-0 group-hover:translate-x-1">
                    {f.cta}
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 1l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══════ TOKEN SCALE PREVIEW ═══════ */}
      <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12">
        <div className="rounded-2xl border border-[var(--border-default)] overflow-hidden">
          {/* Token scale bar — live from tokenHex */}
          <div className="flex">
            {tokenScale.map((s) => (
              <div key={s.shade} className="flex-1 h-12 sm:h-14 relative group cursor-pointer"
                style={{ backgroundColor: s.hex }}
                onClick={() => { navigator.clipboard.writeText(s.hex).catch(() => {}); showToast(`Copied ${s.hex}`); }}
              >
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] sm:text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm"
                  style={{ color: s.shade >= 600 ? "#fff" : "#111" }}>
                  {s.shade}
                </span>
              </div>
            ))}
          </div>
          {/* Controls row */}
          <div className="px-4 py-3 border-t border-[var(--border-default)] bg-[var(--bg-base)] flex flex-wrap items-center gap-3">
            {/* Color swatch + drag picker */}
            <input
              ref={colorInputRef}
              type="color"
              value={nh}
              onChange={(e) => setTokenHex(e.target.value.toUpperCase())}
              className="size-7 rounded cursor-pointer border border-[var(--border-default)] bg-transparent shrink-0"
            />
            {/* HEX input */}
            <input
              type="text"
              value={tokenHex}
              onChange={(e) => setTokenHex(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = normalizeHex(tokenHex);
                  if (n) setTokenHex(n);
                }
              }}
              className="rounded-lg border border-[var(--border-default)] bg-transparent px-2 py-1 text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors uppercase w-20"
              spellCheck={false}
            />
            <span className="text-[10px] font-semibold text-[var(--text-muted)]">{tokenScale.length} shades</span>
            {/* Shuffle button */}
            <button
              onClick={shuffleToken}
              className="rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition bounce-press"
              title="Randomize (or press Space in the HEX field)"
            >
              Shuffle
            </button>
            {/* Export format chips — clickable */}
            <div className="ml-auto flex gap-1 flex-wrap">
              {["CSS","Tailwind","JSON","SCSS"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedExport(selectedExport === f ? null : f)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
                    selectedExport === f
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--accent)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ PHILOSOPHY + CONTRAST ═══════ */}
      <section className="border-t border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
          {/* Top: heading + intro */}
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Built for privacy, by design.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-3 leading-relaxed">
              OpenPalette runs entirely in your browser. No data leaves your machine,
              no account is required, and no tracking scripts are loaded. Your palette
              data stays in localStorage — right where it belongs.
            </p>
          </div>

          {/* Middle: full-width dual contrast preview */}
          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden mb-10">
            <div className="grid sm:grid-cols-2">
              {/* Light */}
              <div className="border-b sm:border-b-0 sm:border-r border-[var(--border-default)]">
                <div className="px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-base)]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Light Theme</span>
                </div>
                <div className="p-5 sm:p-6 space-y-3 transition-colors duration-200" style={{ backgroundColor: "#F9FAFB", color: "#111111" }}>
                  <p className="text-base sm:text-lg font-bold tracking-tight">Light Mode Preview</p>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-80">
                    Body text sample. The quick brown fox jumps over the lazy dog.
                    Reading comfort depends on sufficient contrast between foreground and background.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-semibold opacity-70">#111111 on #F9FAFB</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-600 text-white">
                      AAA 15.4:1
                    </span>
                  </div>
                </div>
              </div>
              {/* Dark */}
              <div>
                <div className="px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-base)]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Dark Theme</span>
                </div>
                <div className="p-5 sm:p-6 space-y-3 transition-colors duration-200" style={{ backgroundColor: "#111111", color: "#F5F5F5" }}>
                  <p className="text-base sm:text-lg font-bold tracking-tight">Dark Mode Preview</p>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-80">
                    Body text sample. The quick brown fox jumps over the lazy dog.
                    Reading comfort depends on sufficient contrast between foreground and background.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-semibold opacity-70">#F5F5F5 on #111111</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-600 text-white">
                      AAA 15.4:1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: privacy principles as a card grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PrincipleCard
              label="Local-First"
              description="Everything runs client-side. Palette generation, color math, export rendering — all computed in your browser."
            />
            <PrincipleCard
              label="No Accounts"
              description="No sign-up, no login, no email. Open the page and start creating. Your work is saved to localStorage between sessions."
            />
            <PrincipleCard
              label="Zero Tracking"
              description="No analytics, no telemetry, no third-party scripts. OpenPalette respects your privacy completely."
            />
            <PrincipleCard
              label="Open Source"
              description="MIT-licensed on GitHub. Fork it, customize it, or deploy your own instance. Contributions welcome."
            />
          </div>
        </div>
      </section>

      {/* ═══════ EXPORTS ═══════ */}
      <section className="border-t border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Professional exports for every platform.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-3 max-w-lg leading-relaxed">
              Export palettes and token scales in 11 formats. Copy with one click or download as a file.
              Every format is production-ready.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            {[
              { name: "CSS Variables", code: `--op-brand-500: ${nh};` },
              { name: "Tailwind Config", code: `500: '${nh}'` },
              { name: "JSON Tokens", code: `"500": "${nh}"` },
              { name: "SCSS", code: `$brand-500: ${nh};` },
              { name: "Android XML", code: '<color name="brand_500">' },
              { name: "iOS Swift", code: "static let brand500" },
            ].map((fmt) => (
              <button
                key={fmt.name}
                onClick={() => { navigator.clipboard.writeText(fmt.code).catch(() => {}); showToast(`Copied ${fmt.name}`); }}
                className="rounded-xl border border-[var(--border-default)] overflow-hidden text-left hover:border-[var(--accent)]/50 hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="h-2" style={{ backgroundColor: nh }} />
                <div className="p-3 space-y-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{fmt.name}</p>
                  <code className="block text-[10px] font-mono text-[var(--text-muted)] truncate">{fmt.code}</code>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WORKFLOWS ═══════ */}
      <section className="border-t border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-10">
            Common workflows.
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOWS_DATA.map((wf) => {
              const done = checkedSteps[wf.title] ?? [];
              return (
                <div key={wf.title} className="rounded-2xl border border-[var(--border-default)] p-5 hover:border-[var(--accent)]/30 transition-colors">
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">{wf.title}</h3>
                  <ol className="space-y-3">
                    {wf.steps.map((step, i) => {
                      const isDone = done.includes(i);
                      return (
                        <li key={i} className="flex gap-3 text-sm">
                          <button
                            onClick={() => toggleStep(wf.title, i)}
                            className={`shrink-0 size-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 transition-all duration-200 ${
                              isDone
                                ? "bg-[var(--accent)] text-white scale-110"
                                : "bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
                            }`}
                            aria-label={isDone ? `Mark ${step} as not done` : `Mark ${step} as done`}
                          >
                            {isDone ? "✓" : i + 1}
                          </button>
                          <span className={`transition-colors ${isDone ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]"}`}>
                            {step}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ AUDIENCE + CLOSING CTA ═══════ */}
      <section className="border-t border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                For designers, developers, and teams.
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-3 leading-relaxed max-w-md">
                Whether you&apos;re building a design system, extracting a palette from a photo,
                or auditing an existing scheme for accessibility — OpenPalette adapts.
                No subscriptions, no seats, no limits.
              </p>
            </div>
            <ul className="space-y-2.5">
              {[
                "Product designers crafting UI color systems",
                "Frontend developers building component libraries",
                "Brand designers defining visual identities",
                "Students learning color theory and accessibility",
                "Open source maintainers shipping design systems",
                "Anyone who needs great colors, fast",
              ].map((a) => (
                <li key={a} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <span className="size-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          {/* Inline CTA */}
          <div className="mt-12 pt-10 border-t border-[var(--border-default)] text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Start creating. No sign-up required.
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm mx-auto">
              Open the studio and begin working with color immediately. Everything runs in your browser.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link
                href="/studio"
                className="rounded-full bg-[var(--accent)] text-white px-7 py-3 text-sm font-semibold hover:brightness-110 transition bounce-press"
              >
                Enter Studio
              </Link>
              <a
                href="https://github.com/sparshsam/openpalette"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-7 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition bounce-press"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>OpenPalette — MIT License</p>
          <div className="flex items-center gap-5">
            <Link href="/about" className="hover:text-[var(--accent)] transition">About</Link>
            <Link href="/privacy" className="hover:text-[var(--accent)] transition">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--accent)] transition">Terms</Link>
            <a href="https://github.com/sparshsam/openpalette" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function PrincipleCard({ label, description }: { label: string; description: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] p-4 space-y-1.5">
      <h3 className="text-sm font-bold text-[var(--text-primary)]">{label}</h3>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}
