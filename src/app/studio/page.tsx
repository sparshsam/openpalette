import { StudioShell } from "@/components/studio-shell";

export const metadata = {
  title: "OpenPalette — Color Studio",
  description:
    "Create palettes, gradients, tokens, accessible previews, and exports directly in your browser. A local-first, open-source color studio.",
  openGraph: {
    title: "OpenPalette — Color Studio",
    description:
      "Create palettes, gradients, tokens, accessible previews, and exports directly in your browser.",
    url: "https://palette.kovina.org/studio",
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
};

export default function StudioPage() {
  return <StudioShell />;
}
