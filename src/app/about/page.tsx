import type { Metadata } from "next";
import Link from "next/link";
import pkg from "../../../package.json";

export const metadata: Metadata = {
  title: "About — OpenPalette",
  description:
    "OpenPalette is an open-source, local-first color workspace for designers and developers. Everything runs in your browser — no accounts, no tracking, no cloud.",
  openGraph: {
    title: "About — OpenPalette",
    description:
      "An open-source, local-first color workspace. No accounts, no tracking, no cloud.",
  },
};

const VERSION = pkg.version;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24 space-y-16 sm:space-y-20">

      {/* ─── Hero ─── */}
      <section className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-[1.08]">
          About OpenPalette
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
          An open-source, local-first color workspace for designers and developers.
          Everything runs in your browser — no accounts, no tracking, no cloud.
        </p>
      </section>

      {/* ─── 1. What is OpenPalette? ─── */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          What is OpenPalette?
        </h2>
        <div className="space-y-3">
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            OpenPalette is a color workspace. Generate palettes, build token scales,
            check accessibility, extract colors from images, create gradients, and
            preview color systems on real UI templates — all inside a single,
            shared workspace that runs entirely in your browser.
          </p>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Every computation happens locally on your device. Palette generation,
            color math, contrast ratios, vision simulations, export rendering —
            none of it touches a server. Your data stays in localStorage, on your machine.
          </p>
        </div>
      </section>

      {/* ─── 2. Why it exists ─── */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Why it exists
        </h2>
        <div className="space-y-3">
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Most color tools require accounts, subscriptions, or cloud connections.
            OpenPalette was built to address four motivations:
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Privacy", desc: "Your color data should never leave your machine. No accounts, no telemetry, no cloud dependency." },
              { label: "Permanence", desc: "A tool that doesn't require a subscription or a live server will work as long as you have a browser. Local-first means permanent access." },
              { label: "Openness", desc: "The source code is MIT-licensed and available on GitHub. Anyone can inspect, fork, or contribute. There is no paid tier — the entire application is free." },
              { label: "Professional workflows", desc: "Designers and developers need production-ready exports — CSS variables, Tailwind configs, JSON tokens, accessibility reports. OpenPalette ships them all." },
            ].map((item) => (
              <li key={item.label} className="flex gap-3 text-sm text-[var(--text-secondary)]">
                <span className="shrink-0 size-1.5 rounded-full bg-[var(--accent)] mt-2" />
                <span><strong className="text-[var(--text-primary)]">{item.label}.</strong> {item.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── 3. Design Philosophy ─── */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Design Philosophy
        </h2>
        <div className="space-y-3">
          {[
            { title: "Local-First", desc: "Zero server dependencies. Palette generation, color math, and rendering all happen client-side. No data leaves your machine." },
            { title: "Open Source", desc: "MIT-licensed. The full source is on GitHub. No paywalls, no pro features, no usage limits." },
            { title: "Privacy by Design", desc: "No accounts, no tracking, no telemetry. The application is designed so that user data never needs to be collected." },
            { title: "Fast", desc: "No network requests for core functionality. Palette generation and rendering are instantaneous — limited only by your device." },
            { title: "Simple", desc: "One shared workspace. Nine integrated tools. No complex menus or configuration. Open the page and start creating." },
            { title: "Production-Ready", desc: "Exports target real shipping formats: CSS Variables, Tailwind, JSON Design Tokens, SCSS, Android XML, iOS Swift, and more." },
            { title: "Maintainable", desc: "TypeScript throughout. A clean palette engine separated from presentation. Tests for core color math. Designed to last." },
          ].map((p) => (
            <div key={p.title}>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{p.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. Technical Foundation ─── */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Technical Foundation
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Next.js", desc: "Static-site generation and React server components for fast initial loads. The app shell is pre-rendered; the workspace loads client-side." },
            { title: "TypeScript", desc: "The entire codebase is TypeScript — strict mode. Color engines, palette math, and export formatters are typed and tested." },
            { title: "Browser-First", desc: "All color computation uses browser APIs: Canvas for image extraction, Crypto for IDs, localStorage for persistence. No backend required." },
            { title: "Shared Workspace", desc: "A single palette context (`WorkspaceProvider`) connects all tools. Changes in Studio propagate to Visualizer, Contrast, Accessibility, and Export immediately." },
            { title: "Local Storage", desc: "Palettes, snapshots, recently generated and opened palettes persist in localStorage between sessions. No sync, no server, no accounts." },
            { title: "Responsive", desc: "The interface adapts from mobile to ultrawide. The toolbar, tab navigation, and section layouts reflow across breakpoints without hiding functionality." },
          ].map((t) => (
            <div key={t.title} className="rounded-xl border border-[var(--border-default)] p-4 space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{t.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. About Kovina ─── */}
      <section className="rounded-2xl border border-[var(--border-default)] p-6 sm:p-8 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          About Kovina
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg">
          OpenPalette is part of the Kovina ecosystem — a collection of free and
          open-source applications built around a shared philosophy: local-first,
          privacy-respecting, and professionally capable software that runs
          entirely in the browser.
        </p>
        <a
          href="https://www.kovina.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full border border-[var(--border-default)] px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
        >
          kovina.org →
        </a>
      </section>

      {/* ─── 6. Open Source ─── */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Open Source
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg">
          OpenPalette is MIT-licensed and fully open source. The complete source
          code is available on GitHub. Contributions, bug reports, and feature
          requests are welcome.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://github.com/sparshsam/openpalette"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[var(--accent)] text-white px-5 py-2 text-sm font-semibold hover:brightness-110 transition"
          >
            View on GitHub
          </a>
          <a
            href="https://github.com/sparshsam/openpalette/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[var(--border-default)] px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition"
          >
            Report an Issue
          </a>
        </div>
      </section>

      {/* ─── 7. Version & Colophon ─── */}
      <section className="border-t border-[var(--border-default)] pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
        <span>v{VERSION} · MIT License</span>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-[var(--accent)] transition">Home</Link>
          <a href="https://github.com/sparshsam/openpalette" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition">GitHub</a>
        </div>
      </section>

    </div>
  );
}
