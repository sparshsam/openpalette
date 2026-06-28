"use client";

import { useMemo } from "react";
import { createExportSnippets, exportFormats } from "@/lib/palette";
import { createSimplePdf, drawSwatches } from "@/lib/browser-exports";
import type { PaletteAPI } from "@/components/use-palette";

interface Props {
  palette: PaletteAPI;
  onClose: () => void;
}


export function ExportModal({ palette, onClose }: Props) {
  const snippets = useMemo(() => createExportSnippets(palette.paletteHex, palette.paletteAlphas), [palette.paletteHex, palette.paletteAlphas]);

  async function copyUrl() {
    const { encodePaletteState } = await import("@/lib/palette/import-engine");
    const encoded = encodePaletteState(palette.colors, palette.mode);
    const url = `${window.location.origin}${window.location.pathname}?palette=${encoded}`;
    try { await navigator.clipboard.writeText(url); palette.announce("URL copied"); } catch { palette.announce("Copy failed"); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-base)] rounded-2xl shadow-2xl border border-[var(--border-default)] w-full max-w-lg max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Export Palette</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Palette strip */}
          <div className="flex rounded-xl overflow-hidden h-8 border border-[var(--border-default)]">
            {palette.paletteHex.map((hex, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
            ))}
          </div>

          {/* Extra formats */}
          <div className="grid grid-cols-5 gap-2">
            <ExBtn icon="🔗" label="URL" onClick={copyUrl} />
            <ExBtn icon="📤" label="Share" onClick={copyUrl} />
            <ExBtn icon="</>" label="Embed" soon />
            <ExBtn icon="𝕏" label="X" soon />
            <ExBtn icon="📌" label="Pinterest" soon />
          </div>

          {/* Code formats */}
          <div className="grid grid-cols-2 gap-2">
            {exportFormats.map((f) => (
              <button key={f} className="rounded-xl border border-[var(--border-default)] p-3 text-left hover:bg-[var(--bg-surface)] transition-colors"
                onClick={async () => {
                  const code = snippets[f];
                  try { await navigator.clipboard.writeText(code); palette.announce(`${f} copied`); } catch {}
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{f}</p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Copy to clipboard</p>
              </button>
            ))}
          </div>

          {/* Download actions */}
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-xl border border-[var(--border-default)] p-3 text-left hover:bg-[var(--bg-surface)] transition-colors"
              onClick={() => {
                const can = document.createElement("canvas"); can.width = 1400; can.height = 840;
                const ctx = can.getContext("2d"); if (!ctx) return;
                drawSwatches(ctx, can.width, can.height, palette.paletteHex);
                can.toBlob((b) => { if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "palette.png"; a.click(); URL.revokeObjectURL(u); });
              }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">PNG</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Download image</p>
            </button>
            <button className="rounded-xl border border-[var(--border-default)] p-3 text-left hover:bg-[var(--bg-surface)] transition-colors"
              onClick={() => {
                const u = URL.createObjectURL(new Blob([createSimplePdf(palette.paletteHex)], { type: "application/pdf" }));
                const a = document.createElement("a"); a.href = u; a.download = "palette.pdf"; a.click(); URL.revokeObjectURL(u);
              }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">PDF</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Download sheet</p>
            </button>
            <button className="rounded-xl border border-[var(--border-default)] p-3 text-left opacity-50 cursor-not-allowed">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">ASE</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Coming soon</p>
            </button>
            <button className="rounded-xl border border-[var(--border-default)] p-3 text-left opacity-50 cursor-not-allowed">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Adobe</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Coming soon</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExBtn({ icon, label, onClick, soon }: { icon: string; label: string; onClick?: () => void; soon?: boolean }) {
  return (
    <button onClick={soon ? undefined : onClick} className={`flex flex-col items-center gap-1 rounded-xl border border-[var(--border-default)] p-2 transition-colors ${soon ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--bg-surface)]"}`}>
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{soon ? "Soon" : label}</span>
    </button>
  );
}
