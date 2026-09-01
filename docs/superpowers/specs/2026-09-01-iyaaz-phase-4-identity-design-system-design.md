# IYAAZ Phase 4 — Identity and Design System Specification

Status: Approved in principle; implementation pending final spec review.

## Context

Phase 3 completed the sanitized data snapshot, deterministic search engine, server-only loader, taxonomy, HTTP APIs, and HTTP-level Playwright coverage. Phase 4 establishes the canonical visual identity and reusable application shell that all later product surfaces will use.

The current app still uses a foundation-only shell and a small token set. Existing SVG brand assets are structurally valid but visually simplified relative to the approved identity board. Phase 4 must replace that temporary layer without changing the Phase 3 data/search contracts.

## Goals

1. Establish one canonical IYAAZ vector identity matching the approved amethyst/lavender translucent ribbon mark as closely as practical in SVG.
2. Derive consistent dark, light, favicon, horizontal-lockup, and stacked-lockup assets from the same geometry.
3. Introduce a reusable bilingual design-token system for light and dark themes.
4. Wire the provided Thmanyah Serif Display family into the application without exposing font files as user-facing artifacts.
5. Replace the foundation-only page chrome with a reusable application shell that future library, detail, prompt-builder, favorites, history, clients, docs, and statistics surfaces can reuse.
6. Preserve first-class RTL/LTR behavior using logical CSS properties.
7. Verify the shell, brand assets, theme behavior, responsive behavior, and directional semantics at unit/structural/browser layers.

## Non-goals

- No Phase 5 library explorer implementation.
- No dynamic prompt builder.
- No favorites/history/client-profile workflows.
- No database, Supabase, model API, or file/image upload flow.
- No production deployment or merge.
- No generic redesign outside the approved IYAAZ visual direction.

## Visual Direction

The visual system is editorial, data-dense, premium, and restrained. It uses selective glass/translucency instead of applying glass effects to every surface.

Core identity colors:

- Deep Amethyst: `#3E1848`
- Whisper Lavender: `#E7E6F5`

Supporting tones may be derived from those anchors for foreground, muted text, borders, overlays, and interaction states. Avoid the common generic "AI purple gradient" look: gradients must serve the ribbon/gem identity and depth model, not act as decorative page backgrounds.

The approved mark reads as a geometric folded ribbon/loop with a compact central gem/play/directional cue. It should not introduce robots, chat bubbles, sparkles, or unrelated AI motifs.

## 4A — Canonical SVG Identity

### Canonical geometry

Create one canonical vector geometry for the mark, then derive all variants from it. Do not maintain unrelated hand-edited silhouettes across variants.

The canonical mark should use:

- layered vector paths;
- amethyst-to-lavender tonal transitions;
- restrained opacity and highlight layers;
- masks/clip paths only where they improve edge fidelity;
- subtle SVG blur/filter effects for depth, never as a substitute for correct geometry;
- no embedded raster images;
- no root-level fixed pixel sizing that prevents responsive reuse;
- accessible `title`/`desc` where the SVG is used as meaningful content.

### Required brand assets

- `public/brand/mark-gradient.svg`
- `public/brand/mark-dark.svg`
- `public/brand/mark-light.svg`
- `public/brand/favicon.svg`
- `public/brand/lockup-horizontal-dark.svg`
- `public/brand/lockup-horizontal-light.svg`
- `public/brand/lockup-stacked-dark.svg`
- `public/brand/lockup-stacked-light.svg`

`IyaazLogo.tsx` remains the React boundary for application usage. Variants should share dimensions/aspect ratio and must not cause layout shift.

### Monochrome behavior

Where a monochrome application icon or mark is required, prefer `currentColor` so the host component controls theme color. The full canonical gradient mark may keep explicit gradient colors.

## 4B — Typography and Design Tokens

### Typography

Use the user-provided Thmanyah Serif Display files already available to the project work context. The repository implementation should keep only the font files required for the selected weights/styles and use a local font loader appropriate to Next.js.

Typography roles:

- Arabic display/brand headings: Thmanyah Serif Display.
- Latin display/brand pairing: use the same family where coverage is correct; otherwise use a restrained system/sans fallback selected for visual compatibility.
- UI body and dense data: prioritize readability and stable metrics.
- Shortcut codes and technical identifiers: use a legible monospaced/system code stack rather than the display face.

### Token families

Define semantic CSS custom properties instead of hard-coding colors in components:

- brand
- page background
- elevated surface
- glass surface
- strong/soft borders
- primary/secondary/muted text
- interactive foreground/background
- focus ring
- positive/warning/destructive states
- shadows/elevation
- blur strengths
- radii
- spacing scale
- content widths
- motion durations/easing

Components consume semantic tokens only.

## 4C — Theme System

The theme modes are `light` and `dark`.

Initial theme resolution order:

1. valid `localStorage` preference;
2. `prefers-color-scheme` system preference;
3. light fallback.

A small pre-hydration bootstrap must set `data-theme` before the app becomes visible to avoid a light/dark flash. The client toggle updates both `data-theme` and `localStorage`.

Dark mode is a designed Deep Amethyst environment, not a mechanical color inversion. Contrast must remain readable for dense search/library content added later.

Theme controls must:

- expose a meaningful accessible name;
- show an icon that reflects current state/action;
- preserve preference across reloads;
- work identically in Arabic and English.

## 4D — Reusable Application Shell

Replace the temporary inline `foundation-nav` composition with reusable components.

Proposed component boundaries:

- `AppShell`
- `AppHeader`
- `BrandLink`
- `LocaleSwitch`
- `ThemeToggle`
- `IyaazLogo`
- `IyaazIcon`

The shell owns layout and chrome only. Product-specific pages own their content.

Header behavior:

- brand mark + bilingual wordmark;
- library/home navigation entry appropriate to the current foundation state;
- language switch;
- theme toggle;
- compact responsive behavior without turning every action into a large card;
- keyboard-visible focus states;
- no horizontal overflow.

The Phase 4 home content remains intentionally limited. It may be restyled to demonstrate the design system, but must not become the Phase 5 library explorer.

## 4E — RTL/LTR and Responsive Verification

All new CSS must use logical properties. Physical directional properties are prohibited except where a vendor/browser API forces them and the exception is documented.

Directional icons mirror only when their meaning is directional. Search, favorite, theme, copy, grid, and similar semantic icons do not mirror merely because the locale is RTL.

Required responsive verification widths:

- 320
- 360
- 375
- 390
- 430
- 768
- 1024
- 1280
- 1440
- 1920

At each required width, both locale directions must avoid horizontal overflow. Critical controls must remain visible and operable.

## Accessibility

- Maintain semantic heading order.
- Provide visible keyboard focus states.
- Icon-only buttons require accessible names.
- Decorative SVG content must be hidden from assistive technology.
- Meaningful logo use must expose a concise accessible label.
- Respect `prefers-reduced-motion`.
- Do not rely on transparency alone for separation or interaction affordance.

## Testing Strategy

### Structural/unit checks

Add focused tests for:

- theme preference normalization and initial resolution logic;
- semantic directional-icon behavior;
- canonical SVG asset requirements and absence of embedded raster data;
- RTL logical-property audit.

### Browser E2E

Playwright must verify the running production build for:

- Arabic `lang=ar`, `dir=rtl`;
- English `lang=en`, `dir=ltr`;
- theme toggle changes `data-theme`;
- theme persists after reload;
- system fallback is honored when no saved preference exists;
- brand/header controls are present and keyboard reachable;
- no horizontal overflow across the required viewport matrix;
- responsive header remains usable on mobile and desktop.

Final CI must run logic/data/SVG/RTL tests, lint, TypeScript, production build, and browser E2E against the same candidate SHA.

## Implementation Sequence

### 4A

Canonicalize SVG mark geometry and lockups. Add asset regression checks.

### 4B

Add typography integration and semantic design tokens.

### 4C

Implement pre-hydration theme bootstrap and upgrade ThemeToggle.

### 4D

Build reusable application shell and migrate the locale home page to it.

### 4E

Run full RTL/LTR responsive matrix, accessibility-focused browser checks, CI, and final Phase 4 verification packet.

Each subphase should be independently reviewable and should keep the existing task branch and PR.

## Acceptance Criteria

Phase 4 is complete only when all of the following are true:

- canonical SVG and all required variants are committed;
- variants derive from consistent geometry and pass asset checks;
- approved brand colors remain the visual anchors;
- provided local typography is wired without external font requests;
- semantic light/dark tokens exist and components use them;
- initial theme does not visibly flash the wrong mode in the verified browser flow;
- preference persists across reloads;
- reusable application shell replaces the temporary foundation navigation structure;
- Arabic and English render with correct directionality;
- directional icons mirror selectively and correctly;
- all required viewport widths pass horizontal-overflow checks;
- full repository CI is green on the exact final candidate SHA;
- PR documentation records the candidate, test evidence, unresolved risks, and preview status;
- no merge or production deployment has occurred.

## Risks and Mitigations

### SVG fidelity

Risk: reproducing translucent depth with excessive filters can make the mark blurry or inconsistent at small sizes.

Mitigation: geometry first, highlights second, restrained filters last; test favicon/small-mark variants separately.

### Font rendering

Risk: display fonts may reduce legibility in dense UI text or have incomplete Latin behavior.

Mitigation: restrict the display face to brand/display roles and retain a readable UI/body fallback stack.

### Theme flash

Risk: client-only theme initialization can briefly render the wrong theme.

Mitigation: pre-hydration bootstrap reads the saved/system preference before first paint.

### RTL regressions

Risk: shell refactoring can reintroduce physical direction assumptions.

Mitigation: logical-property audit plus browser verification in both directions at all required widths.

## Deployment and Review Boundary

Phase 4 development, CI, and preview deployment are reversible development actions. Merge to `main` and Production deployment remain explicit user approval gates.
