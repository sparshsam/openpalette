import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — OpenPalette",
  description: "Terms of use for OpenPalette — a local-first, open-source color studio.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-28 sm:py-32 space-y-10">
      <section>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Terms of Use
        </h1>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Last updated: June 2026
        </p>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">1. No Warranty</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            OpenPalette is provided &ldquo;as is&rdquo; without warranty of any kind, express
            or implied. The software runs entirely in your browser and does not
            transmit data to any server.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">2. No Liability</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            In no event shall the authors be liable for any claim, damages, or
            other liability arising from the use of the software.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">3. Open Source</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            OpenPalette is open-source software released under the MIT License.
            You are free to use, modify, and distribute it in accordance with
            that license.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">4. No Data Collection</h2>
          <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
            OpenPalette does not collect, store, or transmit any personal data.
            All palette data stays in your browser&#39;s local storage and can be
            cleared at any time.
          </p>
        </div>
      </section>
    </div>
  );
}
