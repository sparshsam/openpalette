"use client";

import Link from "next/link";
import { useTheme } from "./theme-provider";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-base)]/90 backdrop-blur-md border-b border-[var(--border-default)]">
      <div className="mx-auto flex items-center justify-between max-w-7xl px-6 h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
        >
          OpenPalette
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1" aria-label="Primary">
          <Link
            href="/about"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Theme toggle (far right) */}
        <button
          onClick={toggle}
          className="pill pill-secondary text-xs"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}
