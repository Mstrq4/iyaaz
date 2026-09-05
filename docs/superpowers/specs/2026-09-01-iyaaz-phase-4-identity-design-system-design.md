# IYAAZ Phase 4 — Identity and Design System Specification

Status: Approved after conversation-alignment review; implementation pending execution plan.

## Context

Phase 3 completed the sanitized data snapshot, deterministic search engine, server-only loader, taxonomy, HTTP APIs, and HTTP-level Playwright coverage. Phase 4 establishes the canonical visual identity and reusable application shell that all later product surfaces will use.

The current app still uses a foundation-only shell and a small token set. Existing SVG brand assets are structurally valid but visually simplified relative to the approved identity board. Phase 4 must replace that temporary layer without changing the Phase 3 data/search contracts.

The approved identity board supplied in the project conversation is the visual source of truth for the IYAAZ mark. Existing repository SVGs are temporary engineering references only; they must not overrule the approved board when silhouette, negative space, gem placement, depth, translucency, or highlight relationships differ.

## Goals

1. Establish one canonical IYAAZ vector identity matching the approved amethyst/lavender translucent ribbon mark as faithfully as practical in SVG.
2. Derive consistent dark, light, favicon, horizontal-lockup, and stacked-lockup assets from the same geometry.
3. Establish a custom, theme-aware IYAAZ functional icon family for application controls, using `currentColor` where appropriate and selective RTL mirroring only for truly directional semantics.
4. Introduce a reusable bilingual design-token system for light and dark themes.
5. Wire the provided Thmanyah Serif Display family into the application without external font requests and without exposing font files as chat/download artifacts.
6. Replace the foundation-only page chrome with a reusable application shell that future library, detail, prompt-builder, favorites, history, clients, docs, and statistics surfaces can reuse.
7. Preserve first-class RTL/LTR behavior using logical CSS properties.
8. Verify the shell, brand assets, icon semantics, theme behavior, responsive behavior, and directional semantics at unit/structural/browser layers.
9. Add and use the repository engineering/design skills discussed for this product: `svg-foundry`, `ui-ux-pro-max`, and the existing `rtl-css`, plus only other relevant skills that materially improve the implementation without becoming runtime dependencies.

## Non-goals

- No Phase 5 library explorer implementation.
- No dynamic prompt builder.
- No favorites/history/client-profile workflows.
- No database, Supabase, model API, or file/image upload flow.
- No production deployment or merge.
- No generic redesign outside the approved IYAAZ visual direction.
- No emoji as product/application icons.
- No oversized generic marketing cards, excessive centered content, or decorative AI-style gradients used as a substitute for information hierarchy.

## Visual Direction

The design direction is **Data-dense + Drill-down + Editorial + Selective Glassmorphism**. The interface should feel premium and deliberate, but remain efficient for a large searchable library. Selective glass, fog, translucency, and blur may be used for identity moments and hierarchy; they must not be applied indiscriminately to every surface.

Core identity colors:

- Deep Amethyst: `#3E1848`
- Whisper Lavender: `#E7E6F5`

Supporting tones may be derived from those anchors for foreground, muted text, borders, overlays, and interaction states. Avoid the common generic "AI purple gradient" look: gradients must serve the ribbon/gem identity and depth model, not act as decorative page backgrounds.

The approved mark reads as a geometric folded ribbon/loop with a compact central gem/play/directional cue. It should not introduce robots, chat bubbles, sparkles, or unrelated AI motifs.

Dense application surfaces added in later phases should inherit this system without becoming giant rounded-card dashboards. The design system must support compact rows, drill-down panels, filters, search results, detail views, breadcrumbs, keyboard focus, and no-results states without forcing those Phase 5 features into Phase 4.

## Phase 4 Tooling and Repository Skills

Phase 4 must use repository-backed skills as implementation aids, not as runtime product dependencies.

Required:

- keep and use `skills/rtl-css` for logical-property and RTL auditing;
- inspect the user-provided `svg-foundry` skill package and add the usable skill to the repository before canonical SVG production;
- add/use `ui-ux-pro-max` for design-system and UI-quality review when its source is available through the approved skill/plugin workflow;
- add other discussed skills such as `web-artifacts-builder` or `writing-skills` only when they have a concrete role in this phase and do not introduce unnecessary runtime code.

Skill files belong under `skills/` and must not weaken repository CI, security boundaries, or the requirement that GitHub remains the engineering source of truth.

## 4A — Canonical SVG Identity and Functional Icons

### Canonical geometry

Create one canonical vector geometry for the mark, then derive all variants from it. Do not maintain unrelated hand-edited silhouettes across variants.

The approved identity board is the authority for:

- outer silhouette and proportions;
- internal negative space;
- central gem/play/directional cue position and scale;
- ribbon overlaps and depth ordering;
- amethyst/lavender reflection relationships;
- transparency, fog, highlight, and shadow character.

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

### Functional icon family

The existing `IyaazIcon` boundary remains the application icon API, but the underlying icon family must be reviewed for a coherent IYAAZ visual language.

Requirements:

- custom SVG icons rather than emoji;
- consistent viewBox, stroke/fill logic, optical weight, caps, joins, and spacing;
- theme-aware `currentColor` for ordinary UI icons;
- no hard-coded light/dark colors inside ordinary functional icons;
- only semantically directional icons such as arrows/chevrons may mirror in RTL;
- search, copy, favorite, history, theme, grid, list, info, warning, and similar semantic icons do not mirror merely because the locale changes;
- icon-only controls require accessible names at the component boundary.

## 4B — Typography and Design Tokens

### Typography

Use the user-provided Thmanyah Serif Display files already available to the project work context. Use a local font loader appropriate to Next.js and do not make external font-network requests.

Before committing font binaries to this public repository, confirm that the provided files may legally be redistributed from the repository. If redistribution is not permitted, keep the typography integration path ready and use a legal local/system fallback until a redistributable package is supplied; do not silently replace the approved typography direction.

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
- glass/fog surface
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

The Phase 4 home content remains intentionally limited. It may be restyled to demonstrate the design system, but must not become the Phase 5 library explorer. It must avoid excessive centered composition and generic gradient hero treatment; the shell should demonstrate the editorial/data-dense direction that later drill-down screens will use.

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
- shared canonical geometry/variant consistency where practical;
- functional icon `currentColor`/directional semantics;
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
- responsive header remains usable on mobile and desktop;
- icon mirroring is selective rather than global.

Final CI must run logic/data/SVG/RTL tests, lint, TypeScript, production build, and browser E2E against the same candidate SHA.

## Implementation Sequence

### 4A

Add/verify the Phase 4 repository skills needed for SVG/UI review, canonicalize SVG mark geometry and lockups from the approved board, review the custom functional icon family, and add asset regression checks.

### 4B

Add typography integration and semantic design tokens, subject to the font redistribution gate above.

### 4C

Implement pre-hydration theme bootstrap and upgrade ThemeToggle.

### 4D

Build reusable application shell and migrate the locale home page to it.

### 4E

Run full RTL/LTR responsive matrix, accessibility-focused browser checks, CI, and final Phase 4 verification packet.

Each subphase should be independently reviewable and should keep the existing task branch and PR.

## Acceptance Criteria

Phase 4 is complete only when all of the following are true:

- the approved conversation identity board is treated as the visual source of truth;
- canonical SVG and all required variants are committed;
- variants derive from consistent geometry and pass asset checks;
- approved brand colors remain the visual anchors;
- `svg-foundry`, `ui-ux-pro-max` (when available through the approved source), and `rtl-css` are incorporated/used as specified rather than ignored;
- the functional application icon family is custom, coherent, theme-aware, free of emoji, and selectively directional;
- provided local typography is wired without external font requests when redistribution permits repository inclusion, otherwise the redistribution limitation is explicitly recorded without silently changing the design direction;
- semantic light/dark tokens exist and components use them;
- selective glass/fog/transparency is used intentionally rather than as a universal card treatment;
- the UI avoids generic AI purple-gradient backgrounds, giant rounded-card composition, and excessive centering;
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

Mitigation: geometry first, highlights second, restrained filters last; test favicon/small-mark variants separately and compare the result against the approved board rather than the temporary repository SVG.

### Font rendering and redistribution

Risk: display fonts may reduce legibility in dense UI text, have incomplete Latin behavior, or have redistribution terms that do not permit committing binaries to a public repository.

Mitigation: restrict the display face to brand/display roles, retain a readable UI/body fallback stack, and verify redistribution permission before committing font binaries.

### Theme flash

Risk: client-only theme initialization can briefly render the wrong theme.

Mitigation: pre-hydration bootstrap reads the saved/system preference before first paint.

### RTL regressions

Risk: shell refactoring can reintroduce physical direction assumptions or globally mirror icons that should remain unchanged.

Mitigation: logical-property audit plus semantic icon-mirroring tests and browser verification in both directions at all required widths.

## Later-phase Requirements Preserved Outside Phase 4

The following project requirements remain binding but intentionally belong to later phases rather than being pulled into this design-system phase:

- Phase 5: library explorer/detail surfaces and Dynamic Prompt Builder with conditional fields, fixed-value selects, manual attachment guidance, and copy-ready prompt output;
- Phase 6: favorites, history, local client profiles, landing/docs/workbook-derived statistics;
- Phase 7: `private | shared | public` access modes plus SEO/GEO/REO;
- final verification: broader responsive/user-story review and preview/promotion gates.

Keeping these outside Phase 4 is scope control, not removal from the product requirements.

## Deployment and Review Boundary

Phase 4 development, CI, and preview deployment are reversible development actions. Merge to `main` and Production deployment remain explicit user approval gates.
