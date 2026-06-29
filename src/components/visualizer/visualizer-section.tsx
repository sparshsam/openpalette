"use client";

import { useEffect, useMemo, useState } from "react";
import {
  VisualizerPreview,
  type Visualizer,
} from "@/components/studio/visualizers";
import { usePalette } from "@/components/use-palette";
import { ExportModal } from "@/components/studio/export-modal";
import { showToast } from "@/components/toast";

const CATEGORIES = [
  "All", "Mobile/Web UI", "Branding", "Typography", "Dashboard", "Poster", "Social",
] as const;

const TEMPLATES: { id: Visualizer; cat: string }[] = [
  { id: "Website", cat: "Mobile/Web UI" },
  { id: "Mobile", cat: "Mobile/Web UI" },
  { id: "Dashboard", cat: "Dashboard" },
  { id: "Brand", cat: "Branding" },
  { id: "Typography", cat: "Typography" },
  { id: "Poster", cat: "Poster" },
  { id: "Social", cat: "Social" },
];

export function VisualizerSection() {
  const palette = usePalette();
  const [category, setCategory] = useState("All");
  const [showExport, setShowExport] = useState(false);

  // Spacebar generates
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); palette.generate(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [palette]);

  const filtered = category === "All"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.cat === category);

  const css = useMemo(
    () => `linear-gradient(135deg, ${palette.paletteHex.join(", ")})`,
    [palette.paletteHex],
  );

  function copyPalette() {
    navigator.clipboard.writeText(palette.paletteHex.join(", ")).catch(() => {});
    showToast("Palette copied");
  }

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex).catch(() => {});
    showToast(`Copied ${hex}`);
  }

  function openInStudio() {
    window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "studio" } }));
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-page">Palette Visualizer</h1>
        <p className="text-sm sm:text-base text-secondary">Preview your colors on real designs for a better visual understanding.</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              category === c
                ? "bg-[var(--accent)] text-white"
                : "border border-default text-secondary hover:text-[var(--accent)]"
            }`}
          >{c}</button>
        ))}
      </div>

      {/* Template gallery */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="rounded-2xl border border-default overflow-hidden bg-[var(--bg-surface)]">
            <div className="p-3 sm:p-4">
              <VisualizerPreview
                active={t.id}
                colors={palette.paletteHex}
                gradient={css}
              />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">{t.id}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <p className="text-sm text-muted py-12 text-center">No templates in this category yet.</p>
      )}

      {/* Sticky bottom toolbar — edge-to-edge */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[var(--bg-base)]/95 backdrop-blur-md border-t border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          {/* Palette strip — clickable swatches */}
          <div className="flex rounded-lg overflow-hidden h-8 flex-1 max-w-xs border border-default">
            {palette.paletteHex.map((hex, i) => (
              <button key={i} className="flex-1 cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: hex }}
                onClick={() => copyHex(hex)} title={`Copy ${hex}`} />
            ))}
          </div>

          <span className="text-xs text-muted font-semibold tabular-nums w-8 text-center shrink-0">{palette.colors.length}</span>

          <button onClick={palette.generate} className="rounded-full bg-[var(--accent)] text-white px-3.5 py-1.5 text-xs font-semibold hover:brightness-110 transition whitespace-nowrap shrink-0">
            Generate
          </button>
          <button onClick={openInStudio} className="rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition whitespace-nowrap shrink-0">
            Studio
          </button>
          <button onClick={copyPalette} className="rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition whitespace-nowrap shrink-0">
            Copy
          </button>
          <button onClick={() => setShowExport(true)} className="rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition whitespace-nowrap shrink-0">
            Export
          </button>
        </div>
      </div>

      {showExport && <ExportModal palette={palette} onClose={() => setShowExport(false)} />}
    </section>
  );
}
