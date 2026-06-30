"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { getColorInfo } from "@/lib/palette/color-info";

const TABS = [
  { id: "studio", label: "Studio" },
  { id: "explore", label: "Explore" },
  { id: "image-picker", label: "Extract" },
  { id: "contrast", label: "Contrast" },
  { id: "visualizer", label: "Visualizer" },
  { id: "colors", label: "Colors" },
  { id: "tokens", label: "Tokens" },
  { id: "gradient", label: "Gradient" },
  { id: "accessibility", label: "Accessibility" },
];

const COMMON_COLORS = [
  "#FF0000","#FF4500","#FFA500","#FFD700","#FFFF00","#00FF00","#00CED1","#0000FF","#4B0082","#FF00FF",
  "#FF69B4","#FFC0CB","#FFFFFF","#808080","#000000","#C0C0C0","#800000","#008000","#000080","#800080",
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const ws = useWorkspace();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { tabs: TABS, palettes: ws.recentlyGenerated.slice(0, 5), colors: COMMON_COLORS };

    const tabs = TABS.filter((t) => t.label.toLowerCase().includes(q));
    const palettes = ws.recentlyGenerated.filter((r) =>
      r.name.toLowerCase().includes(q) || r.colors.some((c) => c.includes(q))
    ).slice(0, 5);
    const colors = COMMON_COLORS.filter((c) => {
      const info = getColorInfo(c);
      return c.includes(q) || info.name.toLowerCase().includes(q);
    });
    return { tabs, palettes, colors };
  }, [query, ws.recentlyGenerated]);

  const allItems = useMemo(() => {
    const QUICK_ACTIONS = [
      { id: "gen-harmony", label: "Generate Harmony", sublabel: "Regenerate with harmony mode", action: () => { ws.generate(); onClose(); } },
      { id: "improve-palette", label: "Improve Palette", sublabel: "Open palette diagnostics", action: () => { onClose(); } },
      { id: "export-tokens", label: "Export Tokens", sublabel: "Open Design Tokens", action: () => { window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "tokens" } })); onClose(); } },
      { id: "open-visualizer", label: "Open Visualizer", sublabel: "Preview palette on templates", action: () => { window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "visualizer" } })); onClose(); } },
      { id: "open-accessibility", label: "Open Accessibility", sublabel: "Accessibility analysis", action: () => { window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "accessibility" } })); onClose(); } },
      { id: "open-gradient", label: "Open Gradient", sublabel: "Gradient studio", action: () => { window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "gradient" } })); onClose(); } },
      { id: "copy-share", label: "Copy Share URL", sublabel: "Share this palette", action: () => { ws.shareUrl(); onClose(); } },
      { id: "save-palette", label: "Save Palette", sublabel: "Save to history", action: () => { ws.savePalette(); onClose(); } },
    ];
    const items: { type: "tab" | "palette" | "color" | "action"; id: string; label: string; sublabel?: string; action: () => void }[] = [];

    // Quick actions: show matching or all when empty
    const q = query.toLowerCase().trim();
    const matchingActions = !q ? QUICK_ACTIONS : QUICK_ACTIONS.filter((a) =>
      a.label.toLowerCase().includes(q) || a.sublabel.toLowerCase().includes(q)
    );
    matchingActions.forEach((a) => items.push({
      type: "action", id: a.id, label: a.label, sublabel: a.sublabel, action: a.action,
    }));

    results.tabs.forEach((t) => items.push({
      type: "tab", id: `tab-${t.id}`, label: t.label, sublabel: "Page",
      action: () => { window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: t.id } })); onClose(); },
    }));
    results.palettes.forEach((p) => items.push({
      type: "palette", id: `pal-${p.id}`, label: p.name, sublabel: `${p.colors.length} colors · ${p.mode}`,
      action: () => { ws.loadPalette(p.colors, p.mode, p.name); onClose(); },
    }));
    results.colors.forEach((c) => {
      const info = getColorInfo(c);
      items.push({
        type: "color", id: `color-${c}`, label: info.name, sublabel: c,
        action: () => { navigator.clipboard.writeText(c).catch(() => {}); onClose(); ws.communicate(`Copied ${c}`); },
      });
    });
    return items;
  }, [results, ws, onClose, query]);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allItems[activeIdx]) { allItems[activeIdx].action(); }
    if (e.key === "Escape") { onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-lg rounded-2xl border border-default bg-[var(--bg-surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
          className="w-full bg-transparent px-5 py-4 text-sm text-page outline-none placeholder:text-muted border-b border-default"
          placeholder="Search pages, palettes, or colors…" spellCheck={false} />

        <div className="max-h-[50vh] overflow-y-auto p-2 space-y-0.5">
          {allItems.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">No results for &ldquo;{query}&rdquo;</p>
          ) : allItems.map((item, i) => (
            <button key={item.id}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${i === activeIdx ? "bg-[var(--accent)]/10" : "hover:bg-[var(--surface)]"}`}
              onClick={item.action} onMouseEnter={() => setActiveIdx(i)}>
              {item.type === "action" && <span className="text-xs w-6 text-center">⚡</span>}
              {item.type === "tab" && <span className="text-xs font-bold text-muted uppercase w-6">📄</span>}
              {item.type === "palette" && (
                <div className="flex rounded overflow-hidden h-5 w-6 shrink-0">
                  {item.label.split(" ").slice(0, 3).map((_, j) => <span key={j} className="flex-1" style={{ backgroundColor: results.palettes.find((p) => p.name === item.label)?.colors[j] }} />)}
                </div>
              )}
              {item.type === "color" && <span className="size-5 rounded shrink-0 border border-default" style={{ backgroundColor: item.sublabel }} />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-page truncate">{item.label}</p>
                <p className="text-[10px] text-muted truncate">{item.sublabel}</p>
              </div>
              {item.type === "tab" && <span className="text-[10px] text-muted">↗</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-default text-[10px] text-muted">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
