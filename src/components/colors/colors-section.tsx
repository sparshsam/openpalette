"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hexToHsl } from "@/lib/palette";
import { getColorInfo } from "@/lib/palette/color-info";
import dynamic from "next/dynamic";
import { useDebounce } from "@/lib/palette/use-debounce";
import { showToast } from "@/components/toast";

const ColorDetailPage = dynamic(() => import("./color-detail-page").then((m) => ({ default: m.ColorDetailPage })));

const ALL_COLORS = [
  // Reds & Pinks — one per distinct hue
  "#FF0000","#DC143C","#B22222","#8B0000","#FF4500","#FF6347","#FF7F50",
  "#FF1493","#FF69B4","#FFB6C1","#FFC0CB",
  // Oranges & Yellows
  "#FF8C00","#FFA500","#FFD700","#FFFF00","#ADFF2F","#7FFF00","#32CD32",
  // Greens
  "#00FF00","#228B22","#008000","#006400","#00FF7F","#00FA9A",
  // Turquoises & Teals
  "#00CED1","#20B2AA","#008B8B","#008080",
  // Blues
  "#0000FF","#0000CD","#00008B","#000080","#1A237E","#3949AB","#5C6BC0","#6495ED","#87CEEB",
  // Purples & Violets
  "#4B0082","#8A2BE2","#9400D3","#9932CC","#BA55D3","#DA70D6","#9370DB","#E6E6FA",
  // Pinks
  "#FF00FF","#FFDAB9",
  // Browns & Tans
  "#FFE4B5","#F5DEB3","#DEB887","#D2B48C","#BC8F8F","#A0522D","#8B4513","#6B3E23",
  // Whites & Lights
  "#FFFFFF","#F5F5F5","#DCDCDC","#F0F8FF","#FFF5EE","#F5FFFA","#F0FFF0",
  // Grays
  "#C0C0C0","#A9A9A9","#808080","#696969","#505050","#383838","#1A1A1A",
  // Black
  "#000000","#0A0A0A",
  // Pastels & Tints
  "#E0FFFF","#FFE4E1","#FFF0F5","#FFFDE7","#FCE4EC","#F3E5F5","#FFF3E0",
  // Selected Material Design distincts
  "#D32F2F","#E57373","#FFCDD2","#C62828","#B71C1C","#880E4F",
  "#4A148C","#7B1FA2","#9C27B0","#CE93D8",
  "#1B5E20","#2E7D32","#4CAF50","#81C784","#C8E6C9",
  "#00695C","#009688","#26A69A","#80CBC4",
  "#01579B","#0277BD","#0288D1","#039BE5","#03A9F4",
  "#F44336","#9FA8DA","#B39DDB","#7E57C2","#5E35B1",
  "#EF5350","#AB47BC","#66BB6A","#A5D6A7","#4DB6AC",
];

const CATEGORIES = ["Red","Orange","Yellow","Green","Turquoise","Blue","Violet","Pink","Brown","White","Gray","Black"];

const categorizeCache = new Map<string, string>();
function categorize(hex: string): string {
  const cached = categorizeCache.get(hex);
  if (cached) return cached;
  const h = hexToHsl(hex).h, l = hexToHsl(hex).l;
  let result: string;
  if (l < 8) result = "Black";
  else if (l > 92) result = "White";
  else if (h >= 340 || h < 10) result = "Red";
  else if (h >= 10 && h < 45) result = "Orange";
  else if (h >= 45 && h < 70) result = "Yellow";
  else if (h >= 70 && h < 160) result = "Green";
  else if (h >= 160 && h < 200) result = "Turquoise";
  else if (h >= 200 && h < 265) result = "Blue";
  else if (h >= 265 && h < 320) result = "Violet";
  else if (h >= 320 && h < 340) result = "Pink";
  else {
    const s = hexToHsl(hex).s;
    result = (s < 20 && l < 70) ? "Gray" : "Brown";
  }
  categorizeCache.set(hex, result);
  return result;
}

function shuffle(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ColorsSection() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [category, setCategory] = useState("All");
  const [shuffled, setShuffled] = useState(() => ALL_COLORS.slice()); // deterministic on server
  const [detailHex, setDetailHex] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const match = window.location.hash.match(/^#\/colors\/([0-9A-Fa-f]{6})$/);
    return match ? match[1].toUpperCase() : null;
  });
  const searchRef = useRef<HTMLInputElement>(null);

  // Client-only shuffle on mount (avoids SSR mismatch)
  useEffect(() => { setShuffled(shuffle(ALL_COLORS)); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  // Spacebar randomizes (only on list page, not detail)
  useEffect(() => {
    if (detailHex) return;
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (category === "All") {
          setShuffled(shuffle(ALL_COLORS));
        } else {
          const filtered = ALL_COLORS.filter((h) => categorize(h) === category);
          setShuffled(shuffle(filtered));
        }
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [category, detailHex]);

  const displayColors = useMemo(() => {
    // Start from shuffled, filter by category and search
    let list = [...shuffled];
    if (category !== "All") list = list.filter((h) => categorize(h) === category);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((h) => {
        const info = getColorInfo(h);
        return info.name.toLowerCase().includes(q) || h.toLowerCase().includes(q);
      });
    }
    return list;
  }, [debouncedSearch, category, shuffled]);

  const openDetail = useCallback((hex: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/colors/${hex.replace("#", "")}`;
    window.open(url, "_blank");
  }, []);

  // Detail page mode
  if (detailHex) {
    return <ColorDetailPage hex={detailHex} onBack={() => { setDetailHex(null); window.history.replaceState(null, "", "#colors"); }} />;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-page">Colors</h1>
        <p className="text-sm sm:text-base text-secondary">Browse, search, and explore every color.</p>
      </div>

      <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-full border border-default bg-transparent px-5 py-3 text-sm text-page outline-none placeholder:text-muted focus:border-[var(--accent)] transition-colors"
        placeholder="Search colors by name or HEX..." />

      <div className="flex flex-wrap gap-1.5">
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              category === c ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)] hover-accent bounce-press"
            }`}
          >{c}</button>
        ))}
      </div>

      {displayColors.length === 0 ? (
        <p className="text-sm text-muted py-12 text-center">No colors match your filter or search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayColors.map((hex) => {
            const info = getColorInfo(hex);
            return (
              <div key={hex} className="bounce-press group relative rounded-xl overflow-hidden border border-default hover:shadow-lg transition-shadow cursor-pointer"
                style={{ backgroundColor: hex, aspectRatio: "3/2" }}
                onClick={() => { navigator.clipboard.writeText(hex).catch(() => {}); showToast(`Copied ${hex}`); }}>
                <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-semibold text-white drop-shadow-sm">{info.name}</p>
                  <p className="text-xs font-mono text-white/80">{hex}</p>
                </div>
                <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); showToast(`★ ${info.name} favorited`); }} className="size-6 flex items-center justify-center rounded-full bg-white/20 backdrop-blur text-xs text-white hover:bg-white/40">☆</button>
                  <button onClick={(e) => { e.stopPropagation(); openDetail(hex); }} className="size-6 flex items-center justify-center rounded-full bg-white/20 backdrop-blur text-xs text-white hover:bg-white/40">↗</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
