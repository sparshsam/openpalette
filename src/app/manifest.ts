import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenPalette",
    short_name: "OpenPalette",
    description:
      "A local-first, open-source design color platform for palettes, gradients, accessibility, visualizers, and exports.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F4EF",
    theme_color: "#161412",
    categories: ["design", "developer", "productivity", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
