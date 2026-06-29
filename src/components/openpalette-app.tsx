"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createSimplePdf, drawSwatches, extensionFor } from "@/lib/browser-exports";
import {
  createExportSnippets,
  createPalette,
  exportFormats,
  
  
  getPaletteAccessibilityScore,
  getReadableTextColor,
  normalizeHex,
  paletteModes,
  paletteSignature,
  sortPalettes,
  
  type ExportFormat,
  type LibrarySort,
  type PaletteColor,
  type PaletteMode,
  type PaletteRecord,
} from "@/lib/palette";
import { usePalette } from "@/components/use-palette";
import { StudioSection } from "@/components/studio/studio-section";
import { ExploreSection } from "@/components/explore/explore-section";
import { ImagePickerSection } from "@/components/image-picker/image-picker-section";
import { ContrastSection } from "@/components/contrast/contrast-section";
import { VisualizerSection } from "@/components/visualizer/visualizer-section";
import { ColorsSection } from "@/components/colors/colors-section";
import { TokensSection } from "@/components/tokens/tokens-section";
import { GradientSection } from "@/components/gradient/gradient-section";
import { AccessibilitySection } from "@/components/a11y/a11y-section";
import { ErrorBoundary } from "@/components/error-boundary";

const libraryStorageKey = "openpalette.library.v1";
const historyStorageKey = "openpalette.history.v1";
const sorts: { label: string; value: LibrarySort }[] = [
  { label: "Recently used", value: "recent" }, { label: "Brightness", value: "brightness" },
  { label: "Contrast", value: "contrast" }, { label: "Warm/cool", value: "temperature" }, { label: "Favorites", value: "favorites" },
];

type Tab = "studio" | "explore" | "image-picker" | "contrast" | "visualizer" | "colors" | "tokens" | "gradient" | "accessibility" | "themes" | "library";
const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" }, { id: "explore", label: "Explore" }, { id: "image-picker", label: "Extract" },
  { id: "contrast", label: "Contrast" }, { id: "visualizer", label: "Visualizer" }, { id: "colors", label: "Colors" },
  { id: "tokens", label: "Tokens" },
  { id: "gradient", label: "Gradient" }, { id: "accessibility", label: "Accessibility" },
  { id: "themes", label: "Themes" }, { id: "library", label: "Library" },
];

/* ═══════════════════════════════════════════════════════════
   SHELL
   ═══════════════════════════════════════════════════════════ */

export function OpenPaletteApp() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "studio";
    const hash = window.location.hash.replace("#", "");
    // Check for color detail route /colors/HEX
    if (/^\/colors\/[0-9A-Fa-f]{6}$/.test(hash)) return "colors";
    if (/^\/tokens\/[0-9A-Fa-f]{6}$/.test(hash)) return "tokens";
    // Check for contrast route /contrast/hex1-hex2
    if (/^\/contrast\//.test(hash)) return "contrast";
    // Standard tab match
    return tabs.some((t) => t.id === hash) ? (hash as Tab) : "studio";
  });
  const [loadPalette, setLoadPalette] = useState<{ colors: string[]; mode: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => {
    const hash = activeTab === "studio" ? "" : activeTab;
    window.history.replaceState(null, "", hash ? `/#${hash}` : "/");
  }, [activeTab]);

  // Listen for tool + palette navigation events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab && tabs.some((t) => t.id === detail.tab)) {
        setActiveTab(detail.tab as Tab);
      }
    };
    const paletteHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.colors) {
        setLoadPalette({ colors: detail.colors, mode: detail.mode ?? "Random" });
        setActiveTab("studio");
      }
    };
    window.addEventListener("op-navigate", handler);
    window.addEventListener("op-load-palette", paletteHandler);
    return () => {
      window.removeEventListener("op-navigate", handler);
      window.removeEventListener("op-load-palette", paletteHandler);
    };
  }, []);

  return <div>
    <nav className="flex justify-center py-3 px-2" aria-label="Tabs">
      <div className="flex gap-0.5 p-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm overflow-x-auto scroll-smooth no-scrollbar w-[26rem] sm:w-[28rem]"
        onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {tabs.map((t) => (
          <button key={t.id} className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
            mounted && activeTab === t.id
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--accent)]"
          }`} type="button" onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>
    </nav>
    {/* Conditional rendering — suppresses hydration mismatch at each wrapper */}
    {mounted && activeTab === "studio" && <div suppressHydrationWarning><ErrorBoundary name="Studio"><StudioSection initialPalette={loadPalette} onConsumed={() => setLoadPalette(null)} /></ErrorBoundary></div>}
    {mounted && activeTab === "explore" && <div suppressHydrationWarning><ErrorBoundary name="Explore"><ExploreSection /></ErrorBoundary></div>}
    {mounted && activeTab === "image-picker" && <div suppressHydrationWarning><ErrorBoundary name="ImagePicker"><ImagePickerSection /></ErrorBoundary></div>}
    {mounted && activeTab === "contrast" && <div suppressHydrationWarning><ErrorBoundary name="Contrast"><ContrastSection /></ErrorBoundary></div>}
    {mounted && activeTab === "visualizer" && <div suppressHydrationWarning><ErrorBoundary name="Visualizer"><VisualizerSection /></ErrorBoundary></div>}
    {mounted && activeTab === "colors" && <div suppressHydrationWarning><ErrorBoundary name="Colors"><ColorsSection /></ErrorBoundary></div>}
    {mounted && activeTab === "tokens" && <div suppressHydrationWarning><ErrorBoundary name="Tokens"><TokensSection /></ErrorBoundary></div>}
    {mounted && activeTab === "gradient" && <div suppressHydrationWarning><ErrorBoundary name="Gradient"><GradientSection /></ErrorBoundary></div>}
    {activeTab === "accessibility" && <div suppressHydrationWarning><ErrorBoundary name="Accessibility"><AccessibilitySection /></ErrorBoundary></div>}
    {activeTab === "themes" && <div suppressHydrationWarning><ErrorBoundary name="Themes"><ThemesSection /></ErrorBoundary></div>}
    {activeTab === "library" && <div suppressHydrationWarning><ErrorBoundary name="Library"><LibrarySection /></ErrorBoundary></div>}
    {!mounted && <div suppressHydrationWarning />}
  </div>;
}

/* ═══════════════════════════════════════════════════════════
   THEMES — theme browser with editor
   ═══════════════════════════════════════════════════════════ */

function ThemesSection() {
  const palette = usePalette();

  useEffect(() => { const fn = (e: KeyboardEvent) => { if (!["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName) && e.code === "Space") { e.preventDefault(); palette.generate(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  const sets = [
    { name:"Rose Garden", desc:"Warm pink-rose light.", th:"light", colors:[{hex:"#fff5fc"},{hex:"#fae8f3"},{hex:"#ff66c4"},{hex:"#3a0d2b"},{hex:"#8a6a7e"}] },
    { name:"Noir Pink", desc:"Dark moody pink.", th:"dark", colors:[{hex:"#12000d"},{hex:"#1f0a18"},{hex:"#ff66c4"},{hex:"#ffe0f5"},{hex:"#8a6a7e"}] },
    { name:"Ocean Depth", desc:"Cool blue light.", th:"light", colors:[{hex:"#f0faff"},{hex:"#dff4fe"},{hex:"#0088cc"},{hex:"#002b3d"},{hex:"#607d8b"}] },
    { name:"Deep Ocean", desc:"Dark marine.", th:"dark", colors:[{hex:"#00101a"},{hex:"#001e30"},{hex:"#0099ff"},{hex:"#e0f0ff"},{hex:"#5a7d8a"}] },
    { name:"Amber Glow", desc:"Warm amber light.", th:"light", colors:[{hex:"#fffbf0"},{hex:"#fff3d6"},{hex:"#ff8c00"},{hex:"#1a1200"},{hex:"#8a7a5a"}] },
    { name:"Cyberpunk", desc:"Neon dark purple.", th:"dark", colors:[{hex:"#0a0014"},{hex:"#160028"},{hex:"#8844ff"},{hex:"#f0e0ff"},{hex:"#7a6a8a"}] },
    { name:"Forest Calm", desc:"Earthy green light.", th:"light", colors:[{hex:"#f5fff2"},{hex:"#e8f5e0"},{hex:"#2e7d32"},{hex:"#002400"},{hex:"#5a7a5a"}] },
    { name:"Monochrome", desc:"Clean grayscale.", th:"light", colors:[{hex:"#ffffff"},{hex:"#f5f5f5"},{hex:"#555555"},{hex:"#111111"},{hex:"#8a8a8a"}] },
    { name:"Graphite", desc:"Dark gray.", th:"dark", colors:[{hex:"#0d0d0d"},{hex:"#1a1a1a"},{hex:"#aaaaaa"},{hex:"#ffffff"},{hex:"#8a8a8a"}] },
  ];

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-page">Themes</h2>
        <p className="text-sm text-secondary">Click to load, then edit your palette below.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-full surface backdrop-blur px-4 py-1.5 text-sm font-semibold text-page hover-bg-muted transition" onClick={palette.generate}>Generate (Space)</button>
        <span className="text-xs text-muted">{palette.notice}</span>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {sets.map((s) => <button key={s.name} type="button" onClick={() => { const nc = s.colors.map((c) => ({ id: crypto.randomUUID(), hex: c.hex, alpha: 100, locked: false })); palette.setPalette(nc, "Custom" as PaletteMode, `${s.name} loaded`); }}
        className="rounded-2xl border border-default p-4 text-left hover-bg-muted transition">
        <div className="flex gap-1.5 mb-2">{s.colors.map((c) => <span key={c.hex} className="h-8 flex-1 rounded-lg" style={{ backgroundColor: c.hex }} />)}</div>
        <p className="font-semibold text-sm text-page">{s.name}</p>
        <p className="text-xs text-muted">{s.desc} <span className="uppercase tracking-wider">{s.th}</span></p>
      </button>)}
    </div>

    {/* Palette strip for editing loaded theme */}
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8 pt-4">
      {palette.paletteHex.map((hex, i) => <button key={i} className="flex-1 h-16 hover:h-20 transition-all duration-200 relative group" style={{ backgroundColor: hex }} onClick={() => { const el = document.createElement("input"); el.type="color"; el.value=hex; el.oninput=()=>palette.updateHex(palette.colors[i].id, el.value); el.click(); }}>
        <span className="absolute bottom-1 left-2 text-[10px] font-mono font-semibold opacity-0 group-hover:opacity-100 transition" style={{ color: getReadableTextColor(hex) }}>{hex}</span>
      </button>)}
    </div>

    {/* Quick controls */}
    <div className="flex flex-wrap gap-2">
      {paletteModes.slice(0, 5).map((m) => <button key={m} className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${
        palette.mode === m ? "bg-white text-[#1a001a]" : "surface text-secondary hover-bg-muted hover:text-page"
      }`} onClick={() => palette.switchMode(m)}>{m}</button>)}
    </div>
  </section>;
}

/* ═══════════════════════════════════════════════════════════
   LIBRARY — compact strip + export + browser + collections
   ═══════════════════════════════════════════════════════════ */

const COLLECTIONS_KEY = "openpalette.collections.v1";
const PROJECTS_KEY = "openpalette.projects.v1";

interface Collection {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  collectionId: string;
}

function LibrarySection() {
  const palette = usePalette();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState<LibrarySort>("recent");
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("CSS");
  const [activeCollection, setActiveCollection] = useState<string>("Default");
  const [showCollections, setShowCollections] = useState(false);
  const exportSnippets = useMemo(() => createExportSnippets(palette.paletteHex, palette.paletteAlphas), [palette.paletteHex, palette.paletteAlphas]);
  const score = useMemo(() => getPaletteAccessibilityScore(palette.paletteHex), [palette.paletteHex]);
  const dq = useDeferredValue(query);
  const dt = useDeferredValue(tagFilter);

  const [library, setLibrary] = useState<PaletteRecord[]>(() => { try { const s = localStorage.getItem(libraryStorageKey); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; } } catch {} return []; });
  const [history, setHistory] = useState<PaletteRecord[]>(() => { try { const s = localStorage.getItem(historyStorageKey); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; } } catch {} return []; });
  const [collections, setCollections] = useState<Collection[]>(() => { try { const s = localStorage.getItem(COLLECTIONS_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; } } catch {} return []; });
  const [projects] = useState<Project[]>(() => { try { const s = localStorage.getItem(PROJECTS_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) return p; } } catch {} return []; });

  useEffect(() => { localStorage.setItem(libraryStorageKey, JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem(historyStorageKey, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections)); }, [collections]);
  useEffect(() => { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); }, [projects]);

  const filtered = useMemo(() => {
    const nq = dq.trim().toLowerCase(), nt = dt.trim().toLowerCase();
    return sortPalettes(library, sort).filter((r) => {
      const h = [r.name, r.collection, r.mode, ...r.colors, ...r.tags].join(" ").toLowerCase();
      return (!nq || h.includes(nq)) && (!nt || r.tags.some((t) => t.toLowerCase().includes(nt)));
    });
  }, [dq, dt, library, sort]);

  useEffect(() => { const fn = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return; if (e.code === "Space") { e.preventDefault(); palette.generate(); } if (e.key.toLowerCase() === "s") { e.preventDefault(); save(); } }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); });

  function save() { const r = createRecord(palette.colors, palette.mode, `Palette ${library.length + 1}`, true, activeCollection); setLibrary((c) => [r, ...c.filter((i) => paletteSignature(i.colors) !== paletteSignature(r.colors))]); setHistory((h) => [r, ...h].slice(0, 40)); palette.announce("Saved"); }
  function load(r: PaletteRecord) { const c = createPalette(r.colors, r.colors.length).map((x, i) => ({ ...x, alpha: r.alphas[i] ?? 100 })); palette.setPalette(c, r.mode, `${r.name} loaded`); setLibrary((l) => l.map((x) => x.id === r.id ? { ...x, usedAt: new Date().toISOString() } : x)); }
  function upd(id: string, u: Partial<PaletteRecord>) { setLibrary((l) => l.map((r) => r.id === id ? { ...r, ...u, updatedAt: new Date().toISOString() } : r)); }

  function addCollection() {
    const name = prompt("Collection name:");
    if (!name?.trim()) return;
    setCollections((c) => [...c, { id: crypto.randomUUID(), name: name.trim() }]);
  }

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black tracking-tight text-page">Library</h2>
        <p className="text-xs text-muted mt-0.5">Collection: {activeCollection}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-full surface backdrop-blur px-4 py-1.5 text-sm font-semibold text-page hover-bg-muted transition" onClick={palette.generate}>Generate (Space)</button>
        <button className="rounded-full surface px-4 py-1.5 text-sm font-semibold text-page hover-bg-muted transition" onClick={save}>Save (S)</button>
        <button className="rounded-full surface px-3 py-1.5 text-sm font-semibold text-page hover-bg-muted transition disabled:opacity-30" disabled={palette.undoStack.length === 0} onClick={palette.undo}>Undo</button>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1a001a]">{score}/100</span>
        <span className="text-xs text-muted">{palette.notice}</span>
      </div>
    </div>

    {/* Compact palette strip */}
    <div className="flex -mx-4 sm:-mx-6 lg:-mx-8">
      {palette.paletteHex.map((hex, i) => <button key={i} className="flex-1 h-14 hover:h-18 transition-all duration-200" style={{ backgroundColor: hex }} onClick={() => { const el = document.createElement("input"); el.type="color"; el.value=hex; el.oninput=()=>palette.updateHex(palette.colors[i].id, el.value); el.click(); }} />)}
    </div>

    {/* Collections bar */}
    <div className="flex flex-wrap items-center gap-2">
      <button className="rounded-full surface px-3 py-1.5 text-xs font-semibold text-page hover-bg-muted transition" onClick={() => setShowCollections(!showCollections)}>
        {showCollections ? "Hide" : "Collections"} ({collections.length})
      </button>
      <button className="rounded-full surface px-3 py-1.5 text-xs font-semibold text-page hover-bg-muted transition" onClick={addCollection}>+ New</button>
      {collections.map((c) => (
        <button
          key={c.id}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            activeCollection === c.name ? "bg-white text-[#1a001a]" : "surface text-secondary hover-bg-muted"
          }`}
          onClick={() => setActiveCollection(c.name)}
        >
          {c.name}
        </button>
      ))}
    </div>

    {/* Exports */}
    <section>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {exportFormats.map((f) => <button key={f} className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase transition ${activeFormat === f ? "bg-white text-[#1a001a]" : "surface text-secondary hover-bg-muted hover:text-page"}`} onClick={() => setActiveFormat(f)}>{f}</button>)}
      </div>
      <pre className="max-h-32 overflow-auto rounded-2xl surface-muted p-4 text-xs text-secondary leading-relaxed"><code className="font-mono">{exportSnippets[activeFormat]}</code></pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-full surface px-3 py-1.5 text-xs font-semibold text-page hover-bg-muted transition" onClick={async () => { try { await navigator.clipboard.writeText(exportSnippets[activeFormat]); palette.announce("Copied"); } catch {} }}>Copy</button>
        <button className="rounded-full surface px-3 py-1.5 text-xs font-semibold text-page hover-bg-muted transition" onClick={() => { const u = URL.createObjectURL(new Blob([exportSnippets[activeFormat]], { type: "text/plain" })); const a = document.createElement("a"); a.href = u; a.download = `palette.${extensionFor(activeFormat)}`; a.click(); URL.revokeObjectURL(u); palette.announce("Downloaded"); }}>Download</button>
        <button className="rounded-full surface px-3 py-1.5 text-xs font-semibold text-page hover-bg-muted transition" onClick={() => { const can = document.createElement("canvas"); can.width=1400; can.height=840; const ctx=can.getContext("2d"); if(!ctx)return; drawSwatches(ctx, can.width, can.height, palette.paletteHex); can.toBlob((b)=>{if(!b)return;const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="swatches.png";a.click();URL.revokeObjectURL(u);palette.announce("PNG downloaded");}); }}>PNG</button>
        <button className="rounded-full surface px-3 py-1.5 text-xs font-semibold text-page hover-bg-muted transition" onClick={() => { const u = URL.createObjectURL(new Blob([createSimplePdf(palette.paletteHex)], { type: "application/pdf" })); const a = document.createElement("a"); a.href = u; a.download = "palette.pdf"; a.click(); URL.revokeObjectURL(u); palette.announce("PDF downloaded"); }}>PDF</button>
      </div>
    </section>

    {/* Library */}
    <section>
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="rounded-full surface px-4 py-2 text-sm text-page outline-none placeholder:text-muted flex-1 min-w-28" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="rounded-full surface px-4 py-2 text-sm text-page outline-none placeholder:text-muted flex-1 min-w-20" placeholder="Tags" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
        <select className="rounded-full surface px-4 py-2 text-sm text-page outline-none flex-1 min-w-20" value={sort} onChange={(e) => setSort(e.target.value as LibrarySort)}>{sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      </div>
      {filtered.length === 0 ? <p className="text-sm text-muted">No matches. Generate and save.</p>
        : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 24).map((r) => (
              <div key={r.id} className="rounded-2xl border border-default p-3 space-y-2">
                <input className="w-full bg-transparent font-semibold outline-none text-sm text-page" value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} />
                <button className="grid w-full overflow-hidden rounded-xl" style={{ gridTemplateColumns: `repeat(${r.colors.length}, 1fr)` }} onClick={() => load(r)}>{r.colors.map((h, i) => <span key={`${r.id}-${i}`} className="h-8" style={{ backgroundColor: h }} />)}</button>
                <input className="w-full bg-transparent text-xs text-muted outline-none" placeholder="tags" value={r.tags.join(", ")} onChange={(e) => upd(r.id, { tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                <div className="flex gap-2">
                  <button className="rounded-full surface px-3 py-1 text-xs font-semibold text-page hover-bg-muted transition flex-1" onClick={() => upd(r.id, { favorite: !r.favorite })}>{r.favorite ? "★" : "☆"}</button>
                  <button className="rounded-full surface-muted px-3 py-1 text-xs font-semibold text-secondary hover-bg-muted transition flex-1" onClick={() => setLibrary((c) => c.filter((x) => x.id !== r.id))}>Delete</button>
                </div>
                <p className="text-[10px] text-muted">{r.collection}</p>
              </div>
            ))}
          </div>}
    </section>

    {history.length > 0 && <section className="border-t border-default pt-4">
      <h3 className="text-xs font-bold tracking-wider uppercase text-secondary mb-2">Recent</h3>
      <div className="grid gap-2 sm:grid-cols-5">
        {history.slice(0, 10).map((r) => (
          <button key={r.id} className="flex items-center gap-2 text-xs" onClick={() => load(r)}>
            <span className="flex-1 grid grid-flow-col overflow-hidden rounded-md">{r.colors.map((h, i) => <span key={`${r.id}-h-${i}`} className="h-5" style={{ backgroundColor: h }} />)}</span>
            <span className="text-muted">{r.mode}</span>
          </button>
        ))}
      </div>
    </section>}
  </section>;
}

function createRecord(colors: PaletteColor[], mode: PaletteMode, name: string, favorite: boolean, collection: string): PaletteRecord {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name, colors: colors.map((c) => normalizeHex(c.hex) ?? "#111827"), alphas: colors.map((c) => c.alpha), mode, tags: [], collection, favorite, createdAt: now, updatedAt: now, usedAt: now };
}
