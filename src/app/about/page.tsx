import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — OpenPalette",
  description:
    "A local-first, open-source color studio for designers and developers. Generate palettes, design tokens, gradients, accessibility checks, and exports — all in your browser.",
  openGraph: {
    title: "About — OpenPalette",
    description:
      "A local-first, open-source color studio for designers and developers. No accounts, no tracking, no cloud.",
  },
};

const TOOLS = [
  { name: "Studio", icon: "🎨", desc: "Full palette editor with harmony modes, drag-to-reorder, and real-time color channels." },
  { name: "Explore", icon: "✨", desc: "Discover curated palettes by style, topic, and color family." },
  { name: "Extract", icon: "📷", desc: "Extract beautiful palettes from any image using six extraction modes." },
  { name: "Contrast", icon: "◐", desc: "WCAG contrast checker with AA/AAA ratings and live previews." },
  { name: "Visualizer", icon: "🖥", desc: "Preview your palette on realistic website, mobile, and brand mockups." },
  { name: "Colors", icon: "🔵", desc: "Browse 150 named colors with conversions, harmonies, and accessibility data." },
  { name: "Tokens", icon: "⚙", desc: "Generate 11-step design token scales with Tailwind, CSS, and JSON exports." },
  { name: "Gradient", icon: "🌈", desc: "Build linear, radial, and conic gradients with a professional stop editor." },
  { name: "Accessibility", icon: "♿", desc: "Full accessibility studio with theme tester, blind simulation, and audit." },
  { name: "Themes", icon: "🏷", desc: "Load and customize curated light and dark theme sets." },
  { name: "Library", icon: "📚", desc: "Save, tag, search, and export unlimited palettes to your local library." },
];

const WORKFLOW_STEPS = [
  { step: "Generate", icon: "🎲", desc: "Pick a harmony mode and generate a balanced palette. Lock what works." },
  { step: "Refine", icon: "✏", desc: "Tune individual colors with HEX, HSL, RGB, or HSV. Adjust saturation, brightness, and temperature." },
  { step: "Visualize", icon: "🖥", desc: "Preview your palette across website, mobile, dashboard, and brand mockups." },
  { step: "Validate", icon: "✓", desc: "Check contrast ratios, simulate color blindness, and verify WCAG compliance." },
  { step: "Export", icon: "📤", desc: "Export as CSS, Tailwind, JSON, SCSS, SVG, PNG, Tokens, Android XML, or iOS Swift." },
];

const USE_CASES = [
  "Brand identity design", "Website color palettes", "Dashboard UI", "Mobile apps",
  "Design systems", "Tailwind CSS projects", "Figma handoff", "Marketing graphics",
  "Presentations", "Social media branding", "Accessibility reviews", "Product design",
];

const EXPORTS = [
  "CSS Variables", "Tailwind CSS", "SCSS", "JSON", "SVG", "PNG", "Android XML", "iOS Swift",
];

const AUDIENCES = [
  { title: "UI Designers", desc: "Generate and refine color palettes for interfaces, then export tokens directly." },
  { title: "UX Designers", desc: "Validate accessibility and preview color choices on realistic mockups." },
  { title: "Graphic Designers", desc: "Build harmonious palettes, gradients, and brand color systems in minutes." },
  { title: "Brand Designers", desc: "Create complete design token scales and ensure brand consistency across surfaces." },
  { title: "Product Designers", desc: "Ship production-ready color systems with Tailwind, CSS, and JSON exports." },
  { title: "Frontend Developers", desc: "Generate Tailwind configs, CSS variables, and SCSS from a single base color." },
  { title: "Web Developers", desc: "Extract palettes from images, check contrast, and preview on real layouts." },
  { title: "Students", desc: "Learn color theory through hands-on exploration with harmonies, contrast, and vision simulation." },
  { title: "Creative Professionals", desc: "A complete color toolkit — free, local-first, and always available." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 space-y-28">
      {/* ─── Hero ─── */}
      <section className="space-y-6 text-center sm:text-left">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.92] tracking-tight">
          <span className="text-[var(--accent)]">OpenPalette</span>
        </h1>
        <p className="text-xl sm:text-2xl text-[var(--text-primary)] font-semibold max-w-2xl leading-snug">
          Local-first color studio for designers and developers.
        </p>
        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
          OpenPalette is a free, open-source color palette generator, design token creator, gradient builder, accessibility checker, and visualizer — all running entirely in your browser. No accounts, no tracking, no cloud.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {["v0.8.10", "Open Source", "Local First", "11 Tools", "No Account Required"].map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--border-default)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">{tag}</span>
          ))}
        </div>
      </section>

      {/* ─── What is OpenPalette? ─── */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">What is OpenPalette?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            OpenPalette is a color palette creator and color studio that runs entirely in your browser. Generate professional color palettes, build complete color systems, create Tailwind-ready design tokens, extract colors from images, and preview how your palette looks on real interfaces.
          </p>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Every feature — from palette generation to gradient creation, contrast checking to token export — works locally on your device. There are no accounts, no servers, and no data leaves your machine. OpenPalette is free, open source, and designed for the way designers and developers actually work.
          </p>
        </div>
      </section>

      {/* ─── Who is OpenPalette for? ─── */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Who is OpenPalette for?</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="rounded-2xl border border-[var(--border-default)] p-4 space-y-1.5 hover:bg-[var(--bg-surface)] transition-colors">
              <p className="text-sm font-bold text-[var(--text-primary)]">{a.title}</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Everything in one place ─── */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Everything in one place</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-[var(--border-default)] p-4 space-y-1.5 hover:bg-[var(--bg-surface)] transition-colors">
              <p className="text-lg">{t.icon}</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{t.name}</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Typical workflows ─── */}
      <section className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Typical workflows</h2>
        <div className="space-y-0">
          {WORKFLOW_STEPS.map((w, i) => (
            <div key={w.step} className="flex items-start gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <span className="size-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-base shrink-0">{w.icon}</span>
                {i < WORKFLOW_STEPS.length - 1 && <div className="w-px flex-1 bg-[var(--border-default)] mt-1" />}
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-bold text-[var(--text-primary)]">{w.step}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Common use cases ─── */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Common use cases</h2>
        <div className="flex flex-wrap gap-2">
          {USE_CASES.map((uc) => (
            <span key={uc} className="rounded-full border border-[var(--border-default)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors">{uc}</span>
          ))}
        </div>
      </section>

      {/* ─── Privacy by Design ─── */}
      <section className="rounded-2xl border border-[var(--border-default)] p-6 sm:p-8 space-y-5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Privacy by Design</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Everything runs locally", "No accounts needed", "No telemetry", "No analytics", "No cloud processing", "Browser-first workflow"].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <span className="text-green-500 text-sm">✓</span>
              <span className="text-sm text-[var(--text-secondary)]">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Export support ─── */}
      <section className="space-y-5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Export support</h2>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((e) => (
            <span key={e} className="rounded-full border border-[var(--border-default)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors">{e}</span>
          ))}
        </div>
      </section>

      {/* ─── Why OpenPalette? ─── */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Why OpenPalette?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Local First", desc: "Everything runs in your browser. No data ever leaves your machine. No servers, no sync, no cloud dependency." },
            { title: "Developer Friendly", desc: "Export directly to Tailwind, CSS, SCSS, JSON, SVG, and more. Generate production-ready design tokens from any color." },
            { title: "Accessibility Built In", desc: "Every palette includes WCAG contrast ratios, color blindness simulation, and AA/AAA compliance checks — no separate tool needed." },
            { title: "Production Ready", desc: "Generate complete design token scales, export framework-specific formats, and ship consistent color systems across your projects." },
            { title: "Open Source", desc: "MIT licensed. Full source available on GitHub. No paywalls, no Pro features, no usage limits." },
            { title: "Fast & Private", desc: "Zero latency. Every calculation happens on your device. No tracking scripts, no analytics, no telemetry." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--border-default)] p-5 space-y-2 hover:bg-[var(--bg-surface)] transition-colors">
              <p className="text-sm font-bold text-[var(--text-primary)]">{item.title}</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Technology ─── */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Technology</h2>
        <div className="flex flex-wrap gap-2">
          {["Next.js", "TypeScript", "Tailwind CSS", "Canvas APIs", "Local Storage"].map((tech) => (
            <span key={tech} className="rounded-full border border-[var(--border-default)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">{tech}</span>
          ))}
        </div>
      </section>

      {/* ─── Open Source ─── */}
      <section className="rounded-2xl border border-[var(--border-default)] p-6 sm:p-8 space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">Open Source</h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg">
          OpenPalette is MIT licensed and fully open source. Contributions, feature requests, and bug reports are welcome.
        </p>
        <div className="flex flex-wrap gap-2">
          {["GitHub", "MIT License", "Report Issues", "Feature Requests", "Contributions Welcome"].map((btn) => (
            <a key={btn} href={btn === "GitHub" ? "https://github.com/sparshsam/openpalette" : "https://github.com/sparshsam/openpalette/issues"} target="_blank" rel="noopener noreferrer"
              className={`rounded-full border border-[var(--border-default)] px-4 py-2 text-sm font-semibold transition-colors ${
                btn === "GitHub" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
              }`}>{btn}</a>
          ))}
        </div>
      </section>

      {/* ─── Creator ─── */}
      <section className="space-y-3">
        <p className="text-sm text-[var(--text-secondary)]">Developed and maintained by</p>
        <div className="flex items-center gap-4">
          <span className="size-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-lg font-bold text-[var(--accent)]">S</span>
          <div>
            <p className="text-lg font-bold text-[var(--text-primary)]">Sparsh Sam</p>
            <p className="text-xs text-[var(--text-muted)]">Design engineer building open-source creative tools.</p>
          </div>
          <a href="https://github.com/sparshsam" target="_blank" rel="noopener noreferrer"
            className="ml-auto rounded-full border border-[var(--border-default)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">GitHub</a>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <section className="border-t border-[var(--border-default)] pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
        <span>v0.8.10 · MIT License</span>
        <span>Built with ❤️ in Canada</span>
      </section>
    </div>
  );
}
