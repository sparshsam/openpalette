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
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPalette — Color Studio",
    description: "A local-first, open-source color studio.",
  },
};

export default function StudioPage() {
  return <StudioShell />;
}
