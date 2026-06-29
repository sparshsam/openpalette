"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getContrastRatio,
  getReadableTextColor,
  hslToHex,
  normalizeHex,
} from "@/lib/palette";

const QUOTES = [
  "Design is not just what it looks like and feels like. Design is how it works. — Steve Jobs",
  "Good design is as little design as possible. — Dieter Rams",
  "The details are not the details. They make the design. — Charles Eames",
  "Color is a power which directly influences the soul. — Wassily Kandinsky",
  "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
  "The goal of a designer is to listen, observe, understand, sympathize, empathize, synthesize, and stimulate. — Stefan Sagmeister",
  "Every great design begins with an even better story. — Lorinda Mamo",
];

function randomHex(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 30 + Math.floor(Math.random() * 55);
  const l = 15 + Math.floor(Math.random() * 65);
  return hslToHex(h, s, l);
}

function parseHexPair(): { fg: string; bg: string } | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace("#", "");
  const parts = hash.split("/");
  if (parts.length >= 2 && parts[0].length === 6 && parts[1].length === 6) {
    return { fg: `#${parts[0].toUpperCase()}`, bg: `#${parts[1].toUpperCase()}` };
  }
  return null;
}

export function ContrastSection() {
  const initial = useMemo(() => parseHexPair(), []);
  const [fg, setFg] = useState(initial?.fg ?? "#2D1B69");
  const [bg, setBg] = useState(initial?.bg ?? "#FFE4B5");
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const nhFg = normalizeHex(fg) ?? "#1a001a";
  const nhBg = normalizeHex(bg) ?? "#F9FAFB";
  const ratio = useMemo(() => getContrastRatio(nhFg, nhBg), [nhFg, nhBg]);

  // Spacebar to randomize
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        const newFg = randomHex();
        const newBg = randomHex();
        const r = getContrastRatio(newFg, newBg);
        // If the random pair is too low contrast, adjust one of them
        if (r < 3) {
          const tc = getReadableTextColor(newBg);
          setFg(tc === "#111827" ? "#000000" : "#FFFFFF");
          setBg(newBg);
        } else {
          setFg(newFg);
          setBg(newBg);
        }
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    const f = nhFg.replace("#", "").toLowerCase();
    const b = nhBg.replace("#", "").toLowerCase();
    window.history.replaceState(null, "", `#/contrast/${f}-${b}`);
  }, [nhFg, nhBg]);

  const rating =
    ratio >= 7 ? "AAA" :
    ratio >= 4.5 ? "AA" :
    ratio >= 3 ? "Large" :
    "Fail";

  const stars = ratio >= 7 ? 3 : ratio >= 4.5 ? 2 : ratio >= 3 ? 1 : 0;
  const ratingColor = stars >= 3 ? "var(--accent)" : stars >= 2 ? "#22c55e" : stars >= 1 ? "#eab308" : "#ef4444";

  function swap() { setFg(bg); setBg(fg); }
  function enhance(mode: "fg" | "bg" | "both") {
    if (mode === "fg") setFg(getReadableTextColor(nhBg) === "#111827" ? "#000000" : "#FFFFFF");
    else if (mode === "bg") setBg(getReadableTextColor(nhFg) === "#111827" ? "#000000" : "#FFFFFF");
    else { setFg("#000000"); setBg("#FFFFFF"); }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-page">Color Contrast Checker</h1>
        <p className="text-base sm:text-lg text-secondary">Calculate the contrast ratio of text and background colors.</p>
      </div>

      <div className="grid gap-10 md:grid-cols-2 items-start">
        {/* Left — checker */}
        <div className="rounded-2xl border border-default p-6 sm:p-8 space-y-5 bg-[var(--bg-surface)]">
          <ColorInput label="Text" hex={fg} nh={nhFg} onChange={setFg} />
          <ColorInput label="Background" hex={bg} nh={nhBg} onChange={setBg} />

          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs pt-1">
            <button onClick={swap} className="font-semibold text-secondary hover:text-[var(--accent)] hover-accent bounce-press transition">⇄ Swap colors</button>
            <button onClick={() => enhance("fg")} className="font-semibold text-secondary hover:text-[var(--accent)] hover-accent bounce-press transition">Adjust text color</button>
            <button onClick={() => enhance("bg")} className="font-semibold text-secondary hover:text-[var(--accent)] hover-accent bounce-press transition">Adjust background color</button>
            <button onClick={() => enhance("both")} className="font-semibold text-secondary hover:text-[var(--accent)] hover-accent bounce-press transition">Adjust both colors</button>
          </div>

          <div className="border-t border-default" />

          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-page">{ratio.toFixed(2)}</span>
              <span className="text-xl font-semibold text-muted">:1</span>
              <span className="ml-auto text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: ratingColor }}>{rating}</span>
            </div>

            <div className="flex gap-1 text-lg" style={{ color: "var(--border-default)" }}>
              {[1, 2, 3].map((s) => <span key={s} style={{ color: s <= stars ? ratingColor : undefined }}>★</span>)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <Pass label="AA Small" pass={ratio >= 4.5} />
              <Pass label="AA Large" pass={ratio >= 3} />
              <Pass label="AAA Small" pass={ratio >= 7} />
              <Pass label="AAA Large" pass={ratio >= 4.5} />
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {ratio >= 7 ? "Excellent contrast — passes all WCAG levels with room to spare." :
               ratio >= 4.5 ? "Good contrast — AA for normal text, AAA for large text." :
               ratio >= 3 ? "Meets minimum for large text only. Enhance for better readability." :
               "Does not meet WCAG minimums. Try adjusting the text or background color."}
            </p>
          </div>
        </div>

        {/* Right — live preview */}
        <div className="rounded-2xl border border-default overflow-hidden min-h-[400px] flex flex-col relative" style={{ backgroundColor: nhBg }}>
          <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 text-center" style={{ color: nhFg }}>
            <p className="text-sm sm:text-base leading-relaxed opacity-85 max-w-md italic">&ldquo;{quote}&rdquo;</p>
          </div>
          <div className="h-10 flex border-t" style={{ borderColor: nhFg + "20" }}>
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: nhFg }}>
              <span className="text-[11px] font-mono font-bold" style={{ color: getReadableTextColor(nhFg) }}>{nhFg}</span>
            </div>
            <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: nhBg }}>
              <span className="text-[11px] font-mono font-bold" style={{ color: nhFg }}>{nhBg}</span>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-2xl space-y-3 text-sm text-secondary leading-relaxed">
        <h2 className="text-lg font-black tracking-tight text-page">How does it work?</h2>
        <p>
          This tool follows the <strong className="text-page">Web Content Accessibility Guidelines (WCAG)</strong>, which are a series of
          recommendations for making the web more accessible.
        </p>
        <p>
          Regarding colors, the standard defines two levels of contrast ratio:{' '}
          <strong className="text-page">AA</strong> (minimum contrast) and <strong className="text-page">AAA</strong> (enhanced contrast).
        </p>
        <p>
          The level AA requires a contrast ratio of at least <strong className="text-page">4.5:1</strong> for normal text and{' '}
          <strong className="text-page">3:1</strong> for large text (at least 18pt) or bold text.
        </p>
        <p>
          The level AAA requires a contrast ratio of at least <strong className="text-page">7:1</strong> for normal text and{' '}
          <strong className="text-page">4.5:1</strong> for large text or bold text.
        </p>
        <a
          href="https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          Learn more →
        </a>
      </div>
    </section>
  );
}

function ColorInput({ label, hex, nh, onChange }: {
  label: string; hex: string; nh: string; onChange: (v: string) => void;
}) {
  const colorRef = useRef<HTMLInputElement>(null);

  function copyHex() {
    navigator.clipboard.writeText(nh).catch(() => {});
    window.dispatchEvent(new CustomEvent("op-toast", { detail: { msg: `Copied ${nh}` } }));
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <div className="relative">
        <input type="text" value={hex} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-default bg-[var(--bg-base)] pl-3 pr-20 py-2.5 text-sm font-mono text-page outline-none focus:border-[var(--accent)] transition-colors uppercase"
          placeholder="#000000" spellCheck={false} />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button onClick={copyHex} className="text-[10px] font-semibold text-muted hover:text-[var(--accent)] hover-accent bounce-press transition px-1" title="Copy HEX">📋</button>
          <button onClick={() => colorRef.current?.click()}
            className="size-7 rounded border border-default cursor-pointer" style={{ backgroundColor: nh }}
            title="Pick color" aria-label={`Pick ${label.toLowerCase()} color`} />
        </div>
        <input ref={colorRef} type="color" value={nh} onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="sr-only" tabIndex={-1} />
      </div>
    </div>
  );
}

function Pass({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
      pass ? "bg-green-600/10 text-page" : "bg-red-600/10 text-page"
    }`}>
      <span className="text-sm leading-none">{pass ? "✓" : "✗"}</span>
      {label}
    </div>
  );
}
