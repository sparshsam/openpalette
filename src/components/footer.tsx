import Link from "next/link";

const links = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-default)] px-6 py-10">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left */}
        <p className="text-xs text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-secondary)]">OpenPalette</span>{" "}
          — A local-first color studio. Made by{" "}
          <a
            href="https://github.com/sparshsam"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--accent)] transition-colors"
          >
            Sparsh Sam
          </a>
          .
        </p>

        {/* Right — links */}
        <nav className="flex items-center gap-5" aria-label="Footer">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
