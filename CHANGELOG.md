# Changelog

All notable changes to OpenPalette will be documented in this file.

## v0.9.4 — Release Candidate Hardening

### QA & Polish
- Complete end-to-end audit of all 10 pages
- Removed dead code and unused imports
- Added focus ring styles (`:focus-visible`) across all interactive elements
- Redesigned error boundary with friendly recovery UI
- Added skeleton shimmer animation for loading states
- Added `keywords` metadata for SEO
- Fixed all ESLint warnings (0 errors, 0 warnings)
- Full build/tests passing clean

## v0.9.3 — Production Polish

### Settings & Shortcuts
- New **Settings** page (tab): theme toggle, default color count, default export format, import/export settings, reset, About
- New **Keyboard Shortcuts** reference modal (accessible via `?` key or Settings)

### Polish
- Consistent focus rings on all interactive controls
- Skeleton loading animation CSS
- Improved error boundary with friendly copy and recovery
- Enhanced SEO metadata with keywords

## v0.9.2 — Design System & Export Intelligence

### Token System
- Semantic token generation: primary, secondary, accent, success, warning, error, info, background, surface, border, text, muted
- 7 naming presets: Tailwind, Material, Bootstrap, Fluent, Apple, OpenPalette, Custom

### Export Expansion
- W3C Design Tokens, Style Dictionary, Figma Variables, Flutter, React Native
- CSS Variables, SCSS, Tailwind v4, Android XML, iOS Swift, JSON
- 5 export presets: Web, Mobile, Design System, Figma, Developer Bundle
- Export Preview modal with copy/download, search, category filters, favorites, recent formats
- Token group selection for targeted exports

### Design System Preview
- Visual component gallery: buttons, cards, forms, alerts, badges, navigation, typography, color swatches
- All rendered using generated semantic tokens

### Import
- Paste W3C/JSON token files to load into workspace

## v0.9.1 — Workspace Intelligence

### Palette Health
- 8-dimension health score (0-100): harmony, accessibility, contrast, vibrancy, balance, diversity, UI readiness, gradient quality
- SVG gauge, breakdown bars, visual analytics tabs

### Recommendations
- Automatic suggestions with Apply buttons: improve accessibility, vibrancy, saturation, dark/light mode, balance, accent, harmony
- Hue distribution, saturation/lightness buckets, warm/cool balance, contrast heatmap

### Compare Mode
- 4 preset palettes, side-by-side preview, similarity %, health comparison

### Snapshots
- Save/restore/rename/delete workspace snapshots from toolbar

### Expanded Command Palette
- Quick actions: Generate Harmony, Improve Palette, Export Tokens, Open Visualizer/Accessibility/Gradient, Share URL, Save

## v0.9.0 — Workspace Foundation

### Architecture
- `WorkspaceProvider` / `useWorkspace()` — global shared palette state replacing per-section `usePalette()`
- All 9 sections read from the same palette; changes propagate instantly
- Undo/redo stacks (50 deep) + redo support
- Persists to localStorage

### Unified Toolbar
- Shared bottom toolbar replaces 4 per-section toolbars
- Palette preview strip, Generate, Copy, Save, Share, Undo/Redo, inspector

### Keyboard Workflow
- Space=generate, Ctrl+Z=undo, Ctrl+Shift+Z=redo, C=copy, /=command palette
- Global handler — no input interference

## v0.8.10 — Mobile UX Polish

### Responsive Fixes
- Bottom toolbars: overflow-x-auto on Visualizer, Tokens, Gradient, A11y
- Tokens shade grid: responsive columns (6/9/11)
- Colors grid: 2 columns at mobile
- Studio toolbar notice hidden on mobile
- Nav scroll arrows: 40px touch targets at mobile
- Swatch min-width: 44px touch targets

### Color Improvements
- Color detail new tab routing fixed (preserves hash)
- Color DB expanded: 32 → 57 entries (added Turquoise, Tomato, Sky Blue, etc.)
- Curated swatches: ~131 → 97 distinct colors

### Android Fixes
- Replaced `crypto.randomUUID()` with `createId()` (fails on non-HTTPS)
- Generate labels always visible on mobile toolbar

### Archive
- Themes and Library tabs removed (preserved in git)

## v0.8.9 - 2026-06-29

### feat: Accessibility Studio — complete redesign with theme tester, contrast matrix, 5-mode color blindness, typography previews

- **Accessibility Studio** — Complete redesign from a utility page to a polished editorial experience. Large hero, spacious layout, semantic tokens.
- **Overview scores** — 4 score cards: Overall (0–100), AA pairs, AAA pairs, Failing pairs. Color-coded (green/amber/red).
- **Live previews** — 5 color preview cards showing sample text with contrast rating and AA/AAA status.
- **Theme Pair Tester** — Side-by-side Light/Dark mode evaluator with independent bg/text color pickers, live preview, and AA/AAA ratio display.
- **Contrast Matrix** — Sortable grid (Weakest/Strongest) showing all pair contrasts with ratio, AA/AAA badges, and copy-on-click for each hex.
- **Color Blindness Studio** — 4 simulated vision modes (Protanopia, Deuteranopia, Tritanopia, Achromatopsia) shown as side-by-side swatch strips.
- **Suggestions** — Weakest pair auto-detected with replacement suggestion and Copy button.
- **Typography testing** — 6 type sizes (Heading through Disabled) showing AA/AAA pass/fail per size for each palette color on white.
- **Audit checklist** — 5-item checklist (focus visibility, keyboard nav, semantic color, contrast compliance, interactive element visibility).
- **Extracted to own file** — Old inline AccessibilitySection removed from openpalette-app.tsx.

## v0.8.7 - 2026-06-28

### feat: Design Tokens page — token scale generator, UI previews, developer exports

- **New Tokens tab** — Generate complete 11-step design token scales (50–950) from any base color using HSL-based interpolation with perceptually smooth lightness ramps.
- **Token display** — Large interactive swatch strip with hover shade labels, 11-column shade grid with copy-on-click.
- **Live UI Preview** — 12 preview components rendered with the token scale: landing page hero, dashboard card, sidebar/navigation, buttons & controls, form elements, table, alerts (info/success/error), pricing card. Light/Dark preview toggle affects previews only.
- **Developer exports** — 6 formats: CSS Variables, Tailwind Config, JSON, SCSS, Android XML, iOS Swift. Each copies to clipboard with toast confirmation.
- **Bottom toolbar** — Token strip, shade count, Generate, Copy full scale, Export panel toggle.
- **Shareable URLs** — `/tokens/2d518f` loads the token scale for that color.
- **Spacebar support** — Generates a new random base color (with input guard).
- **Tab navigation** — 11 tabs, scrollable nav with arrows.

## v0.8.6 - 2026-06-28

### feat: Colors library with 150 swatches + full Color Detail page

- **New Colors tab** — Searchable color library with 150 curated colors, 12 category chips (Red through Black), large swatches with name/HEX reveal on hover, subtle Favorite/Open Detail actions. Spacebar randomizes view.
- **Color Detail page** — Opens in new tab at `#/colors/HEX`. Sticky section nav: Overview, Conversion, About, Variations, Harmonies, Accessibility, Similar Colors, Libraries, Palettes.
- **Overview** — Large color hero, 4 quick fields (HEX/RGB/HSL/CMYK), Copy HEX, Open in Studio, Favorite.
- **Conversion** — 10 color spaces: HEX, RGB, CMYK, HSL, HSV, LAB, XYZ, LCH, LUV, HWB — all copyable.
- **About** — Auto-generated description, psychology, meaning, branding, UI usage, applications.
- **Variations** — 5 types: shades, tints, tones, hues, temperature — continuous swatch strips with hover HEX reveal.
- **Harmonies** — 6 modes: Analogous, Complementary, Split Comp, Triadic, Tetradic, Square — each copyable.
- **Accessibility** — 4 color-blind simulations, white/black contrast previews with WCAG ratings.
- **Similar Colors** — 12 nearest matches with name, HEX, similarity score, copyable.
- **Libraries** — Nearest CSS named color and Tailwind equivalent with approx labels.
- **Palettes** — 5 auto-generated palettes using the color, each with Copy and Open in Studio.
- **Every swatch copies to clipboard** — Uses global toast system ("Copied #HEX").

## v0.8.5 - 2026-06-28

### feat: Visualizer redesign — template gallery with category filters

- **Palette Visualizer** — Complete redesign around a responsive gallery of 7 live preview templates: Website, Mobile, Dashboard, Brand, Typography, Poster, Social.
- **Category filters** — All, Mobile/Web UI, Branding, Typography, Dashboard, Poster, Social — each filtering the gallery.
- **3-column desktop gallery** — Each template card renders the real palette on a realistic mockup using existing VisualizerPreview components.
- **Sticky bottom toolbar** — Palette strip, color count, Generate, Open in Studio, Copy HEX, Export modal access.
- **Old single-preview layout removed** — Replaced by extracting VisualizerSection to its own file with clean architecture.
- **Free, local-first, no accounts, full dark mode support.**

## v0.8.4 - 2026-06-28

### feat: Contrast page — WCAG contrast checker

- **New Contrast tab** — Added after Extract. Route: `#/contrast`.
- **Two-column layout** — Left: color inputs + contrast results. Right: live preview card with sample text.
- **Color controls** — Text and Background color pickers with HEX inputs, ⇄ Swap button, ✨ Enhance button.
- **Contrast results** — Ratio display with color-coded rating pill, 4 WCAG pass/badge indicators (AA/AAA small/large text), and contextual explanation text.
- **Live preview** — Sample heading, body text, and button rendered in selected colors.
- **Shareable URL** — Color pair preserved in URL hash (`#/contrast/hex1-hex2`).
- **Uses existing accessibility engine** — `getContrastRatio`, `getReadableTextColor`.
- **Free, local-first, no accounts.**

## v0.8.3 - 2026-06-28

### feat: Image Picker tab + scrollable tab nav

- **New Image Picker tab** — Added after Explore. Two-column layout with image upload (drag/drop + browse), palette extraction from uploaded images, palette size controls (2-10 colors), extracted palette strip with hex labels, Open in Studio and Copy HEX actions.
- **Scrollable tab navigation** — Nav shows 5 tabs at a time with ◀/▶ arrow buttons to slide hidden tabs into view. Active tab tracking preserved across navigation.
- **Image extraction** — Uses existing `extractPaletteFromPixels` engine with balanced extraction mode. Supports JPG, PNG, WebP.
- **URL hash routing** — `/image-picker` route preserved on refresh.

## v0.8.2 - 2026-06-28

### polish: Explore spacing, URL routing, theme toggle redesign

- **Explore page spacing** — Increased vertical gap between palette entries (space-y-5). Removed "Search with AI" button. All text uses semantic theme tokens for correct light/dark rendering.
- **URL hash routing** — Each tab now has its own URL hash (#studio, #explore, #gradient, etc.). Refreshing the page keeps you on the same tab. Hash updates on navigation without page reload. Share URLs still work.
- **Theme toggle redesign** — Replaced emoji toggle with fixed top-right 44×44 pill button using Lucide-style SVG sun/moon icons. Toggle cycles dark↔light. Persists to localStorage('openpalette-theme').
- **CSS variable restructure** — :root now holds dark defaults. [data-theme="light"] overrides for light mode. @media (prefers-color-scheme: light) provides system-default light mode for users who haven't toggled.

## v0.8.1 - 2026-06-28

### design: Explore page redesign — clean, open-canvas, Coolors-style layout

- **Editorial header** — Large "Explore Color Palettes" heading with subtitle. No card containers or pink buttons.
- **Search bar row** — Full-width input with search icon, "Search with AI" placeholder button, and Filters toggle button showing active filter count.
- **Filters in popover drawer** — Color, Style, Topic filter rows and Order toggle only visible when Filters button is active. Clean drawer, not cluttered on page.
- **Seamless palette strips** — Each palette is a horizontal swatch bar (no gaps) with hover reveal for hex labels. No card backgrounds, no borders between content.
- **Inline icon actions** — Favorite, View, Copy HEX, Open in Studio appear on group hover. Clean emoji icons, no buttons.
- **Palette name row** — Name, style/topic/color count on the left. Icon actions on the right. No containers, just text.
- **Load More** — Clean outline button.
- **All existing functionality preserved** — Search, filters, detail modal, open in Studio, favorites, copy HEX. Responsive single-column on mobile.
- **Dark mode compatible** — All colors use CSS variables.

## v0.8.0 - 2026-06-28

### feat: Explore tab — palette discovery hub with 75 curated palettes

- **New Explore tab** — Added after Studio in the navigation. Full palette discovery workflow matching Coolors Trending Palettes.
- **75 curated palettes** — Diverse dataset covering branding, nature, gaming, food, fashion, UI, travel, interior. Each with 5 hex colors, tags, style, topic, keywords, and descriptions.
- **Search** — Free-text keyword/prompt search matching palette names, tags, keywords, descriptions. Type "modern fintech app" or "warm coffee shop" to find themed palettes.
- **Filters** — Color (9 options), Style (8 options), Topic (8 options). Each as toggle chips. Order by Trending, Latest, Popular.
- **Palette grid** — Responsive card grid (1-4 columns) with swatch strips showing hex values, palette name, style/topic badges, tags, and Open/Favorite actions.
- **Load More** — Paginated loading in batches of 20.
- **Palette detail modal** — Centered modal with: full swatch strip, color selector, HEX/value display, 6 color space conversions (HSL/RGB/HSV/CMYK/Lab), color psychology, accessibility score with contrast ratings, 4-mode color blindness preview, similar colors, and related palette suggestions.
- **Quick actions** — Copy HEX List, Save (favorite), Open in Studio (loads palette into Studio tab with all colors preserved).
- **Cross-tab integration** — "Open in Studio" navigates to the Studio tab and loads the selected palette via custom event system.
- **All features free, local-first, no accounts** — Consistent with OpenPalette values.

## v0.7.1 - 2026-06-28

### polish: studio swatch controls and toolbar cleanup

- **Plus/minus toolbar** — Replaced ToolbarButton with icon-only IconBtn for +/− controls. No text label duplication, just clean SVG icons and the color count number between them.
- **Swatch hover action rail** — Now vertical and centered on each swatch (like Coolors). Glass-background rounded buttons with consistent spacing, hover scale effect, and tooltips. Actions: Remove (✕), Copy (📋), Lock (🔒/🔓), Move Left (◀), Move Right (▶), Insert After (+).
- **Add-swatch moved into palette** — Insert control appears as "+" button in the hover action rail (last item), inserting a new color after the current swatch. Removed the external add button at the canvas edge.
- **2-color minimum and 10-color maximum enforced** — Remove button disabled at 2, Insert/Add disabled at 10.
- **All existing features preserved** — Generator, vision sidebar, view modal, export modal, toolbar behavior unchanged.

## v0.7.0 - 2026-06-28

### Studio redesign — Coolors generator parity, semantic theme, sidebars, modals

This release consolidates 6 commits worth of feature work and polish:

- **v0.7.0 architecture refactor** — Extracted usePalette() hook, useAutoSave() hook, ErrorBoundary, and Studio sub-components from the 1700-line openpalette-app.tsx monolith into focused modules.
- **Studio as Coolors Generator parity page** — Drag-to-reorder swatches, quick-tune sliders (saturation/brightness/temperature), per-color editor with 6 color spaces (HEX/RGB/HSL/HSV/CMYK/Lab), color info panel with psychology/meaning/applications (32-color DB), similar colors finder, palette analysis, rendered color-blind simulation previews, auto-save/restore, copy share link, integrated tool links.
- **Semantic theme system** — Replaced all hardcoded text-white/bg-white/border-white classes with theme-aware CSS utilities (.text-page, .text-secondary, .text-muted, .surface, .btn-primary, .btn-secondary, .input-surface, .border-default, .hover-bg-muted). Fixed Tailwind v4 arbitrary value escaping bug. Light mode: #f9f9f9 bg, #111111 text. Dark mode: #111111 bg, #f5f5f5 text.
- **Editorial redesign** — Page background changed from #ff66c4 to #f9f9f9. Pink (#ff66c4) retained as accent color. Dark mode uses near-black (#111111) instead of deep maroon.
- **Toolbar redesign** — Single horizontal icon bar with Generate, Import, +/-, Modes popover, Eye (color blindness sidebar), View (color details modal), Undo, Export modal. Quick-tune sliders in popover. Harmony modes in popover. Random is now the default mode.
- **Swatches redesign** — Vertical columns with HEX + color name labels. Hover action rail (delete, copy, lock, move). Grab cursor with grip indicator. Add button at canvas edge. Drag-to-reorder with visual feedback.
- **Color blindness sidebar** — Right sidebar showing Original row + 4 simulated rows (Protanopia, Deuteranopia, Tritanopia, Achromatopsia) with hex labels. Cancel/Apply actions.
- **View modal** — Centered modal with palette strip selector, large swatch display, and 6 color spaces (HEX, HSB, HSL, RGB, CMYK, Lab).
- **Export modal** — Coolors-style dialog with URL/Share/Embed/X/Pinterest icons, 7 code format copy buttons, PNG/PDF downloads, Coming Soon placeholders.
- **Footer** — Tools grid moved into footer, then entire footer removed. Studio page ends at swatches.
- **Palette generation** — Fresh random base hue each generate (no progressive darkening). 4 Random strategies (wide spread, complementary clusters, triadic spread, minimum-separation). Increased saturation/lightness variation for vibrant Coolors-like output.
- **Achromatopsia support** — Added to simulateVision with grayscale luminance matrix.
- **Collections manager** — Named collections in Library with create/switch.
- **Error boundaries** — Wrapping all 6 tab sections.

## v0.6.0 - 2026-06-25

### design: full-screen swatches, independent tabs, per-page editors

This release consolidates 5 PRs worth of design iteration:

- **Page bg is #ff66c4** — bright pink background in light mode, deep maroon (#1a0012) in dark
- **Nav/header bg:** #fff5fc (light) / #2d001e (dark) — distinct from page bg
- **Button colors** — All derived from #ff66c4. Primary: white bg + dark text. Secondary: semi-transparent white. Active chip: solid white.
- **Full-screen swatches** — Each color fills h-dvh (full viewport height) in a vertical stack, edge-to-edge width
- **6 independent tabbed sections** — Studio, Gradient, Visualizer, Accessibility, Themes, Library. Each has its own palette state, generator, and keyboard shortcuts (Space=generate, U=undo, S=save)
- **Per-page tailored controls** — Studio: full palette editor. Gradient: kind/angle. Visualizer: text color + bg mode. Accessibility: simulation + contrast matrix. Themes: curated sets + edit strip. Library: exports + browser
- **Compact color strips** — Non-studio tabs show a clickable horizontal color strip (h-14, each swatch opens native color picker)
- **Mode strip** — Now shares nav styling (#fff5fc / #2d001e bg) with matching button treatment
- **Shared PaletteEditor component** — Reusable across all tabs
- **Curated Themes tab** — 10 light/dark palette sets (Rose Garden, Noir Pink, Ocean Depth, etc.)
- **Dev server port** — Changed to 1997
- **Static pages** — About, Terms, Privacy with editorial playbook styling

## v0.5.0 - 2026-06-25

### design: overhaul OpenPalette identity

- **Design system overhaul** — Applied the OpenProof Design Playbook as the craft standard.
- **Brand accent** — `#ff66c4` as the primary brand color (light + dark mode).
- **Dark mode** — Intentionally designed with dedicated surface values, not auto-inverted.
- **Theme toggle** — Light/dark switch at the far right of the sticky header.
- **Color studio layout** — Redesigned as a palette machine, not a dashboard. No card grids, no bordered panels. Editorial sections with generous spacing, typography hierarchy, and on-canvas layout.
- **Swatches** — Full-width hero section with inline HEX/RGB/HSL editing, alpha slider, lock control, channel toggles, and contrast hints.
- **Footer** — Added About, Terms, and Privacy links.
- **Static pages** — `/about`, `/terms`, `/privacy` pages with matching editorial design.
- **App icon** — Updated PWA icons, favicon, apple-touch-icon, and manifest from the new SVG source.
- **All functionality preserved** — Harmony modes, gradient generator, image extraction, visualizer, design tokens, accessibility toolkit, exports, library, history, undo/command palette.

## v0.4.0 - 2026-06-08

- Refined the platform expansion into a calmer production-grade design tool.
- Split palette, accessibility, gradient, import, export, library, and image extraction logic into focused engines.
- Added Vitest unit tests and V8 coverage for core platform engines.
- Added Style Dictionary compatible token export.
- Added design-system previews for semantic color roles, spacing, typography, and radii.
- Collapsed advanced RGB/HSL editing by default to reduce interface density.
- Deferred local library filtering to keep search typing responsive.
- Added performance and testing documentation.
- Added an animated product demo GIF.
- Updated CI to run coverage before build.

## v0.3.0 - 2026-06-08

- Expanded OpenPalette into a local-first design color platform.
- Added harmony modes, dynamic 2-10 color palettes, and lock-aware generation.
- Added HEX, RGB, HSL, alpha, visual color editing, and per-format copying.
- Added gradient generation with CSS, SVG, and PNG export.
- Added imports for HEX lists, JSON, Tailwind snippets, CSS variables, and shareable URL state.
- Added downloadable CSS, SCSS, Tailwind, JSON, SVG, PNG, PDF, and design token exports.
- Added website, mobile, dashboard, poster, social, typography, and brand visualizers.
- Added WCAG AA/AAA scoring, accessibility warnings, readable previews, suggested replacements, and color-vision simulation.
- Added local library collections architecture with tags, search, favorites, history, duplicate detection, and sorting.
- Added client-side image color extraction with vibrant, muted, and balanced modes.
- Added command palette, smoother responsive behavior, richer empty states, and repository templates.

## v0.2.0 - 2026-06-06

- Added saved palette renaming.
- Added confirmed saved palette deletion.
- Added export tools for CSS variables, Tailwind config snippets, JSON, and SVG swatches.
- Added copy-to-clipboard actions for each export format.
- Added contrast hints with best readable black/white text color, contrast ratio, and strength label.
- Added undo for generated palettes and loaded saved palettes.
- Added keyboard shortcuts and an in-app shortcut help panel.
- Updated README, ROADMAP, AGENTS, package metadata, and release documentation for v0.2.0.
- Prepared repository maintenance standards for protected `main` branch workflows.

## v0.1.1 - 2026-06-06

- Polished README structure for GitHub publishing readiness.
- Documented Vercel deployment, screenshots, repository topics, and GitHub About recommendations.
- Added PWA manifest and app metadata.
- Improved accessibility for status announcements, theme toggle state, copy controls, swatches, and HEX inputs.
- Hardened localStorage hydration so stored palettes are not overwritten by the initial default palette.
- Confirmed CI, Dependabot, agent instruction files, package metadata, and release checks.

## v0.1.0 - 2026-06-06

- Initial open-source release.
- Built a five-color palette generator with Spacebar generation.
- Added per-color lock and unlock controls.
- Added editable HEX inputs with normalization.
- Added copy-to-clipboard for individual colors and full palettes.
- Added light and dark mode.
- Added localStorage persistence for current palette, saved palettes, and theme.
- Added responsive UI for desktop and mobile.
- Added repository documentation, MIT license, GitHub Actions CI, Dependabot, and agent guidance files.
