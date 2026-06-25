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
