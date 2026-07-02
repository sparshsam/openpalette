import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { HashRedirect } from "@/components/hash-redirect";

export const metadata: Metadata = {
  title: "OpenPalette — Color Studio for Designers and Developers",
  description:
    "A local-first, open-source color studio. Generate palettes, check WCAG accessibility, build token scales, extract colors from images, and export production-ready color systems. No account needed.",
  openGraph: {
    title: "OpenPalette — Color Studio",
    description:
      "A local-first, open-source color studio for designers and developers. Create, analyze, and export color systems in your browser.",
    url: "https://palette.kovina.org",
    siteName: "OpenPalette",
    type: "website",
    images: [{ url: "/icons/openpalette-og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPalette — Color Studio",
    description: "A local-first, open-source color studio.",
    images: ["/icons/openpalette-og-image.png"],
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "OpenPalette",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      description:
        "A local-first, open-source color studio for creating palettes, gradients, accessibility checks, exports, and design tokens.",
      url: "https://palette.kovina.org",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Person",
        name: "Sparsh Sam",
      },
      license: "https://opensource.org/licenses/MIT",
    }),
  },
};

export default function Home() {
  return (
    <>
      <HashRedirect />
      <LandingPage />
    </>
  );
}
