import { getReadableTextColor, type ExportFormat } from "@/lib/palette";

export function drawSwatches(context: CanvasRenderingContext2D, width: number, height: number, colors: string[]) {
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);
  const swatchWidth = width / colors.length;
  colors.forEach((hex, index) => {
    context.fillStyle = hex;
    context.fillRect(index * swatchWidth, 0, swatchWidth, height * 0.78);
    context.fillStyle = "#111827";
    context.font = "28px monospace";
    context.fillText(hex, index * swatchWidth + 24, height - 70);
  });
}

export function createSimplePdf(colors: string[]) {
  const lines = ["OpenPalette palette sheet", "", ...colors.map((hex, index) => `${index + 1}. ${hex}`)];
  const stream = `BT /F1 24 Tf 72 740 Td (${lines.join(") Tj T* (")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f "];
  const body = objects
    .map((object, index) => {
      xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
      const entry = `${index + 1} 0 obj\n${object}\nendobj\n`;
      offset += entry.length;
      return entry;
    })
    .join("");
  const table = `xref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  return `%PDF-1.4\n${body}${table}`;
}

export function extensionFor(format: ExportFormat) {
  if (format === "Tailwind") {
    return "tailwind.config.js";
  }

  if (format === "Tokens") {
    return "tokens.json";
  }

  if (format === "Style Dictionary") {
    return "style-dictionary.tokens.json";
  }

  return format.toLowerCase();
}

export function tokenPreviewRows(colors: string[]) {
  return colors.map((hex, index) => ({
    name: `semantic.${index === 0 ? "ink" : index === 1 ? "muted" : index === 2 ? "accent" : index === 3 ? "surface" : `palette-${index + 1}`}`,
    value: hex,
    text: getReadableTextColor(hex),
  }));
}
