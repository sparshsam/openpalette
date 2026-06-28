"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createPalette,
  generatePalette,
  hexToHsl,
  hexToRgb,
  hslToHex,
  normalizeHex,
  resizePalette,
  rgbToHex,
  type PaletteColor,
  type PaletteMode,
} from "@/lib/palette";

type CurrentState = { colors: PaletteColor[]; mode: PaletteMode };

export function usePalette() {
  const [colors, setColors] = useState<PaletteColor[]>(() => createPalette());
  const [mode, setMode] = useState<PaletteMode>("Analogous");
  const [notice, setNotice] = useState("Ready");
  const [undoStack, setUndoStack] = useState<CurrentState[]>([]);
  const paletteHex = useMemo(() => colors.map((c) => normalizeHex(c.hex) ?? "#111827"), [colors]);
  const paletteAlphas = useMemo(() => colors.map((c) => c.alpha), [colors]);
  const announce = useCallback((m: string) => { setNotice(m); setTimeout(() => setNotice("Ready"), 2200); }, []);
  const pushUndo = useCallback((s: CurrentState) => setUndoStack((st) => [s, ...st].slice(0, 20)), []);
  const setPalette = useCallback((nc: PaletteColor[], nm: PaletteMode, msg: string) => { pushUndo({ colors, mode }); setColors(nc); setMode(nm); announce(msg); }, [announce, colors, mode, pushUndo]);
  const generate = useCallback(() => setPalette(generatePalette(colors, mode, colors.length), mode, `${mode}`), [colors, mode, setPalette]);
  const undo = useCallback(() => setUndoStack((s) => { const [p, ...r] = s; if (!p) { announce("Nothing to undo"); return s; } setColors(p.colors); setMode(p.mode); announce("Undone"); return r; }), [announce]);
  return {
    colors, setColors, mode, setMode, paletteHex, paletteAlphas, notice, undoStack,
    announce, generate, undo, setPalette,
    updateHex: (id: string, v: string) => setColors((c) => c.map((x) => x.id === id ? { ...x, hex: normalizeHex(v) ?? v.toUpperCase() } : x)),
    updateHsl: (id: string, ch: "h"|"s"|"l", v: number) => setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToHsl(x.hex); return { ...x, hex: hslToHex(ch==="h"?v:h.h, ch==="s"?v:h.s, ch==="l"?v:h.l) }; })),
    updateRgb: (id: string, ch: "r"|"g"|"b", v: number) => setColors((c) => c.map((x) => { if (x.id !== id) return x; const h = hexToRgb(x.hex); return { ...x, hex: rgbToHex({ ...h, [ch]: v }) }; })),
    updateAlpha: (id: string, a: number) => setColors((c) => c.map((x) => x.id === id ? { ...x, alpha: a } : x)),
    toggleLock: (id: string) => setColors((c) => c.map((x) => x.id === id ? { ...x, locked: !x.locked } : x)),
    setSize: (n: number) => setPalette(resizePalette(colors, n, mode), mode, `${n}`),
    switchMode: (m: PaletteMode) => setPalette(generatePalette(colors, m, colors.length), m, `${m}`),
  };
}

export type PaletteAPI = ReturnType<typeof usePalette>;
