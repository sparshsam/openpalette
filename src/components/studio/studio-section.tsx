"use client";

import { useCallback, useEffect, useState } from "react";
import { createPalette } from "@/lib/palette";
import { usePalette } from "@/components/use-palette";
import { useAutoSave } from "@/components/use-auto-save";
import { StudioToolbar } from "./studio-toolbar";
import { StudioSwatches } from "./studio-swatches";
import { StudioSidebar } from "./studio-sidebar";
import { ViewModal } from "./view-modal";
import { ExportModal } from "./export-modal";

export function StudioSection({ initialPalette, onConsumed }: {
  initialPalette?: { colors: string[]; mode: string } | null;
  onConsumed?: () => void;
}) {
  const palette = usePalette();
  const [showVision, setShowVision] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Auto-save / restore
  const restore = useCallback(
    (saved: { colors: { id: string; hex: string; alpha: number; locked: boolean }[]; mode: string }) => {
      const nc = saved.colors.map((c) => ({ id: c.id, hex: c.hex, alpha: c.alpha, locked: c.locked }));
      palette.setColors(nc);
      palette.setMode(saved.mode as "Analogous" | "Monochromatic" | "Complementary" | "Triadic" | "Split Complementary" | "Tetradic" | "Random");
    },
    [palette],
  );
  useAutoSave("studio", palette.colors, palette.mode, restore);

  // Load external palette (from Explore tab)
  useEffect(() => {
    if (initialPalette?.colors && initialPalette.colors.length >= 2) {
      const nc = createPalette(initialPalette.colors, initialPalette.colors.length);
      palette.setColors(nc);
      palette.setMode(initialPalette.mode as "Analogous" | "Monochromatic" | "Complementary" | "Triadic" | "Split Complementary" | "Tetradic" | "Random");
      onConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPalette]);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable) return;
      if (e.code === "Space") { e.preventDefault(); palette.generate(); }
      if (e.key.toLowerCase() === "u" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); palette.undo(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [palette]);

  return (
    <section className="relative">
      <StudioToolbar
        palette={palette}
        onOpenVision={() => setShowVision(true)}
        onOpenView={() => setShowView(true)}
        onOpenExport={() => setShowExport(true)}
      />
      <StudioSwatches palette={palette} />

      {/* Color blindness sidebar */}
      {showVision && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowVision(false)} />
          <StudioSidebar palette={palette} onClose={() => setShowVision(false)} />
        </>
      )}

      {/* View modal */}
      {showView && <ViewModal palette={palette} onClose={() => setShowView(false)} />}

      {/* Export modal */}
      {showExport && <ExportModal palette={palette} onClose={() => setShowExport(false)} />}
    </section>
  );
}
