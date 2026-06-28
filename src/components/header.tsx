"use client";

import Link from "next/link";
import { useTheme } from "./theme-provider";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-default)]">
        <div className="mx-auto flex items-center justify-between max-w-7xl px-6 pr-16 h-14">
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
        </div>
      </header>

      {/* Theme toggle — fixed top-right, visually matched to header */}
      <button
        onClick={toggle}
        className="fixed top-2.5 right-3 z-[60] size-11 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)] shadow-sm transition-colors"
        suppressHydrationWarning
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>
    </>
  );
}
