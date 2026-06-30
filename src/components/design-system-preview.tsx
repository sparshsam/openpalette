"use client";

import { useState } from "react";
import type { SemanticTokens } from "@/lib/palette/token-engine";
import { getReadableTextColor } from "@/lib/palette";

type PreviewSection = "colors" | "buttons" | "cards" | "forms" | "alerts" | "badges" | "navigation" | "typography";

export function DesignSystemPreview({ tokens, light }: { tokens: SemanticTokens; light: boolean }) {
  const [section, setSection] = useState<PreviewSection>("buttons");

  const t = tokens;
  const sections: { id: PreviewSection; label: string }[] = [
    { id: "buttons", label: "Buttons" },
    { id: "cards", label: "Cards" },
    { id: "forms", label: "Forms" },
    { id: "alerts", label: "Alerts" },
    { id: "badges", label: "Badges" },
    { id: "navigation", label: "Nav" },
    { id: "typography", label: "Type" },
    { id: "colors", label: "Colors" },
  ];

  const bg = t.background || (light ? "#FFFFFF" : "#0F0F0F");
  const textColor = t.text || (light ? "#111111" : "#F5F5F5");

  return (
    <div className="rounded-2xl border border-default overflow-hidden" style={{ backgroundColor: bg, color: textColor }}>
      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 p-3 border-b" style={{ borderColor: t.border }}>
        {sections.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
              section === s.id ? "text-white" : "opacity-60 hover:opacity-100"
            }`}
            style={{ backgroundColor: section === s.id ? t.accent : "transparent" }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {section === "colors" && <ColorSwatches tokens={t} />}
        {section === "buttons" && <ButtonPreviews tokens={t} />}
        {section === "cards" && <CardPreviews tokens={t} />}
        {section === "forms" && <FormPreviews tokens={t} />}
        {section === "alerts" && <AlertPreviews tokens={t} />}
        {section === "badges" && <BadgePreviews tokens={t} />}
        {section === "navigation" && <NavPreview tokens={t} />}
        {section === "typography" && <TypePreview tokens={t} />}
      </div>
    </div>
  );
}

function ColorSwatches({ tokens }: { tokens: SemanticTokens }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {Object.entries(tokens).map(([k, v]) => (
        <div key={k} className="rounded-xl overflow-hidden border" style={{ borderColor: tokens.border }}>
          <div className="h-12" style={{ backgroundColor: v }} />
          <div className="p-2 space-y-0.5" style={{ backgroundColor: tokens.surface }}>
            <p className="text-xs font-semibold capitalize" style={{ color: tokens.text }}>{k}</p>
            <p className="text-[10px] font-mono" style={{ color: tokens.muted }}>{v}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ButtonPreviews({ tokens }: { tokens: SemanticTokens }) {
  const btn = (label: string, bg: string, text: string) => (
    <button className="rounded-full px-5 py-2 text-xs font-semibold transition hover:brightness-110 bounce-press" style={{ backgroundColor: bg, color: text }}>{label}</button>
  );
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.muted }}>Button Styles</p>
      <div className="flex flex-wrap gap-2">
        {btn("Primary", tokens.primary, getReadableTextColor(tokens.primary))}
        {btn("Secondary", tokens.secondary, getReadableTextColor(tokens.secondary))}
        {btn("Accent", tokens.accent, getReadableTextColor(tokens.accent))}
        {btn("Success", tokens.success, "#FFFFFF")}
        {btn("Warning", tokens.warning, "#111111")}
        {btn("Error", tokens.error, "#FFFFFF")}
        {btn("Outline", "transparent", tokens.text)}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider mt-4" style={{ color: tokens.muted }}>Sizes</p>
      <div className="flex flex-wrap items-center gap-2">
        <button className="rounded-full px-3 py-1 text-[10px] font-semibold" style={{ backgroundColor: tokens.primary, color: getReadableTextColor(tokens.primary) }}>Small</button>
        <button className="rounded-full px-5 py-2 text-xs font-semibold" style={{ backgroundColor: tokens.primary, color: getReadableTextColor(tokens.primary) }}>Default</button>
        <button className="rounded-full px-6 py-2.5 text-sm font-semibold" style={{ backgroundColor: tokens.primary, color: getReadableTextColor(tokens.primary) }}>Large</button>
      </div>
    </div>
  );
}

function CardPreviews({ tokens }: { tokens: SemanticTokens }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-2xl p-4 space-y-3 border" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
          <div className="h-20 rounded-xl" style={{ backgroundColor: tokens.primary }} />
          <p className="text-sm font-semibold" style={{ color: tokens.text }}>Card Title {i}</p>
          <p className="text-xs" style={{ color: tokens.muted }}>This is a sample card showing how your semantic tokens render in a card component.</p>
          <div className="flex gap-2">
            <button className="rounded-full px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: tokens.accent, color: getReadableTextColor(tokens.accent) }}>Action</button>
            <button className="rounded-full px-4 py-1.5 text-xs font-semibold border" style={{ borderColor: tokens.border, color: tokens.text }}>Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormPreviews({ tokens }: { tokens: SemanticTokens }) {
  return (
    <div className="space-y-3 max-w-sm">
      {["Name", "Email", "Password"].map((f) => (
        <div key={f} className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: tokens.text }}>{f}</label>
          <input className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border"
            style={{ backgroundColor: tokens.background, color: tokens.text, borderColor: tokens.border }}
            placeholder={`Enter ${f.toLowerCase()}...`} readOnly />
        </div>
      ))}
      <button className="rounded-full px-5 py-2.5 text-xs font-semibold w-full" style={{ backgroundColor: tokens.primary, color: getReadableTextColor(tokens.primary) }}>Submit</button>
    </div>
  );
}

function AlertPreviews({ tokens }: { tokens: SemanticTokens }) {
  const alerts = [
    { label: "Success", bg: tokens.success, text: "Operation completed successfully." },
    { label: "Warning", bg: tokens.warning, text: "Please review this before continuing." },
    { label: "Error", bg: tokens.error, text: "Something went wrong. Try again." },
    { label: "Info", bg: tokens.info, text: "Here's some useful information." },
  ];
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div key={a.label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: a.bg + "20", borderLeft: `3px solid ${a.bg}` }}>
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: a.bg }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: a.bg }}>{a.label}</p>
            <p className="text-xs mt-0.5" style={{ color: tokens.text }}>{a.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BadgePreviews({ tokens }: { tokens: SemanticTokens }) {
  const badges = [
    { label: "New", bg: tokens.success }, { label: "Beta", bg: tokens.warning },
    { label: "Error", bg: tokens.error }, { label: "Info", bg: tokens.info },
    { label: "Pro", bg: tokens.accent }, { label: "Draft", bg: tokens.muted },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <span key={b.label} className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: b.bg, color: getReadableTextColor(b.bg) }}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

function NavPreview({ tokens }: { tokens: SemanticTokens }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: tokens.border }}>
      <div className="flex items-center gap-4 px-4 py-3 border-b" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
        <span className="text-sm font-bold" style={{ color: tokens.primary }}>Brand</span>
        <div className="flex gap-3 ml-auto">
          {["Home", "Products", "About"].map((n) => (
            <span key={n} className="text-xs font-semibold cursor-pointer" style={{ color: n === "Home" ? tokens.accent : tokens.muted }}>{n}</span>
          ))}
        </div>
      </div>
      <div className="p-6 text-center">
        <p className="text-lg font-bold" style={{ color: tokens.text }}>Navigation Preview</p>
        <p className="text-xs mt-1" style={{ color: tokens.muted }}>Your semantic tokens in a nav bar layout</p>
      </div>
    </div>
  );
}

function TypePreview({ tokens }: { tokens: SemanticTokens }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.muted }}>Typography Scale</p>
      {[
        { tag: "h1", size: "text-2xl", weight: "font-black", text: "Heading 1" },
        { tag: "h2", size: "text-xl", weight: "font-bold", text: "Heading 2" },
        { tag: "h3", size: "text-lg", weight: "font-semibold", text: "Heading 3" },
        { tag: "body", size: "text-sm", weight: "font-normal", text: "Body text — The quick brown fox jumps over the lazy dog. Body copy uses the text token for readability." },
        { tag: "small", size: "text-xs", weight: "font-normal", text: "Small / caption text uses the muted token for secondary information." },
      ].map((t) => (
        <div key={t.tag} style={{ color: t.tag === "small" ? tokens.muted : tokens.text }}
          className={`${t.size} ${t.weight}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
