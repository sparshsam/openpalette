"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { PaletteColor, PaletteMode, PaletteRecord } from "@/lib/palette/types";
import { createPalette, generatePalette, normalizeHex, resizePalette } from "@/lib/palette";
import { createId, hexToHsl, hexToRgb, hslToHex, rgbToHex } from "@/lib/palette/color";
import { showToast } from "./toast";

type CurrentState = { colors: PaletteColor[]; mode: PaletteMode };

export interface WorkspaceAPI {
  colors: PaletteColor[];
  setColors: Dispatch<SetStateAction<PaletteColor[]>>;
  mode: PaletteMode;
  setMode: Dispatch<SetStateAction<PaletteMode>>;
  notice: string;
  paletteHex: string[];
  paletteAlphas: number[];
  undoStack: CurrentState[];
  redoStack: CurrentState[];
  recentlyGenerated: PaletteRecord[];
  recentlyCopied: string[];
  recentlyOpened: PaletteRecord[];

  generate: () => void;
  undo: () => void;
  redo: () => void;
  setPalette: (nc: PaletteColor[], nm: PaletteMode, msg: string) => void;
  updateHex: (id: string, v: string) => void;
  updateHsl: (id: string, ch: "h" | "s" | "l", v: number) => void;
  updateRgb: (id: string, ch: "r" | "g" | "b", v: number) => void;
  updateAlpha: (id: string, a: number) => void;
  announce: (m: string) => void;
  communicate: (m: string) => void;
  toggleLock: (id: string) => void;
  setSize: (n: number) => void;
  switchMode: (m: PaletteMode) => void;
  copyPalette: () => void;
  savePalette: () => void;
  shareUrl: () => void;
  loadPalette: (hexes: string[], nm: PaletteMode, msg: string) => void;
  // Snapshots
  snapshots: Snapshot[];
  saveSnapshot: (name: string) => void;
  restoreSnapshot: (id: string) => void;
  renameSnapshot: (id: string, name: string) => void;
  deleteSnapshot: (id: string) => void;
}

export interface Snapshot {
  id: string;
  name: string;
  colors: PaletteColor[];
  mode: PaletteMode;
  createdAt: string;
}

const WorkspaceCtx = createContext<WorkspaceAPI>(null!);

const WS_KEY = "openpalette.workspace.v1";

function loadWorkspace(): { colors: PaletteColor[]; mode: PaletteMode } | null {
  try {
    const s = localStorage.getItem(WS_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p.colors) && p.mode) return p;
    }
  } catch {}
  return null;
}

function loadList<T>(key: string): T[] {
  try {
    const s = localStorage.getItem(key);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p;
    }
  } catch {}
  return [];
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const saved = loadWorkspace();
  const [colors, setColors] = useState<PaletteColor[]>(() => saved?.colors ?? createPalette());
  const [mode, setMode] = useState<PaletteMode>(saved?.mode ?? "Random");
  const [notice, setNotice] = useState("Ready");
  const [undoStack, setUndoStack] = useState<CurrentState[]>([]);
  const [redoStack, setRedoStack] = useState<CurrentState[]>([]);
  const [recentlyGenerated, setRecentlyGenerated] = useState<PaletteRecord[]>(() => loadList("openpalette.ws.recent"));
  const [recentlyCopied, setRecentlyCopied] = useState<string[]>(() => loadList("openpalette.ws.copied"));
  const [recentlyOpened, setRecentlyOpened] = useState<PaletteRecord[]>(() => loadList("openpalette.ws.opened"));

  const paletteHex = useMemo(() => colors.map((c) => normalizeHex(c.hex) ?? "#111827"), [colors]);
  const paletteAlphas = useMemo(() => colors.map((c) => c.alpha), [colors]);

  useEffect(() => { localStorage.setItem(WS_KEY, JSON.stringify({ colors, mode })); }, [colors, mode]);
  useEffect(() => { localStorage.setItem("openpalette.ws.recent", JSON.stringify(recentlyGenerated)); }, [recentlyGenerated]);
  useEffect(() => { localStorage.setItem("openpalette.ws.copied", JSON.stringify(recentlyCopied)); }, [recentlyCopied]);
  useEffect(() => { localStorage.setItem("openpalette.ws.opened", JSON.stringify(recentlyOpened)); }, [recentlyOpened]);

  const communicate = useCallback((m: string) => {
    setNotice(m);
    setTimeout(() => setNotice("Ready"), 2200);
  }, []);

  const pushUndo = useCallback((s: CurrentState) => {
    setUndoStack((st) => {
      const next = [s, ...st].slice(0, 50);
      return next;
    });
    setRedoStack([]);
  }, []);

  const setPalette = useCallback(
    (nc: PaletteColor[], nm: PaletteMode, msg: string) => {
      pushUndo({ colors, mode });
      setColors(nc);
      setMode(nm);
      communicate(msg);
      if (msg !== "Ready") showToast(msg);
    },
    [colors, mode, pushUndo, communicate],
  );

  const generate = useCallback(
    () => setPalette(generatePalette(colors, mode, colors.length), mode, `${mode}`),
    [colors, mode, setPalette],
  );

  const undo = useCallback(() => {
    setUndoStack((s) => {
      const [p, ...r] = s;
      if (!p) { communicate("Nothing to undo"); return s; }
      setRedoStack((rs) => [{ colors, mode }, ...rs]);
      setColors(p.colors);
      setMode(p.mode);
      communicate("Undone");
      return r;
    });
  }, [colors, mode, communicate]);

  const redo = useCallback(() => {
    setRedoStack((s) => {
      const [p, ...r] = s;
      if (!p) { communicate("Nothing to redo"); return s; }
      setUndoStack((us) => [{ colors, mode }, ...us]);
      setColors(p.colors);
      setMode(p.mode);
      communicate("Redone");
      return r;
    });
  }, [colors, mode, communicate]);

  const updateHex = useCallback((id: string, v: string) => {
    const n = normalizeHex(v);
    if (!n) return;
    setColors((c) => c.map((x) => x.id === id ? { ...x, hex: n } : x));
  }, []);

  const updateAlpha = useCallback((id: string, a: number) => {
    setColors((c) => c.map((x) => x.id === id ? { ...x, alpha: Math.max(0, Math.min(100, a)) } : x));
  }, []);

  const updateHsl = useCallback((id: string, ch: "h" | "s" | "l", v: number) => {
    setColors((c) => c.map((x) => {
      if (x.id !== id) return x;
      const hsl = hexToHsl(x.hex);
      if (!hsl) return x;
      const next = { ...hsl, [ch]: ch === "h" ? ((v % 360) + 360) % 360 : Math.max(0, Math.min(100, v)) };
      return { ...x, hex: hslToHex(next.h, next.s, next.l) };
    }));
  }, []);

  const updateRgb = useCallback((id: string, ch: "r" | "g" | "b", v: number) => {
    setColors((c) => c.map((x) => {
      if (x.id !== id) return x;
      const rgb = hexToRgb(x.hex);
      if (!rgb) return x;
      const next = { ...rgb, [ch]: Math.max(0, Math.min(255, Math.round(v))) };
      return { ...x, hex: rgbToHex(next) };
    }));
  }, []);

  const setSize = useCallback(
    (n: number) => setPalette(resizePalette(colors, n, mode), mode, `${n} colors`),
    [colors, mode, setPalette],
  );

  const switchMode = useCallback(
    (m: PaletteMode) => setPalette(generatePalette(colors, m, colors.length), m, `${m}`),
    [colors, setPalette],
  );

  const copyPalette = useCallback(() => {
    const text = paletteHex.join(", ");
    navigator.clipboard.writeText(text).catch(() => {});
    showToast("Palette copied");
    setRecentlyCopied((c) => [text, ...c.filter((x) => x !== text)].slice(0, 20));
  }, [paletteHex]);

  const savePalette = useCallback(() => {
    const record: PaletteRecord = {
      id: createId("pal"),
      name: `Palette ${new Date().toLocaleDateString()}`,
      colors: paletteHex,
      alphas: paletteAlphas,
      mode,
      tags: [],
      collection: "Default",
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usedAt: new Date().toISOString(),
    };
    setRecentlyGenerated((r) => [record, ...r].slice(0, 30));
    showToast("Palette saved");
  }, [paletteHex, paletteAlphas, mode]);

  const toggleLock = useCallback((id: string) => {
    setColors((c) => c.map((x) => x.id === id ? { ...x, locked: !x.locked } : x));
  }, []);

  const shareUrl = useCallback(() => {
    const u = `${window.location.origin}${window.location.pathname}?palette=${paletteHex.join("-")}`;
    navigator.clipboard.writeText(u).catch(() => {});
    showToast("Share URL copied");
  }, [paletteHex]);

  const loadPalette = useCallback(
    (hexes: string[], nm: PaletteMode, msg: string) => {
      const nc = createPalette(hexes, hexes.length);
      pushUndo({ colors, mode });
      setColors(nc);
      setMode(nm);
      const record: PaletteRecord = {
        id: createId("pal"),
        name: msg,
        colors: hexes,
        alphas: nc.map((c) => c.alpha),
        mode: nm,
        tags: [],
        collection: "Default",
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usedAt: new Date().toISOString(),
      };
      setRecentlyOpened((r) => [record, ...r.filter((x) => x.id !== record.id)].slice(0, 20));
      showToast(msg);
    },
    [colors, mode, pushUndo],
  );

  // ── Snapshots ──
  const SNAP_KEY = "openpalette.ws.snapshots";
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => loadList<Snapshot>(SNAP_KEY));
  useEffect(() => { localStorage.setItem(SNAP_KEY, JSON.stringify(snapshots)); }, [snapshots]);

  const saveSnapshot = useCallback((name: string) => {
    const snap: Snapshot = { id: createId("snap"), name, colors, mode, createdAt: new Date().toISOString() };
    setSnapshots((s) => [snap, ...s].slice(0, 20));
    showToast(`Snapshot saved: ${name}`);
  }, [colors, mode]);

  const restoreSnapshot = useCallback((id: string) => {
    const snap = snapshots.find((s) => s.id === id);
    if (!snap) return;
    pushUndo({ colors, mode });
    setColors(snap.colors);
    setMode(snap.mode);
    showToast(`Restored: ${snap.name}`);
  }, [snapshots, colors, mode, pushUndo]);

  const renameSnapshot = useCallback((id: string, name: string) => {
    setSnapshots((s) => s.map((x) => x.id === id ? { ...x, name } : x));
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots((s) => s.filter((x) => x.id !== id));
  }, []);

  const value: WorkspaceAPI = {
    colors, setColors, mode, setMode, notice,
    paletteHex, paletteAlphas,
    undoStack, redoStack,
    recentlyGenerated, recentlyCopied, recentlyOpened,
    generate, undo, redo, setPalette,
    updateHex, updateHsl, updateRgb, updateAlpha,
    announce: communicate, communicate, toggleLock, setSize, switchMode,
    copyPalette, savePalette, shareUrl,
    loadPalette,
    snapshots, saveSnapshot, restoreSnapshot, renameSnapshot, deleteSnapshot,
  };

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace() {
  return useContext(WorkspaceCtx);
}
