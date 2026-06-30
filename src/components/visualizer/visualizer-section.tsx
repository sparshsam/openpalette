"use client";

import { useMemo, useState } from "react";
import {
  VisualizerPreview,
  type Visualizer,
} from "@/components/studio/visualizers";
import { useWorkspace } from "@/components/workspace-context";

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
  const ws = useWorkspace();
  const [category, setCategory] = useState("All");

  const filtered = category === "All"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.cat === category);

  const css = useMemo(
    () => `linear-gradient(135deg, ${ws.paletteHex.join(", ")})`,
    [ws.paletteHex],
  );


  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-page">Palette Visualizer</h1>
        <p className="text-sm sm:text-base text-secondary">Preview your colors on real designs for a better visual understanding.</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              category === c
                ? "bg-[var(--accent)] text-white"
                : "border border-default text-secondary hover:text-[var(--accent)] hover-accent bounce-press"
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
                colors={ws.paletteHex}
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
    </section>
  );
}
