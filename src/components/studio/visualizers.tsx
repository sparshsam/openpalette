import { getReadableTextColor } from "@/lib/palette";

export const visualizers = ["Website", "Mobile", "Dashboard", "Poster", "Social", "Typography", "Brand"] as const;

export type Visualizer = (typeof visualizers)[number];

export function VisualizerPreview({ active, colors, gradient, textColor }: { active: Visualizer; colors: string[]; gradient: string; textColor?: string }) {
  const [primary, secondary, accent, surface, ink] = fillColors(colors);
  const text = textColor ?? ink;

  if (active === "Website") {
    return <WebsitePreview primary={primary} secondary={secondary} accent={accent} surface={surface} textColor={text} />;
  }
  if (active === "Mobile") {
    return <MobilePreview primary={primary} secondary={secondary} accent={accent} surface={surface} textColor={text} />;
  }
  if (active === "Dashboard") {
    return <DashboardPreview primary={primary} secondary={secondary} accent={accent} surface={surface} textColor={text} />;
  }
  if (active === "Poster") {
    return <PosterPreview gradient={gradient} textColor={text} />;
  }
  if (active === "Social") {
    return <SocialPreview primary={primary} secondary={secondary} accent={accent} surface={surface} textColor={text} />;
  }
  if (active === "Typography") {
    return <TypographyPreview primary={primary} secondary={secondary} accent={accent} surface={surface} textColor={text} />;
  }
  return <BrandPreview colors={colors} primary={primary} secondary={secondary} accent={accent} surface={surface} textColor={text} />;
}

type PreviewProps = { primary: string; secondary: string; accent: string; surface: string; textColor?: string };

function withTextColor(color: string, textColor?: string) {
  return textColor ?? getReadableTextColor(color);
}

function WebsitePreview({ primary, secondary, accent, surface, textColor }: PreviewProps) {
  return (
    <div className="rounded-xl p-5" style={{ background: surface, color: withTextColor(surface, textColor) }}>
      <div className="flex items-center justify-between">
        <strong>Northstar Studio</strong>
        <button className="rounded-md px-3 py-2 text-sm font-semibold" style={{ background: primary, color: getReadableTextColor(primary) }}>Start</button>
      </div>
      <div className="mt-14 max-w-xl">
        <h3 className="text-4xl font-semibold">Design systems that feel built, not borrowed.</h3>
        <p className="mt-3 text-sm opacity-75">A realistic website hero checks text, buttons, surfaces, and accent roles.</p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[primary, secondary, accent].map((color, index) => <span className="h-24 rounded-lg" key={color} style={{ background: color, opacity: index === 1 ? 0.8 : 1 }} />)}
      </div>
    </div>
  );
}

function MobilePreview({ primary, secondary, accent, surface, textColor }: PreviewProps) {
  return (
    <div className="mx-auto max-w-xs rounded-[2rem] border-8 border-[var(--foreground)] p-4" style={{ background: surface, color: withTextColor(surface, textColor) }}>
      <div className="h-6 rounded-full" style={{ background: primary }} />
      <h3 className="mt-6 text-2xl font-semibold">Today</h3>
      <div className="mt-4 space-y-3">
        {[primary, secondary, accent].map((color, index) => <div className="rounded-xl p-4 text-sm font-semibold" key={color} style={{ background: color, color: getReadableTextColor(color) }}>Task card {index + 1}</div>)}
      </div>
    </div>
  );
}

function DashboardPreview({ primary, secondary, accent, surface, textColor }: PreviewProps) {
  return (
    <div className="rounded-xl p-3 space-y-3" style={{ background: surface, color: withTextColor(surface, textColor) }}>
      <div className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: primary, color: getReadableTextColor(primary) }}>Analytics</div>
      <div className="grid grid-cols-3 gap-2">
        {[primary, secondary, accent].map((color) => <div className="h-16 rounded-lg p-2 text-[10px] font-semibold" key={color} style={{ background: color, color: getReadableTextColor(color) }}>Metric</div>)}
      </div>
      <div className="h-12 rounded-lg" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
    </div>
  );
}

function PosterPreview({ gradient, textColor }: { gradient: string; textColor?: string }) {
  return (
    <div className="grid min-h-96 place-items-center rounded-xl p-8 text-center" style={{ background: gradient, color: textColor ?? "#111827" }}>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em]">OpenPalette</p>
        <h3 className="mt-4 text-6xl font-black tracking-tight">Color Field</h3>
      </div>
    </div>
  );
}

function SocialPreview({ primary, secondary, accent, surface, textColor }: PreviewProps) {
  return (
    <div className="aspect-[1.91/1] rounded-xl p-5" style={{ background: primary, color: getReadableTextColor(primary) }}>
      <div className="flex h-full flex-col justify-between rounded-lg p-5" style={{ background: surface, color: withTextColor(surface, textColor) }}>
        <h3 className="text-3xl font-semibold">Launch palette</h3>
        <div className="flex gap-2">
          {[secondary, accent, primary].map((color) => <span className="h-12 flex-1 rounded-md" key={color} style={{ background: color }} />)}
        </div>
      </div>
    </div>
  );
}

function TypographyPreview({ primary, secondary, accent, surface, textColor }: PreviewProps) {
  const text = textColor ?? accent;
  return (
    <div className="rounded-xl p-6" style={{ background: surface, color: text }}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: textColor ?? accent }}>Type scale</p>
      <h3 className="mt-3 text-5xl font-semibold" style={{ color: text }}>Readable by default</h3>
      <p className="mt-3 max-w-2xl text-lg" style={{ color: textColor ?? secondary }}>Preview headings, body text, links, and callouts against the active palette.</p>
      <button className="mt-5 rounded-md px-4 py-2 font-semibold" style={{ background: primary, color: getReadableTextColor(primary) }}>Primary action</button>
    </div>
  );
}

function BrandPreview({ colors, primary, secondary, accent, surface, textColor }: PreviewProps & { colors: string[] }) {
  return (
    <div className="rounded-xl p-5" style={{ background: surface, color: withTextColor(surface, textColor) }}>
      <div className="flex items-center gap-3">
        <span className="grid size-16 place-items-center rounded-xl text-xl font-black" style={{ background: primary, color: getReadableTextColor(primary) }}>B</span>
        <div>
          <h3 className="text-3xl font-semibold" style={{ color: textColor ?? undefined }}>Brand kit</h3>
          <p style={{ color: textColor ?? secondary }}>Logo, marks, token ramps, and accents.</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-5 gap-2">
        {colors.map((color) => <div className="aspect-square rounded-lg p-1 font-mono text-[10px] flex items-end" key={color} style={{ background: color, color: getReadableTextColor(color) }}>{color}</div>)}
      </div>
      <div className="mt-4 h-2 rounded-full" style={{ background: accent }} />
    </div>
  );
}

function fillColors(colors: string[]) {
  return [colors[0] ?? "#111827", colors[1] ?? "#64748B", colors[2] ?? "#F97316", colors[3] ?? "#F8FAFC", colors[0] ?? "#111827"];
}
