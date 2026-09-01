# IYAAZ Phase 4 — Identity and Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary IYAAZ visual foundation with a canonical SVG identity, coherent custom icons, semantic light/dark design tokens, safe typography handling, a reusable bilingual application shell, and verified RTL/LTR responsive behavior.

**Architecture:** Keep Phase 3 data/search/server contracts untouched. Phase 4 is a presentation-system layer: static brand/icon assets in `public/`, pure theme/direction helpers in `src/lib/`, reusable shell components in `src/components/`, semantic tokens in `src/app/globals.css`, and Playwright as the highest behavioral verification layer. The approved identity board is the visual authority; repository skills support design/engineering work but are never runtime dependencies.

**Tech Stack:** Next.js 16.3.3, React 19.2.0, TypeScript 5.8+, CSS custom properties/logical properties, SVG, Node test runner, Python `unittest`, Playwright 1.55+, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-01-iyaaz-phase-4-identity-design-system-design.md`

## Global Constraints

- Continue on repository `Mstrq4/iyaaz`, branch `feat/iyaaz-platform`, PR #1; do not create a replacement branch or PR.
- Approved identity board from the project conversation is the visual source of truth; existing SVG assets are temporary engineering references.
- Visual direction: **Data-dense + Drill-down + Editorial + Selective Glassmorphism**.
- Brand anchors are Deep Amethyst `#3E1848` and Whisper Lavender `#E7E6F5`.
- No generic AI purple-gradient page treatment, no emoji product icons, no giant rounded-card dashboard composition, and no excessive centered content.
- Arabic and English are first-class. New CSS uses logical properties and passes `npm run test:rtl`.
- Only semantically directional icons mirror in RTL.
- No database/Supabase, AI model API, or file/image upload flow.
- Do not change `data/library.snapshot.json`, the Phase 3 search contract, or API semantics during Phase 4.
- Thmanyah Serif Display remains the intended display face, but its official usage terms prohibit redistributing/uploading/hosting the font files. Do not commit or serve the provided WOFF2 binaries. Use a `local("Thmanyah Serif Display")`-first display stack plus a legal fallback unless a separately permitted first-party web delivery mechanism is established later.
- Never expose or provide the uploaded font binaries as artifacts.
- Merge to `main` and Production deployment remain explicit user approval gates.
- At the end of each subphase `4A`, `4B`, `4C`, `4D`, and `4E`, update the existing PR with evidence, report to the user, state the next subphase, and STOP until the user sends `تابع`.

## File Structure Map

### Repository skills

- `skills/svg-foundry/` — vendored user-provided Apache-2.0 SVG Foundry skill, including its `SKILL.md`, license, and referenced knowledge files required by that skill.
- `skills/svg-foundry/UPSTREAM.md` — source/provenance note for the supplied archive (`ffbf523c6e8767bcf2ab13a370706cff554cd462`).
- `skills/ui-ux-pro-max/` — vendored canonical UI UX Pro Max skill content from `nextlevelbuilder/ui-ux-pro-max-skill`, pinned to upstream commit `f23267105ad1f4ccd94af45d382584ad45b586f7`.
- `skills/ui-ux-pro-max/UPSTREAM.md` — source, commit, and MIT license provenance.
- `tests/test_phase4_skills.py` — validates that the required skill entrypoints/provenance files are present.

### Brand and icons

- `public/brand/mark-gradient.svg` — canonical full-depth mark.
- `public/brand/mark-dark.svg` — monochrome dark mark using the exact canonical core geometry.
- `public/brand/mark-light.svg` — monochrome light mark using the exact canonical core geometry.
- `public/brand/favicon.svg` — small-size simplified derivative of the canonical geometry.
- `public/brand/lockup-horizontal-dark.svg`
- `public/brand/lockup-horizontal-light.svg`
- `public/brand/lockup-stacked-dark.svg`
- `public/brand/lockup-stacked-light.svg`
- `public/icons/iyaaz-icons.svg` — coherent functional icon sprite using `currentColor`.
- `src/components/brand/IyaazLogo.tsx` — React boundary for brand assets.
- `src/lib/icons.ts` — icon names and semantic direction metadata.
- `src/components/icons/IyaazIcon.tsx` — renders icons and applies direction class from metadata.
- `tests/test_brand_assets.py` — XML-level asset contract.
- `tests/ts/icon-direction.test.ts` — semantic direction regression tests.

### Design system and theme

- `src/app/globals.css` — semantic tokens, theme values, layout primitives, focus/motion rules.
- `src/lib/theme.ts` — pure theme parsing/resolution/toggle logic and storage key.
- `src/components/theme/ThemeBootstrap.tsx` — pre-hydration theme initialization script.
- `src/components/theme/ThemeToggle.tsx` — client toggle with state-reflective icon behavior.
- `tests/ts/theme.test.ts` — expanded theme logic tests.

### Shell

- `src/components/shell/AppShell.tsx` — page chrome/layout wrapper.
- `src/components/shell/AppHeader.tsx` — responsive header.
- `src/components/shell/BrandLink.tsx` — logo + bilingual wordmark link.
- `src/components/shell/LocaleSwitch.tsx` — alternate locale link.
- `src/lib/i18n.ts` — adds shell labels while preserving locale helpers.
- `src/app/[locale]/layout.tsx` — installs ThemeBootstrap in the document.
- `src/app/[locale]/page.tsx` — migrates temporary foundation markup to AppShell.
- `tests/e2e/shell.spec.ts` — direction, theme, keyboard, shell, and viewport matrix verification.

---

## Task 1: 4A — Vendor the Required Design Skills

**Files:**
- Create: `skills/svg-foundry/**`
- Create: `skills/svg-foundry/UPSTREAM.md`
- Create: `skills/ui-ux-pro-max/**`
- Create: `skills/ui-ux-pro-max/UPSTREAM.md`
- Create: `tests/test_phase4_skills.py`

**Interfaces:**
- Consumes: user-provided `/mnt/data/svg-foundry-skill-main.zip`; canonical UI UX Pro Max upstream skill at `.claude/skills/ui-ux-pro-max/` pinned to `f23267105ad1f4ccd94af45d382584ad45b586f7`.
- Produces: repository-local design skills available to later Phase 4 tasks; no runtime imports.

- [ ] **Step 1: Write the failing skill-presence test**

Create `tests/test_phase4_skills.py` using the repository's `unittest` convention:

```python
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class Phase4SkillTests(unittest.TestCase):
    def test_required_design_skills_are_vendored(self) -> None:
        for name in ("svg-foundry", "ui-ux-pro-max", "rtl-css"):
            self.assertTrue((ROOT / "skills" / name).is_dir(), name)
            self.assertTrue((ROOT / "skills" / name / "SKILL.md").is_file(), name)

    def test_vendored_phase4_skills_record_provenance(self) -> None:
        for name in ("svg-foundry", "ui-ux-pro-max"):
            self.assertTrue((ROOT / "skills" / name / "UPSTREAM.md").is_file(), name)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Push RED and verify the new test fails for the missing skills**

Run remotely through the existing CI contract after committing only the test. Expected: existing tests stay green; `test_required_design_skills_are_vendored` fails because `skills/svg-foundry` and `skills/ui-ux-pro-max` do not yet exist.

- [ ] **Step 3: Vendor SVG Foundry from the supplied archive**

Copy the skill package into `skills/svg-foundry/`, preserving `SKILL.md`, `LICENSE`, the referenced `references/` knowledge files, and any assets/docs the skill requires to resolve its own references. Do not add the ZIP itself.

Create `skills/svg-foundry/UPSTREAM.md`:

```markdown
# Upstream provenance

Source: user-provided `svg-foundry-skill-main.zip`
Source commit recorded by archive: `ffbf523c6e8767bcf2ab13a370706cff554cd462`
License: Apache-2.0 (see `LICENSE`)
Purpose in IYAAZ: SVG identity/icon creation and review only; not a runtime dependency.
```

- [ ] **Step 4: Vendor the pinned UI UX Pro Max skill**

Copy the canonical upstream `.claude/skills/ui-ux-pro-max/` directory from commit `f23267105ad1f4ccd94af45d382584ad45b586f7` into `skills/ui-ux-pro-max/`. Preserve the upstream skill data/references/scripts required by `SKILL.md`.

Create `skills/ui-ux-pro-max/UPSTREAM.md`:

```markdown
# Upstream provenance

Repository: `nextlevelbuilder/ui-ux-pro-max-skill`
Pinned commit: `f23267105ad1f4ccd94af45d382584ad45b586f7`
Upstream license: MIT
Purpose in IYAAZ: design-system/UI review only; not a runtime dependency.
```

Keep an MIT license notice inside the vendored skill directory.

- [ ] **Step 5: Run focused tests and repository tests**

Run:

```bash
python3 -m unittest tests.test_phase4_skills -v
npm test
```

Expected: skill tests PASS and existing data/RTL tests remain PASS.

- [ ] **Step 6: Commit GREEN**

```bash
git add skills/svg-foundry skills/ui-ux-pro-max tests/test_phase4_skills.py
git commit -m "chore: add Phase 4 design skills"
```

Continue within 4A; do not stop yet because the user-approved 4A deliverable is the canonical identity, not skill vendoring alone.

---

## Task 2: 4A — Establish the Brand and Icon Contract with RED Tests

**Files:**
- Create: `tests/test_brand_assets.py`
- Create: `tests/ts/icon-direction.test.ts`
- Create: `src/lib/icons.ts`
- Modify later in Task 3: `public/brand/*.svg`, `public/icons/iyaaz-icons.svg`, `src/components/icons/IyaazIcon.tsx`, `src/components/brand/IyaazLogo.tsx`

**Interfaces:**
- Produces: `IyaazIconName`, `isDirectionalIcon(name)`, and an XML asset contract for all canonical brand files.

- [ ] **Step 1: Add the pure icon metadata contract**

Create `src/lib/icons.ts` with the exact API:

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

- [ ] **Step 2: Write icon-direction tests before modifying the component**

Create `tests/ts/icon-direction.test.ts`:

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

- [ ] **Step 3: Write the canonical SVG asset tests**

Create `tests/test_brand_assets.py`. The test must parse XML with `xml.etree.ElementTree` and verify:

```python
REQUIRED = (
    "mark-gradient.svg", "mark-dark.svg", "mark-light.svg", "favicon.svg",
    "lockup-horizontal-dark.svg", "lockup-horizontal-light.svg",
    "lockup-stacked-dark.svg", "lockup-stacked-light.svg",
)
```

Assertions:

1. every required asset exists and parses as SVG;
2. root has a `viewBox` and does not have fixed `width`/`height` attributes;
3. no asset contains an SVG `<image>` element or `data:image`/base64 raster content;
4. all three mark variants expose the same `data-geometry="iyaaz-ribbon-v2"` identifier;
5. all three mark variants contain `path[data-role="ribbon-core"]` and `path[data-role="gem-core"]`, and the `d` values of those two canonical paths are identical across gradient/dark/light variants;
6. `mark-gradient.svg` contains gradient definitions plus at least one restrained highlight/opacity layer;
7. lockup SVGs contain no `<text>` elements, so brand lockups do not depend on redistributing the Thmanyah font;
8. functional icon sprite uses `currentColor` and contains no emoji/raster image data.

- [ ] **Step 4: Push RED and inspect the first meaningful failure**

Expected RED reasons on the existing assets: missing `data-geometry`/`data-role` contract, existing lockups still use `<text>`, and the icon component still owns the icon-name union/directional flag manually.

- [ ] **Step 5: Commit the RED contract**

```bash
git add src/lib/icons.ts tests/ts/icon-direction.test.ts tests/test_brand_assets.py
git commit -m "test: define Phase 4 identity contract"
```

---

## Task 3: 4A — Rebuild the Canonical Identity and Functional Icon Family

**Files:**
- Modify: `public/brand/mark-gradient.svg`
- Modify: `public/brand/mark-dark.svg`
- Modify: `public/brand/mark-light.svg`
- Modify: `public/brand/favicon.svg`
- Modify: `public/brand/lockup-horizontal-dark.svg`
- Modify: `public/brand/lockup-horizontal-light.svg`
- Modify: `public/brand/lockup-stacked-dark.svg`
- Modify: `public/brand/lockup-stacked-light.svg`
- Modify: `public/icons/iyaaz-icons.svg`
- Modify: `src/components/brand/IyaazLogo.tsx`
- Modify: `src/components/icons/IyaazIcon.tsx`

**Interfaces:**
- Consumes: approved identity board; SVG Foundry; UI UX Pro Max review guidance; `IyaazIconName` and `isDirectionalIcon` from Task 2.
- Produces: canonical geometry id `iyaaz-ribbon-v2`, all brand variants, and automatic semantic direction behavior.

- [ ] **Step 1: Trace geometry from the approved board, not from the temporary SVG**

Use the approved board to reconstruct the folded ribbon silhouette, negative space, central gem, overlap order, and edge proportions. The existing `118 × 163` viewBox may be retained only if it fits the approved proportions; otherwise change the canonical viewBox once and apply that exact viewBox to all mark variants.

The canonical files must expose this structure:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="..."
     data-geometry="iyaaz-ribbon-v2"
     role="img"
     aria-labelledby="title desc">
  <title id="title">IYAAZ mark</title>
  <desc id="desc">Geometric amethyst and lavender folded ribbon identity mark.</desc>
  <defs>...</defs>
  <path data-role="ribbon-core" d="..." />
  <path data-role="gem-core" d="..." />
  <!-- gradient variant only: controlled highlight/reflection layers -->
</svg>
```

The final `d` strings are determined by the traced approved geometry and are then copied unchanged into gradient/dark/light variants; visual styling differs, geometry does not.

- [ ] **Step 2: Build the gradient/depth treatment**

Use layered linear/radial gradients and restrained masks/filters to reproduce the board's glossy/translucent amethyst/lavender ribbon. Keep blur regions tight and avoid a global soft/drop-shadow treatment that makes small rendering muddy.

Required color anchors must be present in the full mark: `#3E1848` and `#E7E6F5`.

- [ ] **Step 3: Derive monochrome and favicon variants**

`mark-dark.svg` and `mark-light.svg` reuse the exact core `d` strings. Because `IyaazLogo` currently loads standalone SVG files through `next/image`, do not rely on host-element `currentColor` inheritance inside those external files; use explicit theme-safe fills for these standalone brand assets. Reserve `currentColor` for inline/application icon SVGs.

Simplify only nonessential highlight/filter layers for `favicon.svg`; preserve recognizability at small size.

- [ ] **Step 4: Rebuild lockups without live `<text>`**

Use the approved wordmark appearance as vector outlines in the lockups. Do not embed/serve a font file and do not leave `<text font-family="Thmanyah...">` in the final lockup assets. The lockup outline paths are static brand artwork, not a webfont distribution mechanism.

- [ ] **Step 5: Normalize the functional icon sprite**

Keep the existing icon names so later phases do not break. Normalize all ordinary functional icons to `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, consistent optical stroke weight, round caps/joins where appropriate, and no hard-coded theme colors.

- [ ] **Step 6: Make `IyaazIcon` semantic by default**

Update `src/components/icons/IyaazIcon.tsx` to import the type and metadata:

```tsx
import type { SVGProps } from 'react';
import { isDirectionalIcon, type IyaazIconName } from '@/lib/icons';

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IyaazIconName;
  label?: string;
}

export function IyaazIcon({ name, label, className = '', ...props }: Props) {
  const classes = [
    'iyaaz-icon',
    isDirectionalIcon(name) ? 'is-directional' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <svg viewBox="0 0 24 24" className={classes} role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true} aria-label={label} {...props}>
      {label ? <title>{label}</title> : null}
      <use href={`/icons/iyaaz-icons.svg#${name}`} />
    </svg>
  );
}
```

Remove the caller-controlled `directional` prop so mirroring cannot drift from semantic rules.

- [ ] **Step 7: Run focused GREEN checks**

Run:

```bash
python3 -m unittest tests.test_brand_assets -v
npm run test:logic
npm run test:rtl
npm run lint
npm run typecheck
npm run build
```

Expected: all PASS.

- [ ] **Step 8: Perform visual QA against the approved board**

Render `/brand/mark-gradient.svg` at approximately 48px, 128px, and 320px and inspect for silhouette, internal negative space, gem placement, highlights, blur, and edge cleanliness. Attach screenshots to the Playwright/report evidence if practical. Structural tests cannot be presented as proof of visual fidelity by themselves.

- [ ] **Step 9: Commit 4A GREEN and run full CI**

```bash
git add public/brand public/icons src/components/brand src/components/icons src/lib/icons.ts tests
git commit -m "feat: establish canonical IYAAZ identity"
```

Record exact candidate SHA and wait for Push/PR quality + browser jobs. Update PR with 4A evidence.

- [ ] **Step 10: STOP after the 4A report**

Report PASS/FAIL/NOT VERIFIED precisely, state that 4B is next, and wait for the user's `تابع`.

---

## Task 4: 4B — Semantic Tokens and Legally Safe Typography

**Files:**
- Modify: `src/app/globals.css`
- Optional only if a legally permitted delivery method is later established: a separate font integration file approved at that time.
- Test: existing RTL audit plus browser rendering in Task 7.

**Interfaces:**
- Produces: semantic CSS variables consumed by shell/theme components.

- [ ] **Step 1: Record the typography delivery constraint before code**

The official Thmanyah guidance permits use in websites/apps but explicitly prohibits redistributing, uploading, or hosting the font files. Therefore do **not** add the uploaded WOFF2 files to GitHub, `public/`, CSS base64, or any deployment asset.

The CSS display stack must start with the locally installed font name so authorized local installations render it:

```css
--font-display: "Thmanyah Serif Display", "Noto Naskh Arabic", Georgia, serif;
--font-ui: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-code: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

Do not claim exact production Thmanyah rendering unless a legal delivery path is later verified.

- [ ] **Step 2: Replace temporary color variables with semantic light-theme tokens**

At minimum define:

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

Tune supporting values with UI UX Pro Max review, but keep the two brand anchors exact.

- [ ] **Step 3: Define an authored dark palette, not inversion**

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

- [ ] **Step 4: Add global focus, reduced-motion, and directional-icon rules**

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

Do not mirror `.iyaaz-icon` globally.

- [ ] **Step 5: Run quality gates**

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

- [ ] **Step 6: Commit and verify 4B**

```bash
git add src/app/globals.css
git commit -m "feat: add IYAAZ design tokens"
```

Run exact-SHA CI, update PR, report the font runtime limitation explicitly if it remains, then STOP and wait for `تابع` before 4C.

---

## Task 5: 4C — Pre-hydration Theme Resolution and Toggle

**Files:**
- Modify: `src/lib/theme.ts`
- Create: `src/components/theme/ThemeBootstrap.tsx`
- Modify: `src/components/theme/ThemeToggle.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `tests/ts/theme.test.ts`
- Later browser verification: `tests/e2e/shell.spec.ts`

**Interfaces:**
- Produces: `THEME_STORAGE_KEY`, `parseTheme`, `resolveTheme`, `nextTheme`, and the document bootstrap script.

- [ ] **Step 1: Expand theme tests first**

Update `tests/ts/theme.test.ts` to assert:

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

Push RED before replacing the current `normalizeTheme` API.

- [ ] **Step 2: Implement pure resolution logic**

`src/lib/theme.ts`:

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

- [ ] **Step 3: Create a pre-hydration bootstrap component**

`ThemeBootstrap.tsx` must emit a small inline script in the document head/body before visible content. Its behavior is exactly:

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

Keep the script static; do not interpolate user-controlled data.

- [ ] **Step 4: Install ThemeBootstrap in locale layout**

Render it before page content so `data-theme` is present before first visible paint. Keep `lang` and `dir` behavior unchanged.

- [ ] **Step 5: Upgrade ThemeToggle**

On click, read `document.documentElement.dataset.theme` with `parseTheme`, resolve fallback from `matchMedia`, call `nextTheme`, write `data-theme`, and persist `iyaaz:theme`. Render sun/moon icons whose visibility is controlled by `[data-theme]` CSS so the icon reflects the current mode without waiting for hydration state.

- [ ] **Step 6: Run RED/GREEN and full checks**

```bash
npm run test:logic
npm test
npm run lint
npm run typecheck
npm run build
```

- [ ] **Step 7: Commit, CI, report, STOP**

Commit message: `feat: add persistent theme resolution`. After exact-SHA CI and PR evidence, STOP before 4D.

---

## Task 6: 4D — Build the Reusable Bilingual Application Shell

**Files:**
- Create: `src/components/shell/AppShell.tsx`
- Create: `src/components/shell/AppHeader.tsx`
- Create: `src/components/shell/BrandLink.tsx`
- Create: `src/components/shell/LocaleSwitch.tsx`
- Modify: `src/lib/i18n.ts`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/e2e/shell.spec.ts`

**Interfaces:**
- `AppShell({ locale, children })` owns page chrome only.
- `AppHeader({ locale })` composes BrandLink, library/home label, LocaleSwitch, ThemeToggle.
- `BrandLink({ locale })` renders canonical mark + bilingual wordmark.
- `LocaleSwitch({ locale })` links to `alternateLocale(locale)` with `hrefLang`.

- [ ] **Step 1: Add E2E expectations for the future shell before changing the page**

Extend `tests/e2e/shell.spec.ts` with stable accessible assertions, for example:

```ts
await expect(page.getByRole('banner')).toBeVisible();
await expect(page.getByRole('link', { name: /إيعاز|IYAAZ/ })).toBeVisible();
await expect(page.getByRole('link', { name: /English|العربية/ })).toBeVisible();
await expect(page.getByRole('button', { name: /المظهر|theme/i })).toBeVisible();
```

Push RED because the current page does not expose the reusable banner/theme-control contract.

- [ ] **Step 2: Add shell copy to `src/lib/i18n.ts`**

Add locale-specific labels for theme toggle, home/library navigation, and any concise shell accessibility label. Keep all copy in `shellCopy`, not hard-coded inside components.

- [ ] **Step 3: Implement `BrandLink` and `LocaleSwitch`**

`BrandLink` uses `IyaazMark` and `IyaazWordmark`; `LocaleSwitch` uses `alternateLocale` and `hrefLang`. Components accept `Locale`, not raw strings.

- [ ] **Step 4: Implement `AppHeader`**

Use semantic `<header>`/`<nav>`. Keep controls compact. No hamburger is required for the Phase 4 action count; YAGNI. If later phases exceed available space, Phase 5 can add a navigation drawer.

- [ ] **Step 5: Implement `AppShell`**

Expose one content slot and a skip target:

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

- [ ] **Step 6: Migrate the locale home page**

Remove the inline `foundation-nav` markup. Keep the Phase 4 page limited to an editorial identity/foundation presentation; do not add the library explorer/search UI yet.

- [ ] **Step 7: Replace foundation CSS with shell primitives**

Use logical properties (`margin-inline`, `padding-inline`, `inset-inline`, etc.). Remove decorative page-level radial purple gradient. Use selective glass only on the header/one intentional identity surface, not every block.

- [ ] **Step 8: Run focused Playwright and repository gates**

```bash
npm run build
npx playwright test tests/e2e/shell.spec.ts
npm test
npm run lint
npm run typecheck
```

- [ ] **Step 9: Commit, CI, report, STOP**

Commit message: `feat: add reusable IYAAZ application shell`. Record exact SHA, update PR, STOP before 4E.

---

## Task 7: 4E — Browser Verification Matrix, Accessibility, and Responsive Hardening

**Files:**
- Modify: `tests/e2e/shell.spec.ts`
- Modify if defects are discovered: the smallest responsible shell/theme/CSS file only.

**Interfaces:**
- Produces final browser-level evidence for Phase 4.

- [ ] **Step 1: Add saved-theme persistence E2E**

Force a known initial media preference, clear saved theme, load `/ar`, click the theme button, assert `html[data-theme]` changes, reload, and assert it remains changed.

- [ ] **Step 2: Add system-theme fallback E2E**

Use `page.emulateMedia({ colorScheme: 'dark' })` with no stored preference and assert the first resolved document theme is `dark`. Repeat with light if needed to prove both branches.

- [ ] **Step 3: Add keyboard reachability**

Use `Tab` navigation to prove brand/navigation/theme/language controls can receive keyboard focus and that focus is not trapped.

- [ ] **Step 4: Add the complete overflow matrix**

Required widths:

```ts
const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const locales = ['ar', 'en'] as const;
```

For each pair, set viewport, navigate, and assert:

```ts
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth
);
expect(overflow).toBe(false);
```

Run the explicit matrix once under the desktop Chromium project to avoid duplicating all 20 cases across both Playwright projects; retain the existing mobile project for ordinary user-flow regression coverage.

- [ ] **Step 5: Verify selective icon mirroring**

Combine the pure `isDirectionalIcon` unit test with a browser computed-style assertion proving `.is-directional` flips only under RTL while an ordinary `.iyaaz-icon` does not receive that transform.

- [ ] **Step 6: Verify reduced-motion compatibility structurally/browser-side**

Emulate reduced motion and confirm no critical control depends on animation to become usable or visible.

- [ ] **Step 7: Run the complete local/CI-equivalent verification set**

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Expected: zero failures.

- [ ] **Step 8: Fix any discovered defect using root-cause discipline**

If a browser or RTL failure appears, read the first meaningful failure, reproduce it in the focused test, make the smallest responsible change, rerun the focused test, then rerun the full verification set. Do not weaken the matrix or audit to obtain green status.

---

## Task 8: Final Phase 4 Candidate, Preview Attempt, and PR Evidence

**Files:**
- Modify: PR #1 body only after code/test verification.
- No merge; no Production deployment.

**Interfaces:**
- Produces: exact Phase 4 candidate SHA and evidence packet.

- [ ] **Step 1: Record the exact branch head SHA after the final 4E fix/commit**

All subsequent evidence must reference this SHA.

- [ ] **Step 2: Verify canonical Push/PR CI for the same SHA**

Require both `quality` and `browser` jobs PASS. Inspect job steps, not only workflow conclusion. Fetch the final Playwright report artifact and record its artifact ID/digest.

- [ ] **Step 3: Re-check Vercel project linkage**

List connected Vercel projects and look specifically for a project linked to `Mstrq4/iyaaz`. If it exists, create/inspect a Preview only (not Production) and verify it against the exact candidate. If it still does not exist, record Preview as `NOT VERIFIED`; do not deploy into an unrelated project.

- [ ] **Step 4: Update PR #1 truthfully**

Append Phase 4 evidence including:

- final candidate SHA;
- 4A/4B/4C/4D/4E commit/candidate evidence;
- canonical identity/icon changes;
- theme and shell behavior;
- required viewport matrix result;
- logic/Python/data/RTL/lint/typecheck/build/Playwright results;
- font delivery limitation if no legal Thmanyah web delivery path exists;
- Preview PASS or NOT VERIFIED;
- explicit statement: no merge and no Production deployment.

- [ ] **Step 5: Final Phase 4 report and STOP**

Report only evidence actually observed. State the next product phase (Phase 5: library/detail surfaces + Dynamic Prompt Builder) and wait for user confirmation before beginning it.

## Rollback Strategy

Phase 4 is additive/reversible on `feat/iyaaz-platform`. If a subphase proves unacceptable, revert only that subphase's commit(s) while preserving all Phase 3 data/search/API work. Do not rewrite shared branch history and do not force-push.
