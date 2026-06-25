import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — OpenPalette",
  description: "A local-first, open-source color studio by Sparsh Sam.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-28 sm:py-40 space-y-14">
      {/* Hero */}
      <section>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight">
          <span className="text-[var(--accent)]">OpenPalette</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
          A local-first, open-source color studio for designers and developers.
          Create palettes, gradients, design tokens, accessibility previews, and
          visualizer mockups — all in your browser. No accounts, no tracking, no
          cloud.
        </p>
      </section>

      {/* Machine metaphor */}
      <section className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <span className="text-6xl sm:text-7xl font-black text-[var(--accent)]">01</span>
          <div>
            <h2 className="text-2xl font-bold">The Color Machine</h2>
            <p className="mt-3 text-[var(--text-secondary)] max-w-lg leading-relaxed">
              OpenPalette is a palette machine, not a dashboard. You feed it a
              harmony mode, it generates a color system. You lock what works,
              tune the channels, extract from images, and export tokens for your
              design tools. Everything happens on-device.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:mt-12">
          <span className="text-6xl sm:text-7xl font-black text-[var(--accent)]">02</span>
          <div>
            <h2 className="text-2xl font-bold">Privacy by Design</h2>
            <p className="mt-3 text-[var(--text-secondary)] max-w-lg leading-relaxed">
              Zero data leaves your browser. Palette generation, image
              extraction, accessibility checks, and exports all run locally.
              No accounts. No analytics. No telemetry.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:mt-12">
          <span className="text-6xl sm:text-7xl font-black text-[var(--accent)]">03</span>
          <div>
            <h2 className="text-2xl font-bold">Built for Workflow</h2>
            <p className="mt-3 text-[var(--text-secondary)] max-w-lg leading-relaxed">
              Export to CSS, Tailwind, SCSS, SVG, JSON, or PNG. Preview your
              palette as a website UI, dashboard, or form. Simulate color vision
              deficiencies. Generate gradients. Save and organize your palettes
              in a local library. All of it, zero latency.
            </p>
          </div>
        </div>
      </section>

      {/* Brand statement */}
      <section className="border-t border-[var(--border-default)] pt-10">
        <p className="text-lg sm:text-xl leading-relaxed text-[var(--text-secondary)] max-w-xl">
          OpenPalette is developed and maintained by{" "}
          <a
            href="https://github.com/sparshsam"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-primary)] underline decoration-[var(--accent)] underline-offset-4 hover:text-[var(--accent)] transition-colors"
          >
            Sparsh Sam
          </a>
          . Source available on{" "}
          <a
            href="https://github.com/sparshsam/openpalette"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-primary)] underline decoration-[var(--accent)] underline-offset-4 hover:text-[var(--accent)] transition-colors"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </div>
  );
}
