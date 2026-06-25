import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenPalette — Color Studio",
    short_name: "OpenPalette",
    description:
      "A local-first color studio for palettes, gradients, accessibility, visualizers, and exports.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    categories: ["design", "developer", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/openpalette-icon.png",
        sizes: "1024x1024",
        type: "image/png",
      },
      {
        src: "/icons/openpalette-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
