import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — OpenPalette",
  description: "Privacy policy for OpenPalette.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-28 sm:py-32 space-y-10">
      <section>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Last updated: June 2026
        </p>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Local by Default</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            OpenPalette runs entirely in your browser. No data is sent to any
            server. Palette generation, image extraction, accessibility
            calculations, and exports all happen client-side.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">No Tracking</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            This application does not use cookies, analytics, telemetry, or any
            form of user tracking. There are no third-party scripts.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Local Storage</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            Your palette library, history, and theme preference are stored in
            your browser&#39;s local storage. This data never leaves your device.
            You can clear it at any time from your browser settings.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">No Accounts</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            OpenPalette does not require or support user accounts. There is no
            authentication, no profiles, and no cloud sync.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Contact</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            If you have questions about this policy, open an issue on{" "}
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
        </div>
      </section>
    </div>
  );
}
