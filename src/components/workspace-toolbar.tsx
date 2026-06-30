"use client";

import { memo, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { PaletteInspector } from "./palette-inspector";
import { ExportModal } from "./export-modal";

export const WorkspaceToolbar = memo(function WorkspaceToolbar() {
  const ws = useWorkspace();
  const [showInspector, setShowInspector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [snapName, setSnapName] = useState("");

  return (
    <div className="sticky bottom-0 z-30 bg-[var(--bg-base)]/95 backdrop-blur-md border-t border-[var(--border-default)]">
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 overflow-x-auto max-w-full">
        {/* Palette preview strip */}
        <div className="flex rounded-lg overflow-hidden h-8 border border-default shrink-0 min-w-[80px] max-w-[160px] flex-1">
          {ws.paletteHex.map((hex, i) => (
            <button key={ws.colors[i]?.id ?? i}
              className="flex-1 min-w-[16px] hover:opacity-80 transition-opacity cursor-pointer"
              style={{ backgroundColor: hex }}
              onClick={() => {
                navigator.clipboard.writeText(hex).catch(() => {});
                ws.communicate(`Copied ${hex}`);
              }}
              title={hex} />
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-[var(--border-default)] shrink-0" />

        {/* Generate */}
        <button onClick={ws.generate}
          className="shrink-0 rounded-full bg-[var(--accent)] text-white px-3 sm:px-4 py-1.5 text-xs font-semibold hover:brightness-110 transition bounce-press whitespace-nowrap">
          Generate
        </button>

        {/* Undo / Redo */}
        <button onClick={ws.undo} disabled={ws.undoStack.length === 0}
          className="shrink-0 rounded-full border border-default px-2.5 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition disabled:opacity-30 disabled:cursor-not-allowed bounce-press"
          title="Undo (Ctrl+Z)">↩</button>
        <button onClick={ws.redo} disabled={ws.redoStack.length === 0}
          className="shrink-0 rounded-full border border-default px-2.5 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition disabled:opacity-30 disabled:cursor-not-allowed bounce-press"
          title="Redo (Ctrl+Shift+Z)">↪</button>

        <div className="w-px h-6 bg-[var(--border-default)] shrink-0" />

        {/* Copy */}
        <button onClick={ws.copyPalette}
          className="shrink-0 rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press whitespace-nowrap">
          Copy
        </button>

        {/* Save */}
        <button onClick={ws.savePalette}
          className="shrink-0 rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press whitespace-nowrap">
          Save
        </button>

        {/* Share URL */}
        <button onClick={ws.shareUrl}
          className="shrink-0 rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press whitespace-nowrap">
          Share
        </button>

        {/* Export */}
        <button onClick={() => setShowExportModal(true)}
          className="shrink-0 rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press whitespace-nowrap">
          Export
        </button>

        <div className="w-px h-6 bg-[var(--border-default)] shrink-0" />

        {/* Color count */}
        <span className="text-xs font-semibold tabular-nums text-muted shrink-0">{ws.colors.length}</span>

        {/* Inspector toggle */}
        <button onClick={() => { setShowInspector(!showInspector); setShowHistory(false); }}
          className="shrink-0 size-7 flex items-center justify-center rounded-full text-xs font-bold text-secondary hover:text-[var(--accent)] transition bounce-press"
          title="Palette Inspector">📊</button>

        {/* History toggle */}
        <button onClick={() => { setShowHistory(!showHistory); setShowInspector(false); setShowSnapshots(false); }}
          className="shrink-0 size-7 flex items-center justify-center rounded-full text-xs font-bold text-secondary hover:text-[var(--accent)] transition bounce-press"
          title="History">🕐</button>

        {/* Snapshots toggle */}
        <button onClick={() => { setShowSnapshots(!showSnapshots); setShowInspector(false); setShowHistory(false); }}
          className="shrink-0 size-7 flex items-center justify-center rounded-full text-xs font-bold text-secondary hover:text-[var(--accent)] transition bounce-press"
          title="Workspace Snapshots">💾</button>

        {/* Status notice */}
        <span className="text-xs text-muted whitespace-nowrap ml-auto hidden sm:inline">{ws.notice}</span>
      </div>

      {/* Inspector popup */}
      {showInspector && (
        <div className="absolute bottom-full left-0 mb-2 rounded-2xl border border-default bg-[var(--bg-surface)] shadow-xl p-4 max-h-[85vh] overflow-y-auto">
          <PaletteInspector />
        </div>
      )}

      {/* History popup */}
      {showHistory && (
        <div className="absolute bottom-full left-4 mb-2 rounded-2xl border border-default bg-[var(--bg-surface)] shadow-xl p-4 min-w-[220px] max-h-[300px] overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Recently Generated</p>
          {ws.recentlyGenerated.length === 0 ? (
            <p className="text-xs text-muted">No saved palettes yet.</p>
          ) : (
            <div className="space-y-1.5">
              {ws.recentlyGenerated.slice(0, 10).map((r) => (
                <button key={r.id} className="flex items-center gap-2 w-full text-left rounded-lg px-2 py-1 hover:bg-[var(--surface)] transition"
                  onClick={() => ws.loadPalette(r.colors, r.mode, r.name)}>
                  <div className="flex rounded overflow-hidden h-5 flex-1 max-w-[80px]">
                    {r.colors.slice(0, 5).map((h, i) => <span key={i} className="flex-1" style={{ backgroundColor: h }} />)}
                  </div>
                  <span className="text-xs text-page truncate flex-1">{r.name}</span>
                  <span className="text-[10px] text-muted">{r.mode}</span>
                </button>
              ))}
            </div>
          )}
          {ws.recentlyCopied.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-muted mt-3 mb-1">Recently Copied</p>
              <div className="flex flex-wrap gap-1">
                {ws.recentlyCopied.slice(0, 5).map((c, i) => (
                  <span key={i} className="text-[10px] font-mono bg-[var(--surface)] rounded px-1.5 py-0.5 text-secondary truncate max-w-[100px]">{c}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Snapshots popup */}
      {showSnapshots && (
        <div className="absolute bottom-full left-4 mb-2 rounded-2xl border border-default bg-[var(--bg-surface)] shadow-xl p-4 min-w-[240px] max-h-[50vh] overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Workspace Snapshots</p>
          {/* Save new */}
          <div className="flex gap-1 mb-2">
            <input value={snapName} onChange={(e) => setSnapName(e.target.value)}
              className="flex-1 rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs text-page outline-none placeholder:text-muted"
              placeholder="Snapshot name" spellCheck={false}
              onKeyDown={(e) => { if (e.key === "Enter" && snapName.trim()) { ws.saveSnapshot(snapName.trim()); setSnapName(""); } }} />
            <button onClick={() => { if (snapName.trim()) { ws.saveSnapshot(snapName.trim()); setSnapName(""); } }}
              disabled={!snapName.trim()}
              className="rounded-full bg-[var(--accent)] text-white px-3 py-1.5 text-xs font-semibold hover:brightness-110 transition disabled:opacity-40 bounce-press">
              Save
            </button>
          </div>
          {ws.snapshots.length === 0 ? (
            <p className="text-xs text-muted py-2">No snapshots yet.</p>
          ) : ws.snapshots.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[var(--surface)] transition group">
              <div className="flex rounded overflow-hidden h-6 w-10 shrink-0 border border-default">
                {s.colors.slice(0, 4).map((c, i) => <span key={i} className="flex-1" style={{ backgroundColor: c.hex }} />)}
              </div>
              <span className="text-xs text-page flex-1 truncate">{s.name}</span>
              <button onClick={() => ws.restoreSnapshot(s.id)}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[var(--accent)] text-white opacity-0 group-hover:opacity-100 transition"
                title="Restore">↩</button>
              <button onClick={() => { const n = prompt("Rename:", s.name); if (n?.trim()) ws.renameSnapshot(s.id, n.trim()); }}
                className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition"
                title="Rename">✏️</button>
              <button onClick={() => { if (confirm(`Delete "${s.name}"?`)) ws.deleteSnapshot(s.id); }}
                className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition"
                title="Delete">✕</button>
            </div>
          ))}
        </div>
      )}

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
    </div>
  );
});
