# IYAAZ Design System — Master

This file is the persistent visual-system source of truth for IYAAZ. Page-specific design files may refine composition, but they must not silently override the locked brand, accessibility, RTL, typography, theme, or semantic-token contracts below.

## Product direction

IYAAZ combines **data-dense + drill-down + editorial + selective glassmorphism**. The interface should feel precise and premium rather than like a generic AI gradient landing page. Glass is reserved for hierarchy-bearing surfaces such as navigation, search controls, sheets, and selected content panels; it is not decorative wallpaper.

## Locked brand

- Deep Amethyst: `#3E1848`.
- Whisper Lavender: `#E7E6F5`.
- Canonical mark geometry: `iyaaz-ribbon-v2` from Phase 4A.
- Structural icons are SVG, never emoji.
- Brand and UI colors must flow through semantic tokens instead of ad-hoc component hex values.

## Semantic tokens

Runtime tokens live in `src/styles/tokens.css`. Components should consume roles, not palette names:

- canvas/subtle backgrounds: `--color-bg-*`;
- solid/glass surfaces: `--color-surface-*`;
- text roles: `--color-text-*`;
- borders/focus/accent: `--color-border-*`, `--color-focus-ring`, `--color-accent`;
- glass/elevation: `--glass-*`, `--shadow-*`;
- spacing/radius/motion/content widths: their named token scales.

Light and dark themes are designed as independent mappings. Dark mode uses lighter/desaturated brand accents rather than simple color inversion.

## Typography

### Display

Preferred family: **Thmanyah Serif Display**. The runtime defines a local-only face named `Iyaaz Thmanyah Local` using `local("Thmanyah Serif Display")`. It is for brand/display headings and selected editorial emphasis.

No `.woff`, `.woff2`, `.ttf`, or `.otf` font binary is committed or shipped by this design-system phase. If Thmanyah is unavailable on a client, the display stack falls back to Arabic-aware serif/system families. This keeps licensing and distribution boundaries explicit while preserving graceful rendering.

### Body/UI

Body controls, filters, tables, search results, metadata, and long reading use the system-oriented `--font-body` stack for speed, legibility, and Arabic/English coverage. Body starts at `1rem`; normal prose uses a `1.65` line-height. Data-like identifiers should use `--font-mono` or tabular numerals when introduced by later components.

## Theme runtime contract

Theme state is represented only by `document.documentElement.dataset.theme` with values `light` or `dark`.

- Persistence key: `iyaaz:theme`.
- Before visible locale content, the static `ThemeBootstrap` script checks the saved value first; only exact `light` or `dark` values are accepted.
- Without a valid saved value, the bootstrap resolves `prefers-color-scheme: dark` and applies the corresponding authored theme before hydration.
- If browser storage access throws, bootstrap falls back deterministically to `light` rather than leaving the document in an unknown state.
- `ThemeToggle` resolves the current document theme, falls back to the current system preference if needed, toggles deterministically, updates `data-theme`, and persists on a best-effort basis.
- The control renders both sun and moon vector icons in a stable footprint; semantic theme CSS exposes the action appropriate to the active theme without requiring hydration-dependent icon replacement.
- Browser-level saved-theme persistence and system-fallback assertions are finalized in Phase 4E; the Phase 4C logic contract is covered independently by executable unit tests.

## AppShell runtime contract

The localized application shell is owned by `src/components/shell/AppShell.tsx` and mounted once by the locale layout.

- The canonical Phase 4A mark and bilingual wordmark are the home identity inside the global header.
- The shell exposes semantic `banner`, named primary `navigation`, `main`, and `contentinfo` landmarks, plus a keyboard-visible skip link targeting `#main-content`.
- `LanguageSwitcher` swaps the leading locale segment while retaining any localized path suffix, so later library/detail routes can reuse the same shell without resetting users to the home page.
- `ThemeToggle` is a global shell utility and uses the Phase 4C persistence contract.
- All shell controls meet the shared `44px` interaction target and use tokenized focus, surface, border, motion, and spacing roles.
- Mobile layout may wrap navigation onto a second row, but must not introduce horizontal page overflow.
- Phase 4D does not add library/search/detail product interfaces; those remain Phase 5 responsibilities.

## Accessibility contract

- Normal primary and secondary text must remain at least WCAG AA `4.5:1` against the canvas in both themes.
- Focus indicators must reach at least `3:1` state contrast and remain visibly offset from the control.
- Interactive controls use a minimum `44px` target (`--touch-target`).
- Body text does not drop below `16px` on mobile.
- Reduced-motion preferences map shared motion durations to zero.
- Color cannot be the only carrier of state or meaning.
- Long tokens and user content must wrap safely; normal prose must not use blanket `word-break: break-all`.

These choices follow the pinned `ui-ux-pro-max` guidance for semantic theming, contrast, focus, target size, font-display behavior, responsive spacing, and reduced motion.

## Spatial system

Use the 4/8-derived token rhythm from `--space-1` through `--space-24`. Prefer the existing scale before introducing a new value. Radii intentionally stay moderate: small controls use `--radius-sm`/`--radius-md`; principal cards and glass panels use `--radius-lg`/`--radius-xl`; pills are reserved for compact controls and tags.

Content has three measures:

- `--content-reading`: readable prose/description measure;
- `--content-shell`: normal application shell;
- `--content-wide`: exceptionally dense/wide surfaces only.

Adaptive horizontal gutters come from `--gutter-inline`.

## Motion

Shared motion is restrained: `120ms`, `180ms`, and `260ms`. Use transform/opacity for animated transitions where possible. Motion must communicate state or hierarchy, remain interruptible, and never be required for correctness. `prefers-reduced-motion: reduce` collapses the shared durations and movement distance.

## RTL/LTR contract

- Prefer CSS logical properties (`inline`, `block`, `margin-inline`, `padding-inline`, logical borders/insets).
- Do not mirror icons merely because the page is RTL. Phase 4A metadata allows automatic mirroring only for semantic navigation arrows/chevrons.
- Typography and spacing tokens are shared across Arabic and English unless a concrete readability issue requires a documented page override.

## Responsive contract

The target width matrix remains `320 / 360 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920`. Layout implementation is mobile-first; no horizontal page overflow is allowed. Long-form text should stay around 60–75 characters on desktop and narrower on phones.

## Implementation rules

1. Do not hardcode brand/theme hex values inside React components.
2. Consume semantic design tokens in CSS/component styles.
3. Keep structural icons vector-only and use the Phase 4A icon semantics.
4. Do not add remote font requests or bundled font binaries without a separate licensing/distribution decision.
5. Do not use glass on every card; reserve it for meaningful hierarchy.
6. Respect focus, keyboard, reduced-motion, and RTL behavior from the start rather than patching them after visual implementation.
7. Resolve theme before visible content and keep the DOM theme source of truth on `html[data-theme]`.

## Phase boundary

Phase 4D owns the reusable bilingual AppShell and global identity/language/theme utilities. The full responsive/accessibility/theme/RTL browser matrix is Phase 4E. Phase 5 remains responsible for the actual library/search/detail/prompt-builder product interfaces.
