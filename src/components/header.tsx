"use client";

import Link from "next/link";
import { useTheme } from "./theme-provider";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-[#fff5fc]/95 dark:bg-[#2d001e]/95 backdrop-blur-md border-b border-[rgba(26,0,26,0.08)] dark:border-[rgba(255,224,245,0.06)]">
      <div className="mx-auto flex items-center justify-between max-w-7xl px-6 h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-[#3a0d2b] dark:text-[#ffe0f5] hover:text-[#ff66c4] dark:hover:text-[#ff85d0] transition-colors"
        >
          OpenPalette
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1" aria-label="Primary">
          <Link
            href="/about"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#6b3a5a] dark:text-[#d4a0c0] hover:bg-[#f0d6e8] dark:hover:bg-[#3d0a28] hover:text-[#3a0d2b] dark:hover:text-[#ffe0f5] transition-colors"
          >
            About
          </Link>
        </nav>
      </div>

      {/* Theme toggle — fixed top-right */}
      <button
        onClick={toggle}
        className="fixed top-3 right-3 z-[60] size-11 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:bg-[var(--bg-surface-muted)] transition-colors"
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
    </header>
  );
}
