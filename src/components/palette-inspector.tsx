"use client";

import { useCallback, useMemo, useState } from "react";
import { useWorkspace } from "./workspace-context";
import { analyzePalette, getVisualAnalytics } from "@/lib/palette/health-score";
import { hslToHex } from "@/lib/palette/color";
import { PaletteCompare } from "./palette-compare";
import { generatePaletteNames, classifyPalette, summarizePalette, analyzeQuality, generateVariations } from "@/lib/palette/palette-intelligence";
import { showToast } from "./toast";

export function PaletteInspector() {
  const ws = useWorkspace();
  const [tab, setTab] = useState<"health" | "analytics" | "compare" | "names" | "quality" | "variations">("names");

  const report = useMemo(() => analyzePalette(ws.paletteHex, ws.mode), [ws.paletteHex, ws.mode]);
  const analytics = useMemo(() => getVisualAnalytics(ws.paletteHex), [ws.paletteHex]);
  const naming = useMemo(() => generatePaletteNames(ws.paletteHex), [ws.paletteHex]);
  const tags = useMemo(() => classifyPalette(ws.paletteHex), [ws.paletteHex]);
  const summary = useMemo(() => summarizePalette(ws.paletteHex), [ws.paletteHex]);
  const qualityReport = useMemo(() => analyzeQuality(ws.paletteHex), [ws.paletteHex]);
  const variations = useMemo(() => generateVariations(ws.paletteHex), [ws.paletteHex]);
  const [customName, setCustomName] = useState("");

  const displayName = customName || naming.primary;

  return (
    <div className="w-[340px] sm:w-[420px] max-h-[80vh] overflow-y-auto">
      {/* Name header */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <input value={displayName} onChange={(e) => setCustomName(e.target.value)}
            className="flex-1 text-sm font-bold text-page bg-transparent outline-none border-b border-transparent hover:border-default focus:border-[var(--accent)] transition-colors"
            placeholder="Palette name…" spellCheck={false} />
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: `${scoreColor(50)}15`, color: scoreColor(50) }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(["names", "health", "analytics", "quality", "compare", "variations"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider transition ${
              tab === t ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)]"
            }`}>{t === "names" ? "Info" : t === "health" ? "Scores" : t}</button>
        ))}
      </div>

      {tab === "names" && <NamesTab naming={naming} tags={tags} summary={summary} />}
      {tab === "health" && <HealthTab report={report} />}
      {tab === "analytics" && <AnalyticsTab analytics={analytics} />}
      {tab === "quality" && <QualityTab report={qualityReport} />}
      {tab === "compare" && <PaletteCompare />}
      {tab === "variations" && <VariationsTab variations={variations} ws={ws} />}
    </div>
  );
}

function NamesTab({ naming, tags, summary }: {
  naming: ReturnType<typeof generatePaletteNames>;
  tags: string[];
  summary: ReturnType<typeof summarizePalette>;
}) {
  return (
    <div className="space-y-3">
      {/* Alternative names */}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Alternative Names</p>
        <div className="flex flex-wrap gap-1">
          {[naming.primary, ...naming.alternatives].map((n, i) => (
            <span key={i} className="rounded-full border border-default px-2.5 py-1 text-[10px] font-semibold text-secondary">{n}</span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Design Summary</p>
        <div className="rounded-xl border border-default p-3 space-y-2 text-xs">
          <Row label="Mood" value={summary.mood} />
          <Row label="Industries" value={summary.industries.join(" · ")} />
          <Row label="Best for" value={summary.useCases.join(" · ")} />
          <Row label="UI Style" value={summary.uiStyle} />
          <Row label="Accessibility" value={summary.accessibility} />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Classification</p>
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="rounded-full border border-default px-2.5 py-1 text-[10px] font-semibold text-secondary">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QualityTab({ report }: { report: ReturnType<typeof analyzeQuality> }) {
  const items = [
    { label: "Dominant Hue", value: report.dominantHue },
    { label: "Hue Distribution", value: report.hueDistribution },
    { label: "Saturation", value: report.saturationBalance },
    { label: "Lightness", value: report.lightnessBalance },
    { label: "Warm/Cool", value: report.warmCoolRatio },
    { label: "Accent", value: report.accentStrength },
    { label: "Contrast", value: report.contrastConsistency },
    { label: "Quality", value: report.overallQuality },
  ];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 text-xs">
            <span className="w-24 shrink-0 text-secondary font-medium">{item.label}</span>
            <span className="text-page">{item.value}</span>
          </div>
        ))}
      </div>

      {report.similarColors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Similar Colors Detected</p>
          {report.similarColors.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="size-3 rounded" style={{ backgroundColor: s.hex }} />
              <span className="font-mono text-secondary">{s.hex}</span>
              <span className="text-muted">similar to</span>
              <span className="size-3 rounded" style={{ backgroundColor: s.duplicate }} />
              <span className="font-mono text-secondary">{s.duplicate}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VariationsTab({ variations, ws }: { variations: ReturnType<typeof generateVariations>; ws: ReturnType<typeof useWorkspace> }) {
  const loadVar = useCallback((v: typeof variations[0]) => {
    ws.loadPalette(v.colors, v.mode, v.name);
    showToast(`Loaded: ${v.name}`);
  }, [ws]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Palette Variations</p>
      {variations.map((v) => (
        <button key={v.name} onClick={() => loadVar(v)}
          className="w-full rounded-xl border border-default p-2.5 text-left hover:bg-[var(--surface)] transition space-y-1.5">
          <p className="text-xs font-semibold text-page">{v.name}</p>
          <div className="flex rounded-lg overflow-hidden h-5">
            {v.colors.map((c, i) => <span key={i} className="flex-1" style={{ backgroundColor: c }} />)}
          </div>
        </button>
      ))}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-20 shrink-0 text-muted">{label}</span>
      <span className="text-page">{value}</span>
    </div>
  );
}

function scoreColor(s: number): string {
  if (s >= 80) return "#22c55e";
  if (s >= 60) return "#eab308";
  if (s >= 40) return "#f97316";
  return "#ef4444";
}
