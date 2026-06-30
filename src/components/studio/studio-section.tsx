"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/workspace-context";
import { StudioToolbar } from "./studio-toolbar";
import { StudioSwatches } from "./studio-swatches";
import { StudioSidebar } from "./studio-sidebar";
import { ViewModal } from "./view-modal";
import { ExportModal } from "./export-modal";

export function StudioSection() {
  const palette = useWorkspace();
  const [showVision, setShowVision] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showExport, setShowExport] = useState(false);

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
