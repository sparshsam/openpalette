import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — OpenPalette",
  description: "Terms of service for using OpenPalette, a local-first color studio.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-28 sm:py-32 space-y-10">
      <section>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Last updated: June 2026
        </p>
      </section>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">1. Acceptance of Terms</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            By accessing or using OpenPalette, you agree to be bound by these
            terms. If you do not agree, do not use the application.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">2. Description of Service</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            OpenPalette is a local-first color studio that runs entirely in your browser.
            It provides tools for generating palettes, checking accessibility, creating
            gradients, exporting design tokens, and previewing color systems.
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            No accounts, registration, or personal information are required. All
            processing happens on your device. No data is sent to any server.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">3. Local-First & Privacy</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            OpenPalette is designed to be local-first. Your palettes, settings, and
            preferences are stored exclusively in your browser&apos;s localStorage.
            We do not collect, transmit, or store any personal data on any server.
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            There are no cookies, no analytics, no telemetry, and no tracking
            scripts. The application is fully functional without an internet
            connection after the initial page load.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">4. Open Source & License</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            OpenPalette is open-source software released under the
            <a href="https://github.com/sparshsam/openpalette/blob/main/LICENSE" target="_blank" rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline mx-1">MIT License</a>.
            You are free to use, modify, and distribute the software in accordance
            with that license.
          </p>
          <p className="mt-2 text-[var(--text-secondary)]">
            The source code is publicly available on
            <a href="https://github.com/sparshsam/openpalette" target="_blank" rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline mx-1">GitHub</a>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">5. User Responsibilities</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            You agree not to misuse the application or attempt to disrupt its
            functionality. Since the application runs locally, misuse is
            limited to your own device.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">6. Intellectual Property</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            The OpenPalette name, brand, and visual identity are owned by the
            project maintainer. The code is licensed under MIT; the brand assets
            are not.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">7. Disclaimer of Warranties</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            OpenPalette is provided &ldquo;as is&rdquo; without warranty of any kind,
            express or implied. The software runs entirely in your browser and
            does not transmit data to any server.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">8. Limitation of Liability</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            In no event shall the authors or contributors be liable for any
            claim, damages, or other liability arising from the use of the
            software.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">9. Changes to Terms</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            These terms may be updated at any time. Continued use of the
            application after changes constitutes acceptance of the new terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">10. Contact</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            For questions about these terms, open an issue on
            <a href="https://github.com/sparshsam/openpalette" target="_blank" rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline mx-1">GitHub</a>
            or visit
            <a href="https://www.kovina.org" target="_blank" rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline mx-1">Kovina</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
