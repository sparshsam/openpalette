"use client";

import { useMemo, useRef, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { generateTokens, getTokenGroups, EXPORT_PRESETS, type NamingPreset } from "@/lib/palette/token-engine";
import { formatExport, ADVANCED_EXPORT_FORMATS, ADVANCED_EXPORT_CATEGORIES, parseImportJson } from "@/lib/palette/advanced-export";
import { DesignSystemPreview } from "./design-system-preview";
import { showToast } from "./toast";

export function ExportModal({ onClose }: { onClose: () => void }) {
  const ws = useWorkspace();
  const [tab, setTab] = useState<"export" | "preview" | "import">("export");
  const [preset, setPreset] = useState<NamingPreset>("openpalette");
  const [prefix, setPrefix] = useState("op");
  const [selectedFormat, setSelectedFormat] = useState("css");
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["brand", "semantic", "surface", "text"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("op-export-favs") ?? "[]"); } catch { return []; }
  });
  const [recentFormats, setRecentFormats] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("op-export-recent") ?? "[]"); } catch { return []; }
  });
  const previewRef = useRef<HTMLPreElement>(null);

  const tokens = useMemo(() => generateTokens(ws.paletteHex, preset, prefix, true), [ws.paletteHex, preset, prefix]);
  const groups = getTokenGroups();
  const name = `Palette-${ws.paletteHex[0]?.replace("#", "") ?? "default"}`;

  const filteredFormats = useMemo(() => {
    return ADVANCED_EXPORT_FORMATS.filter((f) => {
      if (searchQuery && !f.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (categoryFilter !== "All" && f.category !== categoryFilter) return false;
      return true;
    });
  }, [searchQuery, categoryFilter]);

  const activeExport = useMemo(() => formatExport(selectedFormat, tokens, preset, prefix, name), [selectedFormat, tokens, preset, prefix, name]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("op-export-favs", JSON.stringify(next));
      return next;
    });
  };

  const selectFormat = (id: string) => {
    setSelectedFormat(id);
    setRecentFormats((prev) => {
      const next = [id, ...prev.filter((f) => f !== id)].slice(0, 5);
      localStorage.setItem("op-export-recent", JSON.stringify(next));
      return next;
    });
  };

  const copyContent = async () => {
    try { await navigator.clipboard.writeText(activeExport.content); showToast("Copied to clipboard"); } catch {}
  };

  const downloadContent = () => {
    const blob = new Blob([activeExport.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${name}.${activeExport.ext}`; a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded");
  };

  const handleImport = (json: string) => {
    const { tokens: imported, name: importedName } = parseImportJson(json);
    if (imported) {
      showToast(`Imported: ${importedName}`);
      // Load import results into workspace
      const hexes = Object.values(imported).filter((v) => /^#[0-9A-Fa-f]{6}$/.test(v));
      if (hexes.length >= 2) ws.loadPalette(hexes, ws.mode, importedName);
    } else {
      showToast("Invalid token file");
    }
  };

  const [importText, setImportText] = useState("");

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[5vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-default bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-default">
          <div className="flex gap-3">
            {(["export", "preview", "import"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                  tab === t ? "bg-[var(--accent)] text-white" : "text-secondary hover:text-[var(--accent)]"
                }`}>{t}</button>
            ))}
          </div>
          <button onClick={onClose} className="text-sm text-secondary hover:text-[var(--accent)]">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "export" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: controls */}
              <div className="space-y-4 lg:col-span-1">
                {/* Naming preset */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Naming Preset</p>
                  <div className="flex flex-wrap gap-1">
                    {(["tailwind","material","bootstrap","fluent","apple","openpalette","custom"] as NamingPreset[]).map((p) => (
                      <button key={p} onClick={() => setPreset(p)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize transition ${
                          preset === p ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)]"
                        }`}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Prefix */}
                {preset === "custom" && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">Prefix</p>
                    <input value={prefix} onChange={(e) => setPrefix(e.target.value)}
                      className="w-full rounded-full bg-[var(--surface)] px-4 py-2 text-sm text-page outline-none border border-default" />
                  </div>
                )}

                {/* Export preset */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Export Preset</p>
                  <div className="flex flex-wrap gap-1">
                    {EXPORT_PRESETS.map((ep) => (
                      <button key={ep.id} onClick={() => { setSelectedGroups(ep.tokenGroups); if (ep.formats.length > 0) setSelectedFormat(ep.formats[0]); }}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                          ep.tokenGroups.every((g) => selectedGroups.includes(g)) ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)]"
                        }`}>{ep.label}</button>
                    ))}
                  </div>
                </div>

                {/* Token groups */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Token Groups</p>
                  {groups.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedGroups.includes(g.id)}
                        onChange={() => setSelectedGroups((prev) => prev.includes(g.id) ? prev.filter((x) => x !== g.id) : [...prev, g.id])}
                        className="rounded accent-[var(--accent)]" />
                      <span className="text-xs text-page">{g.label}</span>
                      <span className="text-[10px] text-muted ml-auto">{g.tokens.length} tokens</span>
                    </label>
                  ))}
                </div>

                {/* Category filter */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Format Category</p>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setCategoryFilter("All")}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${categoryFilter === "All" ? "bg-[var(--accent)] text-white" : "border border-default text-secondary"}`}>All</button>
                    {ADVANCED_EXPORT_CATEGORIES.map((c) => (
                      <button key={c} onClick={() => setCategoryFilter(c)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${categoryFilter === c ? "bg-[var(--accent)] text-white" : "border border-default text-secondary"}`}>{c}</button>
                    ))}
                  </div>
                </div>

                {/* Format search */}
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full bg-[var(--surface)] px-4 py-2 text-sm text-page outline-none border border-default"
                  placeholder="Search formats…" />

                {/* Format list */}
                <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                  {recentFormats.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted mt-2 mb-1">Recently Used</p>
                      {recentFormats.map((id) => {
                        const fmt = ADVANCED_EXPORT_FORMATS.find((f) => f.id === id);
                        if (!fmt) return null;
                        return <FormatRow key={fmt.id} fmt={fmt} selected={selectedFormat === fmt.id} onSelect={() => selectFormat(fmt.id)} fav={favorites.includes(fmt.id)} onFav={() => toggleFavorite(fmt.id)} />;
                      })}
                    </>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mt-2 mb-1">All Formats</p>
                  {filteredFormats.map((fmt) => (
                    <FormatRow key={fmt.id} fmt={fmt} selected={selectedFormat === fmt.id} onSelect={() => selectFormat(fmt.id)} fav={favorites.includes(fmt.id)} onFav={() => toggleFavorite(fmt.id)} />
                  ))}
                  {filteredFormats.length === 0 && <p className="text-xs text-muted py-2">No formats match.</p>}
                </div>
              </div>

              {/* Right: preview */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{activeExport.label}</p>
                  <div className="flex gap-2">
                    <button onClick={copyContent} className="rounded-full bg-[var(--accent)] text-white px-3 py-1.5 text-xs font-semibold hover:brightness-110 transition bounce-press">Copy</button>
                    <button onClick={downloadContent} className="rounded-full border border-default px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press">Download</button>
                  </div>
                </div>
                <pre ref={previewRef}
                  className="rounded-2xl border border-default bg-[var(--bg-base)] p-4 text-xs font-mono leading-relaxed overflow-auto max-h-[50vh] text-page"
                  style={{ tabSize: 2 }}>{activeExport.content}</pre>
              </div>
            </div>
          )}

          {tab === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Design System Preview</p>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>Colors are derived from your active palette</span>
                </div>
              </div>
              <DesignSystemPreview tokens={tokens} light={true} />
            </div>
          )}

          {tab === "import" && (
            <div className="max-w-xl mx-auto space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Import Design Tokens</p>
              <p className="text-xs text-secondary">Paste previously exported Design Token JSON to load it into your workspace.</p>
              <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
                className="w-full h-48 rounded-2xl border border-default bg-[var(--bg-base)] p-4 text-xs font-mono text-page outline-none resize-none"
                placeholder='{\n  "colors": {\n    "primary": "#FF0000",\n    ...\n  }\n}' />
              <button onClick={() => handleImport(importText)} disabled={!importText.trim()}
                className="rounded-full bg-[var(--accent)] text-white px-5 py-2 text-xs font-semibold hover:brightness-110 transition disabled:opacity-40 bounce-press">
                Import Tokens
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormatRow({ fmt, selected, onSelect, fav, onFav }: {
  fmt: typeof ADVANCED_EXPORT_FORMATS[0];
  selected: boolean;
  onSelect: () => void;
  fav: boolean;
  onFav: () => void;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 cursor-pointer transition ${selected ? "bg-[var(--accent)]/10" : "hover:bg-[var(--surface)]"}`}
      onClick={onSelect}>
      <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="text-[10px] text-muted hover:text-amber-500 shrink-0">{fav ? "★" : "☆"}</button>
      <span className="text-xs text-page flex-1">{fmt.label}</span>
      <span className="text-[10px] text-muted">{fmt.category}</span>
    </div>
  );
}
