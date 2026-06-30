"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { analyzePalette, getVisualAnalytics } from "@/lib/palette/health-score";
import { hslToHex } from "@/lib/palette/color";
import { PaletteCompare } from "./palette-compare";

export function PaletteInspector() {
  const ws = useWorkspace();
  const [tab, setTab] = useState<"health" | "analytics" | "compare">("health");

  const report = useMemo(() => analyzePalette(ws.paletteHex, ws.mode), [ws.paletteHex, ws.mode]);
  const analytics = useMemo(() => getVisualAnalytics(ws.paletteHex), [ws.paletteHex]);

  return (
    <div className="w-[340px] sm:w-[420px] max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative size-12 shrink-0">
          <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border-default)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={scoreColor(report.overall)} strokeWidth="3"
              strokeDasharray={`${report.overall} ${100 - report.overall}`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-page">{report.overall}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Palette Health</p>
          <p className="text-xs text-secondary mt-0.5">
            {report.overall >= 80 ? "Excellent" : report.overall >= 60 ? "Good" : report.overall >= 40 ? "Fair" : "Needs work"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {(["health", "analytics", "compare"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
              tab === t ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)]"
            }`}>{t}</button>
        ))}
      </div>

      {tab === "health" && <HealthTab report={report} />}
      {tab === "analytics" && <AnalyticsTab analytics={analytics} />}
      {tab === "compare" && <PaletteCompare />}
    </div>
  );
}

function HealthTab({ report }: { report: ReturnType<typeof analyzePalette> }) {
  const ws = useWorkspace();
  const [applying, setApplying] = useState<string | null>(null);

  // Apply recommendation: convert HSL string back to hex
  const applyRec = (rec: typeof report.recommendations[0]) => {
    setApplying(rec.label);
    try {
      const newHexes = rec.apply(ws.paletteHex.map((h) => h));
      // Convert any hsl() strings to hex
      const converted = newHexes.map((c) => {
        if (c.startsWith("hsl")) {
          const m = c.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
          if (m) return hslToHex(Number(m[1]), Number(m[2]), Number(m[3]));
        }
        return c;
      });
      ws.loadPalette(converted, ws.mode, `${rec.label} applied`);
    } catch {}
    setTimeout(() => setApplying(null), 1000);
  };

  return (
    <div className="space-y-3">
      {/* Breakdown scores */}
      <div className="space-y-1.5">
        {report.breakdown.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-secondary shrink-0">{b.label}</span>
            <div className="flex-1 h-2 rounded-full bg-[var(--surface)] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${b.score}%`, backgroundColor: scoreColor(b.score) }} />
            </div>
            <span className="w-8 text-right font-semibold text-page tabular-nums">{b.score}</span>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Recommendations</p>
          {report.recommendations.map((rec) => (
            <div key={rec.label}
              className={`rounded-xl border p-2.5 flex items-start gap-2 ${
                rec.severity === "high" ? "border-red-500/30 bg-red-500/5"
                : rec.severity === "medium" ? "border-amber-500/30 bg-amber-500/5"
                : "border-default"
              }`}>
              <span className="text-xs mt-0.5">{rec.severity === "high" ? "🔴" : rec.severity === "medium" ? "🟡" : "🟢"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-page">{rec.label}</p>
                <p className="text-[10px] text-secondary mt-0.5">{rec.detail}</p>
              </div>
              <button onClick={() => applyRec(rec)} disabled={applying === rec.label}
                className="shrink-0 rounded-full bg-[var(--accent)] text-white px-2.5 py-1 text-[10px] font-semibold hover:brightness-110 transition disabled:opacity-50 bounce-press">
                {applying === rec.label ? "✓" : "Apply"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ analytics }: { analytics: ReturnType<typeof getVisualAnalytics> }) {
  return (
    <div className="space-y-4">
      {/* Hue distribution */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Hue Distribution</p>
        <div className="flex rounded-xl overflow-hidden h-6 border border-default">
          {analytics.hues.map((h) => (
            <div key={h.label} className="flex-1 relative group" style={{ backgroundColor: h.hex, flexGrow: h.count }}>
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-muted opacity-0 group-hover:opacity-100 whitespace-nowrap">{h.label} ({h.count})</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 text-[10px] text-muted">
          {analytics.hues.map((h) => (
            <span key={h.label} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ backgroundColor: h.hex }} />{h.label}</span>
          ))}
        </div>
      </div>

      {/* Saturation distribution */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Saturation</p>
        <div className="flex gap-1">
          {analytics.saturations.map((s) => (
            <div key={s.range} className="flex-1 text-center rounded-lg bg-[var(--surface)] px-1 py-1.5">
              <p className="text-xs font-bold text-page">{s.count}</p>
              <p className="text-[8px] text-muted">{s.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lightness distribution */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Lightness</p>
        <div className="flex gap-1">
          {analytics.lightnesses.map((l) => (
            <div key={l.range} className="flex-1 text-center rounded-lg bg-[var(--surface)] px-1 py-1.5">
              <p className="text-xs font-bold text-page">{l.count}</p>
              <p className="text-[8px] text-muted">{l.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warm/Cool balance */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Warm vs Cool</p>
        <div className="flex rounded-xl overflow-hidden h-5 border border-default">
          {analytics.warmCount > 0 && <div className="flex items-center justify-center text-[9px] font-bold text-white" style={{ flexGrow: analytics.warmCount, backgroundColor: "#FF6B35" }}>{analytics.warmCount} warm</div>}
          {analytics.neutralCount > 0 && <div className="flex items-center justify-center text-[9px] font-bold text-page" style={{ flexGrow: analytics.neutralCount, backgroundColor: "#888" }}>{analytics.neutralCount} neutral</div>}
          {analytics.coolCount > 0 && <div className="flex items-center justify-center text-[9px] font-bold text-white" style={{ flexGrow: analytics.coolCount, backgroundColor: "#005FCC" }}>{analytics.coolCount} cool</div>}
        </div>
      </div>

      {/* Contrast heatmap */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Contrast Heatmap</p>
        {analytics.contrastMatrix.length === 0 ? (
          <p className="text-xs text-muted">Not enough colors.</p>
        ) : (
          <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${Math.min(5, Math.ceil(Math.sqrt(analytics.contrastMatrix.length)))}, 1fr)` }}>
            {analytics.contrastMatrix.slice(0, 16).map((p, i) => (
              <div key={i} className="rounded-lg h-8 flex items-center justify-center text-[8px] font-bold border border-default"
                style={{ backgroundColor: p.bg, color: p.fg }}
                title={`${p.bg} on ${p.fg}: ${p.ratio.toFixed(1)}:1`}>
                {p.ratio.toFixed(1)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function scoreColor(s: number): string {
  if (s >= 80) return "#22c55e";
  if (s >= 60) return "#eab308";
  if (s >= 40) return "#f97316";
  return "#ef4444";
}
