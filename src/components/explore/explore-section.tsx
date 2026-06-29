"use client";

import { useMemo, useState } from "react";
import {
  getReadableTextColor,
  hexToHsl,
  createPalette,
} from "@/lib/palette";
import { explorePalettes, type ExplorePalette } from "@/lib/palette/explore-data";
import { PaletteDetailModal } from "./palette-detail-modal";

const colorFilters = ["blue","green","pink","orange","red","purple","yellow","teal","neutral"];
const styleFilters = ["minimal","pastel","dark","vintage","neon","earthy","muted","bright"];
const topicFilters = ["branding","nature","gaming","food","fashion","ui","travel","interior"];
const ORDER_OPTIONS = ["trending", "latest", "popular"] as const;
type Order = (typeof ORDER_OPTIONS)[number];

function matchColorTag(hex: string, filter: string): boolean {
  const h = hexToHsl(hex).h;
  switch (filter) {
    case "red": return h < 20 || h > 340;
    case "orange": return h >= 20 && h < 50;
    case "yellow": return h >= 50 && h < 70;
    case "green": return h >= 70 && h < 170;
    case "teal": return h >= 170 && h < 200;
    case "blue": return h >= 200 && h < 260;
    case "purple": return h >= 260 && h < 320;
    case "pink": return h >= 320 && h < 350;
    default: return true;
  }
}

export function ExploreSection() {
  const [search, setSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [order, setOrder] = useState<Order>("trending");
  const [visible, setVisible] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [detailPalette, setDetailPalette] = useState<ExplorePalette | null>(null);

  const filtered = useMemo(() => {
    let list = [...explorePalettes];
    const q = search.toLowerCase().trim();
    if (q) {
      const keywords = q.split(/\s+/);
      list = list.filter((p) =>
        keywords.some((k) =>
          [p.name, ...p.tags, ...p.keywords, p.style, p.topic, p.description].join(" ").toLowerCase().includes(k)
        )
      );
    }
    if (selectedColors.length > 0) {
      list = list.filter((p) => selectedColors.some((c) => p.colors.some((hex) => matchColorTag(hex, c))));
    }
    if (selectedStyles.length > 0) {
      list = list.filter((p) => selectedStyles.includes(p.style));
    }
    if (selectedTopics.length > 0) {
      list = list.filter((p) => selectedTopics.includes(p.topic));
    }
    if (order === "latest") {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (order === "popular") {
      list.sort((a, b) => b.colors.length - a.colors.length);
    }
    return list;
  }, [search, selectedColors, selectedStyles, selectedTopics, order]);

  const displayList = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const activeFilterCount = selectedColors.length + selectedStyles.length + selectedTopics.length;

  function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  function loadIntoStudio(p: ExplorePalette) {
    const colors = createPalette(p.colors, p.colors.length);
    window.dispatchEvent(new CustomEvent("op-load-palette", { detail: { colors, mode: "Random" } }));
    window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "studio" } }));
  }

  async function copyHexes(colors: string[]) {
    try { await navigator.clipboard.writeText(colors.join(", ")); window.dispatchEvent(new CustomEvent("op-toast", { detail: { msg: "Palette copied" } })); } catch {}
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Editorial header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-page">Explore Color Palettes</h1>
        <p className="text-sm sm:text-base text-secondary">Get inspired by beautiful color schemes.</p>
      </div>

      {/* Search bar row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4"/></svg>
          <input
            className="w-full rounded-full border border-default bg-transparent pl-11 pr-4 py-3 text-sm text-page outline-none placeholder:text-muted focus:border-[var(--accent)] transition-colors"
            placeholder='Search by colors, topics, styles, hex — "modern fintech"'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisible(20); }}
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`rounded-full border px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${showFilters || activeFilterCount > 0 ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-default text-secondary hover:text-[var(--accent)]"}`}>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      {/* Filters drawer */}
      {showFilters && (
        <div className="rounded-2xl border border-default p-4 sm:p-5 space-y-4 bg-[var(--bg-base)]">
          <FilterRow label="Color" items={colorFilters} selected={selectedColors} onToggle={(v) => { setSelectedColors(toggle(selectedColors, v)); setVisible(20); }} />
          <FilterRow label="Style" items={styleFilters} selected={selectedStyles} onToggle={(v) => { setSelectedStyles(toggle(selectedStyles, v)); setVisible(20); }} />
          <FilterRow label="Topic" items={topicFilters} selected={selectedTopics} onToggle={(v) => { setSelectedTopics(toggle(selectedTopics, v)); setVisible(20); }} />
          <div className="flex items-center gap-2 text-sm text-secondary pt-1">
            <span className="font-semibold">Order</span>
            {ORDER_OPTIONS.map((o) => (
              <button key={o} className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${order === o ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:bg-[var(--bg-surface-muted)]"}`} onClick={() => setOrder(o)}>{o}</button>
            ))}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-1.5 -mt-4">
          {[...selectedColors, ...selectedStyles, ...selectedTopics].map((f) => (
            <span key={f} className="rounded-full bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-0.5 text-xs font-semibold">{f}</span>
          ))}
          <button onClick={() => { setSelectedColors([]); setSelectedStyles([]); setSelectedTopics([]); }} className="text-xs text-muted hover:text-page px-2">Clear</button>
        </div>
      )}

      {/* Palette list */}
      {displayList.length === 0 ? (
        <p className="text-sm text-muted py-12 text-center">No palettes match. Try different keywords or filters.</p>
      ) : (
        <div className="space-y-5">
          {displayList.map((p) => (
            <div key={p.id} className="group">
              {/* Swatch strip — clickable, seamless */}
              <button className="w-full flex h-16 sm:h-20 overflow-hidden rounded-lg sm:rounded-xl" onClick={() => setDetailPalette(p)}>
                {p.colors.map((hex, i) => (
                  <span key={i} className="flex-1 relative hover:flex-[1.2] transition-all duration-200" style={{ backgroundColor: hex }}>
                    <span onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(hex).catch(() => {}); window.dispatchEvent(new CustomEvent("op-toast", { detail: { msg: `Copied ${hex}` } })); }}
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-mono font-bold drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:scale-110"
                      style={{ color: getReadableTextColor(hex) }}>{hex}</span>
                  </span>
                ))}
              </button>

              {/* Palette info row — no container bg, just text + icons */}
              <div className="flex items-center justify-between py-2.5 px-0.5">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => setDetailPalette(p)} className="text-left min-w-0">
                    <p className="text-sm font-semibold text-page truncate">{p.name}</p>
                    <p className="text-[11px] text-muted truncate capitalize">{p.style} · {p.topic} · {p.colors.length} colors</p>
                  </button>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <IconBtn onClick={() => copyHexes(p.colors)} label="Copy HEX">📋</IconBtn>
                  <IconBtn onClick={() => {}} label="Favorite">☆</IconBtn>
                  <IconBtn onClick={() => setDetailPalette(p)} label="View">👁</IconBtn>
                  <IconBtn onClick={() => loadIntoStudio(p)} label="Open in Studio">↗</IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button className="rounded-full border border-default px-8 py-2.5 text-sm font-semibold text-secondary hover:text-[var(--accent)] transition" onClick={() => setVisible((v) => v + 20)}>
            Load More ({filtered.length - visible} remaining)
          </button>
        </div>
      )}

      {/* Detail modal */}
      {detailPalette && (
        <PaletteDetailModal palette={detailPalette} onClose={() => setDetailPalette(null)} onLoad={loadIntoStudio} />
      )}
    </section>
  );
}

function FilterRow({ label, items, selected, onToggle }: {
  label: string; items: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <span className="font-semibold text-secondary w-14 shrink-0">{label}</span>
      {items.map((item) => (
        <button key={item} onClick={() => onToggle(item)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            selected.includes(item) ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)]"
          }`}
        >{item}</button>
      ))}
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className="size-8 flex items-center justify-center rounded-full text-sm text-muted hover:text-page hover:bg-[var(--bg-surface-muted)] transition opacity-0 group-hover:opacity-100 focus:opacity-100"
    >{children}</button>
  );
}
