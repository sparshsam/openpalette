"use client";

const SHORTCUTS = [
  { keys: "Space", desc: "Generate palette" },
  { keys: "Ctrl+Z", desc: "Undo" },
  { keys: "Ctrl+Shift+Z", desc: "Redo" },
  { keys: "C", desc: "Copy palette" },
  { keys: "/", desc: "Open command palette" },
  { keys: "?", desc: "Show shortcuts" },
  { keys: "Esc", desc: "Close modal / command palette" },
  { keys: "↑↓", desc: "Navigate command palette" },
  { keys: "Enter", desc: "Select in command palette" },
];

export function KeyboardShortcuts({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-md rounded-2xl border border-default bg-[var(--bg-surface)] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold uppercase tracking-wider text-page">Keyboard Shortcuts</p>
          <button onClick={onClose} className="text-sm text-secondary hover:text-[var(--accent)]">✕</button>
        </div>
        <div className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1">
              <span className="text-xs text-secondary">{s.desc}</span>
              <kbd className="rounded-lg border border-default bg-[var(--surface)] px-2 py-0.5 text-[10px] font-mono font-semibold text-page">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-4">Shortcuts only apply when no input field is focused.</p>
      </div>
    </div>
  );
}
