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
  const [detailPalette, setDetailPalette] = useState<ExplorePalette | null>(null);

  const filtered = useMemo(() => {
    let list = [...explorePalettes];
    const q = search.toLowerCase().trim();

    // Keyword/prompt search
    if (q) {
      const keywords = q.split(/\s+/);
      list = list.filter((p) =>
        keywords.some((k) =>
          [p.name, ...p.tags, ...p.keywords, p.style, p.topic, p.description].join(" ").toLowerCase().includes(k)
        )
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      list = list.filter((p) =>
        selectedColors.some((c) => p.colors.some((hex) => matchColorTag(hex, c)))
      );
    }

    // Style filter
    if (selectedStyles.length > 0) {
      list = list.filter((p) => selectedStyles.includes(p.style));
    }

    // Topic filter
    if (selectedTopics.length > 0) {
      list = list.filter((p) => selectedTopics.includes(p.topic));
    }

    // Sort
    if (order === "latest") {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (order === "popular") {
      list.sort((a, b) => b.colors.length - a.colors.length);
    }

    return list;
  }, [search, selectedColors, selectedStyles, selectedTopics, order]);

  const displayList = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  function loadIntoStudio(p: ExplorePalette) {
    // Navigate to Studio tab and set palette
    const colors = createPalette(p.colors, p.colors.length);
    window.dispatchEvent(new CustomEvent("op-load-palette", { detail: { colors, mode: "Random" } }));
    window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "studio" } }));
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight text-page">Explore</h1>
        <span className="text-xs text-muted">{filtered.length} palettes</span>
      </div>

      {/* Search */}
      <input
        className="w-full rounded-2xl surface p-4 font-mono text-sm text-page outline-none placeholder:text-muted"
        placeholder='Search palettes — "modern fintech app", "warm coffee shop", or keywords...'
        value={search}
        onChange={(e) => { setSearch(e.target.value); setVisible(20); }}
      />

      {/* Filters */}
      <div className="space-y-3">
        <FilterRow label="Color" items={colorFilters} selected={selectedColors} onToggle={(v) => setSelectedColors(toggle(selectedColors, v))} />
        <FilterRow label="Style" items={styleFilters} selected={selectedStyles} onToggle={(v) => setSelectedStyles(toggle(selectedStyles, v))} />
        <FilterRow label="Topic" items={topicFilters} selected={selectedTopics} onToggle={(v) => setSelectedTopics(toggle(selectedTopics, v))} />
        <div className="flex items-center gap-2 text-xs text-secondary">
          <span className="font-bold uppercase tracking-wider">Order</span>
          {ORDER_OPTIONS.map((o) => (
            <button key={o} className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${order === o ? "bg-[var(--accent)] text-white" : "surface text-secondary hover-bg-muted"}`} onClick={() => setOrder(o)}>{o}</button>
          ))}
        </div>
      </div>

      {/* Palette grid */}
      {displayList.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">No palettes match your search. Try different keywords.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayList.map((p) => (
            <ExploreCard key={p.id} palette={p} onOpen={setDetailPalette} onLoad={loadIntoStudio} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button className="rounded-full surface px-6 py-2 text-sm font-semibold text-page hover-bg-muted transition" onClick={() => setVisible((v) => v + 20)}>
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
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-secondary">
      <span className="font-bold uppercase tracking-wider w-12 shrink-0">{label}</span>
      {items.map((item) => (
        <button key={item} onClick={() => onToggle(item)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            selected.includes(item) ? "bg-[var(--accent)] text-white" : "surface text-secondary hover-bg-muted"
          }`}
        >{item}</button>
      ))}
    </div>
  );
}

function ExploreCard({ palette: p, onOpen, onLoad }: {
  palette: ExplorePalette; onOpen: (p: ExplorePalette) => void; onLoad: (p: ExplorePalette) => void;
}) {
  return (
    <div className="rounded-2xl border border-default overflow-hidden hover:shadow-lg transition-shadow bg-[var(--bg-surface)]">
      {/* Swatch strip */}
      <button className="w-full flex h-20 overflow-hidden" onClick={() => onOpen(p)}>
        {p.colors.map((hex, i) => (
          <div key={i} className="flex-1 flex items-end justify-center pb-1" style={{ backgroundColor: hex }}>
            <span className="text-[8px] font-mono font-bold drop-shadow-sm" style={{ color: getReadableTextColor(hex) }}>{hex}</span>
          </div>
        ))}
      </button>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-page leading-tight">{p.name}</p>
            <p className="text-[10px] text-muted mt-0.5 capitalize">{p.style} · {p.topic}</p>
          </div>
          <button onClick={() => onOpen(p)} className="size-7 flex items-center justify-center rounded-full hover:bg-[var(--bg-surface-muted)] text-secondary shrink-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" fill="currentColor"/><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-[var(--bg-surface-muted)] px-2 py-0.5 text-[10px] text-muted">{t}</span>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onLoad(p)} className="flex-1 rounded-full bg-[var(--accent)] text-white px-3 py-1 text-xs font-semibold hover:bg-[var(--accent-hover)] transition">Open</button>
          <button className="size-7 flex items-center justify-center rounded-full surface text-secondary hover-bg-muted transition" title="Favorite">☆</button>
        </div>
      </div>
    </div>
  );
}
