"use client";

import { useState } from "react";
import { useTheme } from "./theme-provider";
import { showToast } from "./toast";
import { KeyboardShortcuts } from "./keyboard-shortcuts";

const APP_VERSION = "0.9.3";

export function SettingsSection() {
  const { theme, toggle } = useTheme();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [defaultCount, setDefaultCount] = useState(() => {
    try { return Number(localStorage.getItem("op-settings-count")) || 5; } catch { return 5; }
  });
  const [defaultFormat, setDefaultFormat] = useState(() => {
    try { return localStorage.getItem("op-settings-format") || "css"; } catch { return "css"; }
  });

  const saveCount = (n: number) => {
    setDefaultCount(n);
    localStorage.setItem("op-settings-count", String(n));
    showToast(`Default count: ${n}`);
  };

  const saveFormat = (f: string) => {
    setDefaultFormat(f);
    localStorage.setItem("op-settings-format", f);
    showToast(`Default format: ${f}`);
  };

  const exportSettings = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("openpalette.")) {
        data[key] = localStorage.getItem(key) ?? "";
      }
    }
    const blob = new Blob([JSON.stringify({ version: APP_VERSION, settings: data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `openpalette-settings.json`; a.click();
    URL.revokeObjectURL(url);
    showToast("Settings exported");
  };

  const importSettings = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      try {
        const text = await input.files?.[0]?.text();
        if (!text) return;
        const data = JSON.parse(text);
        if (data.settings) {
          Object.entries(data.settings).forEach(([key, value]) => {
            localStorage.setItem(key, String(value));
          });
          showToast("Settings imported — refresh to apply");
        }
      } catch { showToast("Invalid settings file"); }
    };
    input.click();
  };

  const resetApp = () => {
    if (!confirm("Reset all OpenPalette data? This cannot be undone.")) return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("openpalette.")) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    showToast("Application reset — refreshing");
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-page">Settings</h1>
        <p className="text-sm sm:text-base text-secondary">Configure your OpenPalette workspace.</p>
      </div>

      {/* Appearance */}
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Appearance</p>
        <div className="rounded-2xl border border-default p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-page">Theme</p>
              <p className="text-xs text-muted">{theme === "light" ? "Light" : "Dark"} mode</p>
            </div>
            <button onClick={toggle}
              className="rounded-full border border-default px-4 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press">
              Switch to {theme === "light" ? "Dark" : "Light"}
            </button>
          </div>
          <div className="flex items-center justify-between opacity-50">
            <div>
              <p className="text-sm font-semibold text-page">Accent Color</p>
              <p className="text-xs text-muted">Custom accent — coming in a future release</p>
            </div>
            <span className="size-6 rounded-full border border-default" style={{ backgroundColor: "var(--accent)" }} />
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Workspace</p>
        <div className="rounded-2xl border border-default p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-page">Default Color Count</p>
              <p className="text-xs text-muted">Colors per new palette</p>
            </div>
            <div className="flex gap-1">
              {[3, 5, 8, 10].map((n) => (
                <button key={n} onClick={() => saveCount(n)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    defaultCount === n ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)]"
                  }`}>{n}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-page">Default Export Format</p>
              <p className="text-xs text-muted">Pre-selected export format</p>
            </div>
            <select value={defaultFormat} onChange={(e) => saveFormat(e.target.value)}
              className="rounded-full border border-default bg-transparent px-4 py-1.5 text-xs font-semibold text-page outline-none">
              <option value="css">CSS Variables</option>
              <option value="scss">SCSS</option>
              <option value="tailwind-v4">Tailwind v4</option>
              <option value="json">JSON</option>
              <option value="w3c">W3C Design Tokens</option>
            </select>
          </div>
        </div>
      </section>

      {/* Keyboard */}
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Keyboard</p>
        <div className="rounded-2xl border border-default p-4">
          <button onClick={() => setShowShortcuts(true)}
            className="rounded-full border border-default px-4 py-1.5 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press">
            View Keyboard Shortcuts
          </button>
        </div>
      </section>

      {/* Data */}
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Data</p>
        <div className="rounded-2xl border border-default p-4 space-y-3">
          <button onClick={exportSettings}
            className="w-full rounded-full border border-default px-4 py-2 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press">
            Export Settings
          </button>
          <button onClick={importSettings}
            className="w-full rounded-full border border-default px-4 py-2 text-xs font-semibold text-secondary hover:text-[var(--accent)] transition bounce-press">
            Import Settings
          </button>
          <button onClick={resetApp}
            className="w-full rounded-full border border-red-500/50 text-red-500 px-4 py-2 text-xs font-semibold hover:bg-red-500/10 transition bounce-press">
            Reset Application
          </button>
        </div>
      </section>

      {/* About */}
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">About</p>
        <div className="rounded-2xl border border-default p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-secondary">Version</span><span className="font-semibold text-page">{APP_VERSION}</span></div>
          <div className="flex justify-between"><span className="text-secondary">Author</span><span className="font-semibold text-page">Sparsh Sam</span></div>
          <div className="flex justify-between"><span className="text-secondary">License</span><span className="font-semibold text-page">MIT</span></div>
          <div className="flex justify-between"><span className="text-secondary">Repository</span><a href="https://github.com/sparshsam/openpalette" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent)] hover:underline">GitHub</a></div>
          <div className="flex justify-between"><span className="text-secondary">Live</span><a href="https://palette.kovina.org" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent)] hover:underline">palette.kovina.org</a></div>
          <p className="text-xs text-muted pt-2 border-t border-default mt-2">
            A local-first, open-source color studio. All data stays in your browser.
            No accounts, no tracking, no cloud sync.
          </p>
        </div>
      </section>

      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
    </section>
  );
}
