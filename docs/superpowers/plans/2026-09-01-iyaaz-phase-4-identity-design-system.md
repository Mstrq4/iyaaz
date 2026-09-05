# IYAAZ Phase 4 — Identity and Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary IYAAZ visual foundation with a canonical SVG identity, coherent custom icons, semantic light/dark design tokens, safe typography handling, a reusable bilingual application shell, and verified RTL/LTR responsive behavior.

**Architecture:** Keep all Phase 3 data/search/server contracts unchanged. Phase 4 is a presentation-system layer: static brand/icon assets in `public/`, pure theme/direction helpers in `src/lib/`, reusable shell components in `src/components/`, semantic tokens in `src/app/globals.css`, and Playwright as the highest behavioral verification layer. Repository skills are development aids only and are never runtime dependencies.

**Tech Stack:** Next.js 16.3.3, React 19.2.0, TypeScript 5.8+, CSS custom properties/logical properties, SVG, Node test runner, Python `unittest`, Playwright 1.55+, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-01-iyaaz-phase-4-identity-design-system-design.md`

## Global Constraints

- Repository: `Mstrq4/iyaaz`; branch: `feat/iyaaz-platform`; reuse PR #1.
- Approved identity board from the project conversation is the visual source of truth. Existing SVG files are temporary references only.
- Visual direction: **Data-dense + Drill-down + Editorial + Selective Glassmorphism**.
- Exact brand anchors: Deep Amethyst `#3E1848`, Whisper Lavender `#E7E6F5`.
- No emoji product icons, generic AI purple-gradient page backgrounds, giant rounded-card dashboards, or excessive centered content.
- Arabic/English are first-class; use logical CSS properties and pass `npm run test:rtl`.
- Only semantically directional icons mirror in RTL.
- No database/Supabase, AI model API, or file/image upload flow.
- Do not modify `data/library.snapshot.json`, search semantics, taxonomy semantics, or Phase 3 API contracts.
- Thmanyah Serif Display remains the intended display face. Official Thmanyah terms prohibit redistributing/uploading/hosting the font files, so do not commit or serve the uploaded WOFF2 binaries. Use a `local("Thmanyah Serif Display")`-first display stack with a legal fallback. Exact production Thmanyah rendering remains unavailable until a separately permitted delivery method exists.
- Never expose or return the uploaded font binaries as artifacts.
- Merge and Production deployment remain explicit approval gates.
- After each subphase `4A`, `4B`, `4C`, `4D`, `4E`: update PR evidence, report status, state the next subphase, and STOP until the user sends `تابع`.

## File Structure

**Skills**
- Create `skills/svg-foundry/` from the user-provided Apache-2.0 package.
- Create `skills/svg-foundry/UPSTREAM.md`.
- Create `skills/ui-ux-pro-max/` from `nextlevelbuilder/ui-ux-pro-max-skill` commit `f23267105ad1f4ccd94af45d382584ad45b586f7` (MIT).
- Create `skills/ui-ux-pro-max/UPSTREAM.md`.
- Create `tests/test_phase4_skills.py`.

**Identity and icons**
- Modify all eight `public/brand/*.svg` assets already present.
- Modify `public/icons/iyaaz-icons.svg`.
- Modify `src/components/brand/IyaazLogo.tsx`.
- Create `src/lib/icons.ts`.
- Modify `src/components/icons/IyaazIcon.tsx`.
- Create `tests/test_brand_assets.py`.
- Create `tests/ts/icon-direction.test.ts`.

**Tokens/theme/shell**
- Modify `src/app/globals.css`.
- Modify `src/lib/theme.ts`.
- Create `src/components/theme/ThemeBootstrap.tsx`.
- Modify `src/components/theme/ThemeToggle.tsx`.
- Create `src/components/shell/AppShell.tsx`.
- Create `src/components/shell/AppHeader.tsx`.
- Create `src/components/shell/BrandLink.tsx`.
- Create `src/components/shell/LocaleSwitch.tsx`.
- Modify `src/lib/i18n.ts`.
- Modify `src/app/[locale]/layout.tsx`.
- Modify `src/app/[locale]/page.tsx`.
- Modify `tests/ts/theme.test.ts`.
- Modify `tests/e2e/shell.spec.ts`.

---

## Task 1: 4A — Vendor Required Design Skills

**Files:** `skills/svg-foundry/**`, `skills/ui-ux-pro-max/**`, provenance files, `tests/test_phase4_skills.py`.

**Produces:** repository-local design guidance with pinned provenance and no runtime import.

- [ ] **Step 1: Write RED skill-presence tests**

```python
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class Phase4SkillTests(unittest.TestCase):
    def test_required_design_skills_are_vendored(self) -> None:
        for name in ("svg-foundry", "ui-ux-pro-max", "rtl-css"):
            self.assertTrue((ROOT / "skills" / name / "SKILL.md").is_file(), name)

    def test_new_skills_record_provenance(self) -> None:
        for name in ("svg-foundry", "ui-ux-pro-max"):
            self.assertTrue((ROOT / "skills" / name / "UPSTREAM.md").is_file(), name)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Commit the test and verify remote RED**

Expected failure: `skills/svg-foundry/SKILL.md` and `skills/ui-ux-pro-max/SKILL.md` do not exist. Existing tests must remain green.

- [ ] **Step 3: Vendor SVG Foundry**

Extract the supplied package into `skills/svg-foundry/`; keep `SKILL.md`, `LICENSE`, `README.md`, referenced `references/`, and any package assets/docs required by its own instructions. Do not commit the ZIP.

`skills/svg-foundry/UPSTREAM.md` must record:
- supplied archive name;
- source commit `ffbf523c6e8767bcf2ab13a370706cff554cd462`;
- Apache-2.0 license;
- development-only purpose.

- [ ] **Step 4: Vendor UI UX Pro Max**

Copy the complete upstream `.claude/skills/ui-ux-pro-max/` skill tree from commit `f23267105ad1f4ccd94af45d382584ad45b586f7` into `skills/ui-ux-pro-max/`. Preserve required data/references/scripts and the MIT notice.

`skills/ui-ux-pro-max/UPSTREAM.md` must record repository, pinned commit, MIT license, and development-only purpose.

- [ ] **Step 5: Verify GREEN**

```bash
python3 -m unittest tests.test_phase4_skills -v
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `chore: add Phase 4 design skills`.

Continue inside 4A; do not report 4A complete yet.

---

## Task 2: 4A — Define Identity and Icon Contracts with RED Tests

**Files:** create `src/lib/icons.ts`, `tests/ts/icon-direction.test.ts`, `tests/test_brand_assets.py`.

**Produces:** `IyaazIconName`, `isDirectionalIcon(name)`, and automated SVG invariants.

- [ ] **Step 1: Create semantic icon metadata**

```ts
export const IYAAZ_ICON_NAMES = [
  'search', 'copy', 'check', 'filter', 'sort', 'library', 'category', 'master',
  'prompt', 'favorite', 'history', 'clients', 'statistics', 'docs', 'theme',
  'language', 'menu', 'close', 'chevron', 'arrow', 'info', 'warning', 'privacy',
  'trash', 'export', 'external', 'clear', 'sun', 'moon', 'home', 'grid', 'list',
] as const;

export type IyaazIconName = (typeof IYAAZ_ICON_NAMES)[number];

const DIRECTIONAL_ICONS = new Set<IyaazIconName>(['chevron', 'arrow']);

export function isDirectionalIcon(name: IyaazIconName): boolean {
  return DIRECTIONAL_ICONS.has(name);
}
```

- [ ] **Step 2: Add direction tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { isDirectionalIcon } from '../../src/lib/icons.ts';

test('only semantic navigation arrows mirror in RTL', () => {
  assert.equal(isDirectionalIcon('arrow'), true);
  assert.equal(isDirectionalIcon('chevron'), true);
  for (const name of ['search', 'copy', 'favorite', 'theme', 'grid', 'list', 'external'] as const) {
    assert.equal(isDirectionalIcon(name), false, name);
  }
});
```

- [ ] **Step 3: Add brand-asset XML tests**

`tests/test_brand_assets.py` uses `xml.etree.ElementTree` and checks:
1. all eight required brand SVG files exist and parse;
2. each root has `viewBox` and no fixed root `width`/`height`;
3. no `<image>`, `data:image`, or embedded raster content;
4. `mark-gradient.svg`, `mark-dark.svg`, `mark-light.svg` all have `data-geometry="iyaaz-ribbon-v2"`;
5. those three files each have `path[data-role="ribbon-core"]` and `path[data-role="gem-core"]`, with identical core `d` values across variants;
6. gradient mark contains SVG gradient definitions and at least one explicit highlight/reflection layer with opacity below 1;
7. all lockups contain zero `<text>` nodes;
8. functional icon sprite contains `currentColor` and no raster data.

- [ ] **Step 4: Commit and verify RED**

Commit message: `test: define Phase 4 identity contract`.

Expected current-asset failures: geometry metadata absent and lockups contain `<text>`.

---

## Task 3: 4A — Rebuild Canonical Identity and Functional Icons

**Files:** all existing `public/brand/*.svg`, `public/icons/iyaaz-icons.svg`, `IyaazLogo.tsx`, `IyaazIcon.tsx`.

**Consumes:** approved identity board, SVG Foundry, UI UX Pro Max guidance, Task 2 contracts.

- [ ] **Step 1: Reconstruct canonical geometry from the approved board**

Trace the approved folded-ribbon silhouette and central gem using vector paths. Determine one canonical `viewBox` from the traced proportions. Assign `data-geometry="iyaaz-ribbon-v2"` to all three mark variants, `data-role="ribbon-core"` to the outer/core ribbon path, and `data-role="gem-core"` to the central cue path. After tracing, copy those two exact path `d` strings unchanged into gradient/dark/light variants.

Geometry acceptance is visual: silhouette, negative space, gem placement, fold ordering, and proportions must match the approved board more closely than the temporary SVG.

- [ ] **Step 2: Build the gradient/depth variant**

Use the exact anchors `#3E1848` and `#E7E6F5`, layered linear/radial gradients, restrained translucent highlights, and tightly bounded SVG filters only where needed. Do not use embedded raster images. Keep edges crisp at 48px and depth readable at 320px.

- [ ] **Step 3: Derive dark/light/favicons**

Dark/light assets reuse exact core geometry. Since `IyaazLogo` loads standalone SVG files with `next/image`, use explicit brand fills in these external SVGs rather than assuming parent `currentColor` inheritance. Simplify only nonessential reflections for favicon scale.

- [ ] **Step 4: Convert lockup lettering to vector outlines**

Remove live `<text>` from all four lockups. Use static outline paths for the approved Arabic/English wordmark appearance. Do not embed, base64-encode, copy, or serve Thmanyah font binaries.

- [ ] **Step 5: Normalize the icon sprite**

Keep all existing icon IDs. Use `viewBox="0 0 24 24"`, `currentColor`, consistent optical weight, and coherent caps/joins. No emoji or hard-coded theme colors in ordinary functional icons.

- [ ] **Step 6: Update `IyaazIcon.tsx`**

Import `IyaazIconName` and `isDirectionalIcon` from `src/lib/icons.ts`; remove the caller-controlled `directional` prop. Add `is-directional` automatically when `isDirectionalIcon(name)` is true.

- [ ] **Step 7: Run focused GREEN checks**

```bash
python3 -m unittest tests.test_brand_assets -v
npm run test:logic
npm run test:rtl
npm run lint
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 8: Perform visual QA**

Render the canonical gradient mark at 48px, 128px, and 320px and compare it to the approved board for silhouette, negative space, gem position, reflections, transparency, blur, and edge quality. Save screenshots/report evidence where practical. Do not call structural XML tests proof of visual fidelity.

- [ ] **Step 9: Commit, run exact-SHA full CI, update PR, report 4A, STOP**

Commit message: `feat: establish canonical IYAAZ identity`.

---

## Task 4: 4B — Semantic Design Tokens and Safe Typography

**Files:** modify `src/app/globals.css` only unless a defect proves another file is responsible.

**Produces:** semantic color, type, spacing, radius, elevation, blur, focus, and motion tokens.

- [ ] **Step 1: Define typography stacks without hosting the restricted font**

```css
--font-display: "Thmanyah Serif Display", "Noto Naskh Arabic", Georgia, serif;
--font-ui: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-code: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

No `@font-face` points to the uploaded WOFF2 files.

- [ ] **Step 2: Define light semantic tokens**

```css
:root,
:root[data-theme="light"] {
  color-scheme: light;
  --brand-amethyst: #3e1848;
  --brand-lavender: #e7e6f5;
  --page-bg: #f8f7fb;
  --surface-1: rgba(255, 255, 255, 0.86);
  --surface-glass: rgba(255, 255, 255, 0.64);
  --border-soft: rgba(62, 24, 72, 0.12);
  --border-strong: rgba(62, 24, 72, 0.24);
  --text-1: #2e1036;
  --text-2: #67546c;
  --focus-ring: #6d2b80;
  --shadow-1: 0 0.75rem 2.5rem rgba(62, 24, 72, 0.08);
  --radius-sm: 0.625rem;
  --radius-md: 0.875rem;
  --radius-lg: 1.25rem;
  --content-max: 90rem;
}
```

- [ ] **Step 3: Define authored dark tokens**

```css
:root[data-theme="dark"] {
  color-scheme: dark;
  --page-bg: #180b1d;
  --surface-1: rgba(43, 20, 50, 0.88);
  --surface-glass: rgba(62, 24, 72, 0.58);
  --border-soft: rgba(231, 230, 245, 0.12);
  --border-strong: rgba(231, 230, 245, 0.24);
  --text-1: #f6f3f8;
  --text-2: #c9bfd0;
  --focus-ring: #c9a4d4;
  --shadow-1: 0 1rem 3rem rgba(0, 0, 0, 0.24);
}
```

- [ ] **Step 4: Add focus, selective RTL mirroring, and reduced-motion rules**

```css
:focus-visible {
  outline: 0.1875rem solid var(--focus-ring);
  outline-offset: 0.1875rem;
}

html[dir="rtl"] .iyaaz-icon.is-directional {
  transform: scaleX(-1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 5: Run gates, commit, exact-SHA CI, update PR, report 4B, STOP**

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Commit message: `feat: add IYAAZ design tokens`.

Report the Thmanyah runtime limitation explicitly as a licensing constraint, not as a missing implementation step.

---

## Task 5: 4C — Pre-hydration Theme Resolution and Persistent Toggle

**Files:** `src/lib/theme.ts`, create `ThemeBootstrap.tsx`, modify `ThemeToggle.tsx`, `layout.tsx`, `tests/ts/theme.test.ts`.

**Produces:** `THEME_STORAGE_KEY`, `parseTheme`, `resolveTheme`, `nextTheme`.

- [ ] **Step 1: Write RED theme tests**

```ts
assert.equal(theme.parseTheme('light'), 'light');
assert.equal(theme.parseTheme('dark'), 'dark');
assert.equal(theme.parseTheme('anything'), null);
assert.equal(theme.resolveTheme('dark', false), 'dark');
assert.equal(theme.resolveTheme(null, true), 'dark');
assert.equal(theme.resolveTheme(null, false), 'light');
assert.equal(theme.nextTheme('light'), 'dark');
assert.equal(theme.nextTheme('dark'), 'light');
```

Commit and verify these fail because current `theme.ts` lacks `parseTheme`/`resolveTheme`.

- [ ] **Step 2: Implement pure theme helpers**

```ts
export type Theme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'iyaaz:theme';

export function parseTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

export function resolveTheme(stored: unknown, prefersDark: boolean): Theme {
  return parseTheme(stored) ?? (prefersDark ? 'dark' : 'light');
}

export function nextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
```

- [ ] **Step 3: Add static pre-hydration bootstrap**

`ThemeBootstrap.tsx` emits a static inline script with exactly this behavior:

```js
try {
  const stored = localStorage.getItem('iyaaz:theme');
  const valid = stored === 'light' || stored === 'dark' ? stored : null;
  const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = valid || system;
} catch {
  document.documentElement.dataset.theme = 'light';
}
```

Render it before visible locale content.

- [ ] **Step 4: Upgrade `ThemeToggle`**

On click: parse current `data-theme`, fall back to `matchMedia`, toggle, write `data-theme`, persist `iyaaz:theme`. Render both sun/moon icons and use theme CSS to show the action appropriate to the current mode, avoiding hydration-dependent icon flash.

- [ ] **Step 5: Run RED/GREEN gates, commit, CI, update PR, report 4C, STOP**

```bash
npm run test:logic
npm test
npm run lint
npm run typecheck
npm run build
```

Commit message: `feat: add persistent theme resolution`.

---

## Task 6: 4D — Reusable Bilingual Application Shell

**Files:** create four `src/components/shell/*` components; modify `i18n.ts`, locale page, and `globals.css`; add E2E expectations.

**Produces:** `AppShell({ locale, children })`, `AppHeader({ locale })`, `BrandLink({ locale })`, `LocaleSwitch({ locale })`.

- [ ] **Step 1: Add RED shell E2E assertions**

After navigating to each locale, assert a visible semantic banner, brand link, locale switch, and accessible theme button. Commit and verify current foundation markup fails the new banner/theme contract.

- [ ] **Step 2: Add locale labels to `shellCopy`**

Add labels for theme toggle, shell navigation, skip-to-content, and any concise home/library label. No component hard-codes bilingual UI copy.

- [ ] **Step 3: Build `BrandLink` and `LocaleSwitch`**

Both accept `Locale`; `BrandLink` composes canonical mark/wordmark; `LocaleSwitch` uses `alternateLocale(locale)` and `hrefLang`.

- [ ] **Step 4: Build `AppHeader`**

Use semantic `<header>` and `<nav>`. Compose BrandLink, compact navigation label, LocaleSwitch, ThemeToggle. Do not add a hamburger menu in Phase 4 because the current action count does not require one.

- [ ] **Step 5: Build `AppShell`**

```tsx
export function AppShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppHeader locale={locale} />
      <main id="main-content" className="app-main">{children}</main>
    </div>
  );
}
```

- [ ] **Step 6: Migrate locale home**

Remove inline `foundation-nav` structure. Keep home content intentionally limited to an editorial identity/foundation presentation. Do not add Phase 5 library search/results UI.

- [ ] **Step 7: Replace foundation CSS with shell primitives**

Use logical properties only. Remove the decorative page-level radial purple gradient. Use glass/fog selectively on header/identity moments rather than every block.

- [ ] **Step 8: Verify, commit, CI, update PR, report 4D, STOP**

```bash
npm run build
npx playwright test tests/e2e/shell.spec.ts
npm test
npm run lint
npm run typecheck
```

Commit message: `feat: add reusable IYAAZ application shell`.

---

## Task 7: 4E — Responsive, Accessibility, Theme, and RTL Browser Matrix

**Files:** primarily `tests/e2e/shell.spec.ts`; modify only the smallest responsible implementation file if a defect appears.

- [ ] **Step 1: Add saved-theme persistence test**

Emulate light system preference, clear `iyaaz:theme`, load `/ar`, click theme control, assert `html[data-theme="dark"]`, reload, assert it remains dark.

- [ ] **Step 2: Add system fallback test**

With no saved preference and `page.emulateMedia({ colorScheme: 'dark' })`, assert the resolved document theme is dark before interaction.

- [ ] **Step 3: Add keyboard reachability**

Use `Tab` to prove header links/buttons receive focus in logical order and no control is trapped/unreachable.

- [ ] **Step 4: Add exact overflow matrix**

Use widths `[320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]` and locales `['ar', 'en']`. For every pair, assert:

```ts
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth
);
expect(overflow).toBe(false);
```

Execute the explicit 20-case matrix once under the desktop Chromium project; keep ordinary user-flow tests under both desktop and mobile projects.

- [ ] **Step 5: Verify selective icon mirroring in browser CSS**

Under RTL, assert an element with `iyaaz-icon is-directional` has horizontal flip transform while a plain `iyaaz-icon` does not. Unit tests separately prove only `arrow` and `chevron` receive the semantic class.

- [ ] **Step 6: Verify reduced-motion usability**

Emulate reduced motion and assert theme/language/header controls remain visible and operable without animation.

- [ ] **Step 7: Run complete verification**

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

If a failure appears: inspect first meaningful failure, reproduce focused, make root-cause fix, rerun focused check, then rerun the complete set. Do not weaken tests/audits.

- [ ] **Step 8: Commit final 4E fixes, then proceed to final evidence task**

---

## Task 8: Final Phase 4 Candidate and Evidence Packet

**Files:** PR #1 body only after verification; no merge and no Production deployment.

- [ ] **Step 1: Record exact final branch head SHA**

All final evidence must reference this candidate.

- [ ] **Step 2: Verify canonical Push and PR CI**

Require `quality` and `browser` jobs PASS on the exact candidate. Inspect job steps and fetch final Playwright report artifact ID/digest.

- [ ] **Step 3: Re-check Vercel linkage**

List connected Vercel projects and look specifically for one linked to `Mstrq4/iyaaz`. If present, use Preview only and verify the exact candidate. If absent, record `Preview: NOT VERIFIED`; never deploy into an unrelated project.

- [ ] **Step 4: Update PR #1**

Record final candidate, subphase evidence, canonical identity/icon changes, theme/shell behavior, required viewport matrix, all quality gates, Playwright artifact, font-license limitation, preview status, and explicit no-merge/no-Production statement.

- [ ] **Step 5: Report 4E and Phase 4 status, then STOP**

State next phase as Phase 5 (library/detail surfaces + Dynamic Prompt Builder) and wait for user confirmation.

## Rollback Strategy

Phase 4 remains additive/reversible on `feat/iyaaz-platform`. Revert only the unacceptable subphase commit(s), preserve all Phase 3 work, never force-push shared history, and never merge or deploy Production without explicit approval.
