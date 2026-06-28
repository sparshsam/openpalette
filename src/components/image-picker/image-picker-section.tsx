"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  createPalette,
  extractPaletteFromPixels,
  minPaletteSize,
  maxPaletteSize,
  type ExtractionMode,
} from "@/lib/palette";

const EXTRACTION_MODES: { id: ExtractionMode; label: string }[] = [
  { id: "balanced", label: "Balanced" },
  { id: "vibrant", label: "Vibrant" },
  { id: "muted", label: "Muted" },
  { id: "pastel", label: "Pastel" },
  { id: "dark", label: "Dark" },
  { id: "high-contrast", label: "High Contrast" },
];

export function ImagePickerSection() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [size, setSize] = useState(5);
  const [mode, setMode] = useState<ExtractionMode>("balanced");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    fileRef.current = file;
    setImageUrl(URL.createObjectURL(file));
    await extract(file, size);
  }

  async function extract(file: File, count: number) {
    try {
      const bm = await createImageBitmap(file);
      const can = document.createElement("canvas");
      const ctx = can.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const ms = 300;
      const sc = Math.min(ms / bm.width, ms / bm.height, 1);
      can.width = Math.max(1, Math.round(bm.width * sc));
      can.height = Math.max(1, Math.round(bm.height * sc));
      ctx.drawImage(bm, 0, 0, can.width, can.height);
      const pixels = ctx.getImageData(0, 0, can.width, can.height).data;
      const colors = extractPaletteFromPixels(pixels, count, mode);
      if (colors.length >= 2) setExtracted(colors);
    } catch { /* ignore */ }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }

  function handleBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleSizeChange(n: number) {
    const clamped = Math.max(minPaletteSize, Math.min(maxPaletteSize, n));
    setSize(clamped);
    if (fileRef.current) extract(fileRef.current, clamped);
  }

  function openInStudio() {
    const colors = createPalette(extracted, extracted.length);
    window.dispatchEvent(new CustomEvent("op-load-palette", { detail: { colors, mode: "Random" } }));
    window.dispatchEvent(new CustomEvent("op-navigate", { detail: { tab: "studio" } }));
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-page">Image Palette Extraction</h1>
        <p className="text-sm sm:text-base text-secondary">Extract beautiful color palettes from your images.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: controls + palette */}
        <div className="space-y-6">
          {/* Image upload */}
          <div
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer
              ${dragging ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-default hover:border-[var(--accent)]"}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleBrowse} />
            <p className="text-sm text-secondary">
              {dragging ? "Drop your image here" : "Drop an image or click to browse"}
            </p>
            <p className="text-xs text-muted mt-1">Supports JPG, PNG, WebP</p>
          </div>

          {/* Extracted palette */}
          {extracted.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Extracted Colors</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSizeChange(size - 1)} disabled={size <= minPaletteSize}
                      className="size-7 flex items-center justify-center rounded-full text-sm text-secondary hover:text-[var(--accent)] disabled:opacity-30">−</button>
                    <span className="text-sm font-semibold text-page tabular-nums w-5 text-center">{extracted.length}</span>
                    <button onClick={() => handleSizeChange(size + 1)} disabled={size >= maxPaletteSize}
                      className="size-7 flex items-center justify-center rounded-full text-sm text-secondary hover:text-[var(--accent)] disabled:opacity-30">+</button>
                  </div>
                </div>
                <div className="flex rounded-xl overflow-hidden h-12 border border-default">
                  {extracted.slice(0, size).map((hex, i) => (
                    <div key={i} className="flex-1 relative group" style={{ backgroundColor: hex }}>
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: getReadableTextColor(hex) }}>{hex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extraction mode selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Mode</span>
                {EXTRACTION_MODES.map((m) => (
                  <button key={m.id} onClick={() => { setMode(m.id as ExtractionMode); if (fileRef.current) extract(fileRef.current, size); }}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${mode === m.id ? "bg-[var(--accent)] text-white" : "border border-default text-secondary hover:text-[var(--accent)]"}`}
                  >{m.label}</button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button onClick={openInStudio}
                  className="rounded-full bg-[var(--accent)] text-white px-5 py-2 text-sm font-semibold hover:brightness-110 transition">
                  Open in Studio
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(extracted.slice(0, size).join(", "));
                }} className="rounded-full border border-default px-5 py-2 text-sm font-semibold text-secondary hover:text-[var(--accent)] transition">
                  Copy HEX
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: image preview */}
        <div className="rounded-2xl border border-default overflow-hidden bg-[var(--bg-surface)] min-h-[300px] flex items-center justify-center">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain max-h-[500px]" />
          ) : (
            <p className="text-sm text-muted">No image selected</p>
          )}
        </div>
      </div>

    </section>
  );
}

function getReadableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 128 ? "#111111" : "#F9FAFB";
}
