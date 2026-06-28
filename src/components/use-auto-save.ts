"use client";

import { useEffect, useRef } from "react";
import { type PaletteColor, type PaletteMode } from "@/lib/palette";

const STORAGE_PREFIX = "openpalette.session.";

interface SessionState {
  colors: { id: string; hex: string; alpha: number; locked: boolean }[];
  mode: PaletteMode;
}

export function useAutoSave(
  tab: string,
  colors: PaletteColor[],
  mode: PaletteMode,
  restore: (saved: SessionState) => void,
) {
  const restored = useRef(false);

  // Restore on mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + tab);
      if (!raw) return;
      const parsed: SessionState = JSON.parse(raw);
      if (parsed.colors?.length >= 2 && parsed.mode) {
        restore(parsed);
      }
    } catch { /* ignore corrupt data */ }
  }, [tab, restore]);

  // Auto-save on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state: SessionState = {
          colors: colors.map((c) => ({
            id: c.id,
            hex: c.hex,
            alpha: c.alpha,
            locked: c.locked,
          })),
          mode,
        };
        localStorage.setItem(STORAGE_PREFIX + tab, JSON.stringify(state));
      } catch { /* storage full */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [tab, colors, mode]);
}
