"use client";

export function StudioLinks() {
  const links: { label: string; tab: string; desc: string }[] = [
    { label: "Image Picker", tab: "import", desc: "Extract colors from photos" },
    { label: "Contrast Checker", tab: "accessibility", desc: "WCAG compliance" },
    { label: "Palette Visualizer", tab: "visualizer", desc: "Preview on real designs" },
    { label: "Color Picker", tab: "studio", desc: "Full color editor" },
    { label: "Tailwind Colors", tab: "library", desc: "Framework exports" },
    { label: "Gradient Maker", tab: "gradient", desc: "Linear & radial" },
    { label: "Gradient Palette", tab: "gradient", desc: "Palette from gradient" },
    { label: "Image Converter", tab: "studio", desc: "Format conversion" },
    { label: "SVG Recolor", tab: "studio", desc: "Recolor SVG assets" },
    { label: "Collage Maker", tab: "library", desc: "Layout compositions" },
    { label: "Font Tools", tab: "library", desc: "Typography helpers" },
    { label: "AI Assistant", tab: "studio", desc: "AI color suggestions" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3">
      <h3 className="text-xs font-bold tracking-wider uppercase text-secondary">Tools</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {links.map((link) => (
          <button
            key={link.label}
            className="rounded-2xl border border-default p-3 text-left hover-bg-muted transition text-secondary hover:text-page"
            onClick={() => {
              // Navigate to the tab via a custom event so OpenPaletteApp can listen
              window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: link.tab } }));
            }}
          >
            <p className="text-sm font-semibold">{link.label}</p>
            <p className="text-[10px] text-muted mt-0.5">{link.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
