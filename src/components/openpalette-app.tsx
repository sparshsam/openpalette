"use client";

import { useEffect, useRef, useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { WorkspaceToolbar } from "@/components/workspace-toolbar";
import { useWorkspace } from "@/components/workspace-context";
import { StudioSection } from "@/components/studio/studio-section";
import { ExploreSection } from "@/components/explore/explore-section";
import { ImagePickerSection } from "@/components/image-picker/image-picker-section";
import { ContrastSection } from "@/components/contrast/contrast-section";
import { VisualizerSection } from "@/components/visualizer/visualizer-section";
import { ColorsSection } from "@/components/colors/colors-section";
import { TokensSection } from "@/components/tokens/tokens-section";
import { GradientSection } from "@/components/gradient/gradient-section";
import { AccessibilitySection } from "@/components/a11y/a11y-section";
import { SettingsSection } from "@/components/settings-section";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { ErrorBoundary } from "@/components/error-boundary";


type Tab = "studio" | "explore" | "image-picker" | "contrast" | "visualizer" | "colors" | "tokens" | "gradient" | "accessibility" | "settings";
const tabs: { id: Tab; label: string }[] = [
  { id: "studio", label: "Studio" }, { id: "explore", label: "Explore" }, { id: "image-picker", label: "Extract" },
  { id: "contrast", label: "Contrast" }, { id: "visualizer", label: "Visualizer" }, { id: "colors", label: "Colors" },
  { id: "tokens", label: "Tokens" },
  { id: "gradient", label: "Gradient" }, { id: "accessibility", label: "Accessibility" }, { id: "settings", label: "Settings" },
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
  const [mounted, setMounted] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const navRef = useRef<HTMLDivElement>(null);
  const ws = useWorkspace();

  useEffect(() => {
    // Preserve sub-hashes for color detail, token detail, and contrast routes
    const cur = window.location.hash.replace("#", "");
    if (/^\/(colors|tokens)\/[0-9A-Fa-f]{6}/.test(cur) || /^\/contrast\//.test(cur)) return;
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
        ws.loadPalette(detail.colors, detail.mode ?? "Random", "Palette loaded");
        setActiveTab("studio");
      }
    };
    window.addEventListener("op-navigate", handler);
    window.addEventListener("op-load-palette", paletteHandler);
    return () => {
      window.removeEventListener("op-navigate", handler);
      window.removeEventListener("op-load-palette", paletteHandler);
    };
  }, [ws]);

  // Non-passive wheel listener — prevents page scroll when scrolling the nav
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const scrollNav = (dir: "left" | "right") => {
    navRef.current?.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable === true;
      const mod = e.metaKey || e.ctrlKey;

      if (isInput) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          ws.generate();
          break;
        case "KeyZ":
          if (mod && e.shiftKey) { e.preventDefault(); ws.redo(); }
          else if (mod) { e.preventDefault(); ws.undo(); }
          break;
        case "KeyC":
          if (!mod) { e.preventDefault(); ws.copyPalette(); }
          break;
        case "Slash":
          e.preventDefault();
          if (e.key === "?") {
            setShowShortcuts(true);
          } else {
            setShowCommand(true);
          }
          break;
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [ws]);

  return <div>
    <nav className="flex justify-center items-center gap-1 py-3 px-2" aria-label="Tabs">
      <button type="button" onClick={() => scrollNav("left")}
        className="shrink-0 size-10 sm:size-7 flex items-center justify-center rounded-full text-sm text-secondary hover:text-[var(--accent)] hover:bg-[var(--surface)] transition disabled:opacity-20"
        aria-label="Scroll tabs left">◀</button>
      <div ref={navRef}
        className="flex gap-0.5 p-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm overflow-x-auto scroll-smooth no-scrollbar w-[26rem] sm:w-[28rem] max-w-[calc(100vw-7rem)]">
        {tabs.map((t) => (
          <button key={t.id} className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
            mounted && activeTab === t.id
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--accent)]"
          }`} type="button" onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <button type="button" onClick={() => scrollNav("right")}
        className="shrink-0 size-10 sm:size-7 flex items-center justify-center rounded-full text-sm text-secondary hover:text-[var(--accent)] hover:bg-[var(--surface)] transition disabled:opacity-20"
        aria-label="Scroll tabs right">▶</button>
    </nav>
    {/* Conditional rendering — suppresses hydration mismatch at each wrapper */}
    {mounted && activeTab === "studio" && <div suppressHydrationWarning><ErrorBoundary name="Studio"><StudioSection /></ErrorBoundary></div>}
    {mounted && activeTab === "explore" && <div suppressHydrationWarning><ErrorBoundary name="Explore"><ExploreSection /></ErrorBoundary></div>}
    {mounted && activeTab === "image-picker" && <div suppressHydrationWarning><ErrorBoundary name="ImagePicker"><ImagePickerSection /></ErrorBoundary></div>}
    {mounted && activeTab === "contrast" && <div suppressHydrationWarning><ErrorBoundary name="Contrast"><ContrastSection /></ErrorBoundary></div>}
    {mounted && activeTab === "visualizer" && <div suppressHydrationWarning><ErrorBoundary name="Visualizer"><VisualizerSection /></ErrorBoundary></div>}
    {mounted && activeTab === "colors" && <div suppressHydrationWarning><ErrorBoundary name="Colors"><ColorsSection /></ErrorBoundary></div>}
    {mounted && activeTab === "tokens" && <div suppressHydrationWarning><ErrorBoundary name="Tokens"><TokensSection /></ErrorBoundary></div>}
    {mounted && activeTab === "gradient" && <div suppressHydrationWarning><ErrorBoundary name="Gradient"><GradientSection /></ErrorBoundary></div>}
    {activeTab === "accessibility" && <div suppressHydrationWarning><ErrorBoundary name="Accessibility"><AccessibilitySection /></ErrorBoundary></div>}
    {activeTab === "settings" && <div suppressHydrationWarning><SettingsSection /></div>}
    {!mounted && <div suppressHydrationWarning />}
    {mounted && <WorkspaceToolbar />}
    {showCommand && <CommandPalette onClose={() => setShowCommand(false)} />}
    {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
  </div>;
}

