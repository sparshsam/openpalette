"use client";

import { useCallback, useEffect, useState } from "react";
import { usePalette } from "@/components/use-palette";
import { useAutoSave } from "@/components/use-auto-save";
import { StudioToolbar } from "./studio-toolbar";
import { StudioSwatches } from "./studio-swatches";
import { StudioSidebar } from "./studio-sidebar";
import { ExportModal } from "./export-modal";

type SidePanel = "vision" | "preview" | "view" | null;

export function StudioSection() {
  const palette = usePalette();
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
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
        onOpenVision={() => setSidePanel("vision")}
        onOpenPreview={() => setSidePanel("preview")}
        onOpenView={() => setSidePanel("view")}
        onOpenExport={() => setShowExport(true)}
      />
      <StudioSwatches palette={palette} />

      {/* Right sidebar */}
      {sidePanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSidePanel(null)} />
          <StudioSidebar palette={palette} panel={sidePanel} onClose={() => setSidePanel(null)} />
        </>
      )}

      {/* Export modal */}
      {showExport && <ExportModal palette={palette} onClose={() => setShowExport(false)} />}
    </section>
  );
}
