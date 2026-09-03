# IYAAZ Phase 6 Local Workspace & Product Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete IYAAZ’s browser-local working experience with favorites, history, reusable client profiles, a real bilingual landing page, documentation, truthful catalog statistics, and responsive/accessibility closure while preserving the verified library and deterministic Prompt Builder.

**Architecture:** Keep the canonical library server-owned and sanitized. Store only user-local workspace state in versioned `localStorage` keys with an in-memory fallback, a same-tab custom event, and the browser `storage` event for cross-tab synchronization. Resolve local record IDs against the canonical library through a bounded batch read endpoint instead of duplicating the full catalog in browser storage. Prompt Builder remains deterministic and adds an optional local client-context section. Public content/statistics remain server-rendered from existing taxonomy/manifest data.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.8, browser Web Storage, static JSON, existing IYAAZ SVG icon system, Playwright desktop/mobile, Node test runner, Python repository gates.

**Spec:** `docs/superpowers/specs/2026-09-03-iyaaz-phase-6-local-workspace-product-experience-design.md`

## Global Constraints

- Reuse `feat/iyaaz-platform` and PR #1; do not create a replacement branch or PR.
- Arabic and English are first-class; all new CSS uses logical properties and must pass `npm run test:rtl`.
- No database, Supabase, authentication, direct AI/model API, runtime translation API, or file/image upload control.
- `sessionStorage` remains limited to in-progress Prompt Builder drafts.
- Favorites, history and client profiles use browser-local storage only; never send profile or prompt content to IYAAZ APIs.
- Never store duplicate library records in `localStorage`; persist IDs and user-authored metadata only.
- Never expose source/reference URLs or the private workbook.
- Preserve current library/detail/Prompt Builder behavior and the Phase 4 responsive matrix.
- Prefer native semantic controls; no hover-only critical interaction.
- No merge to `main` and no production deployment without explicit user approval.
- Final Phase 6 evidence must refer to one exact candidate SHA.

---

### Task 1: Phase 6A — typed browser-local workspace foundation

**Files:**
- Create: `src/lib/workspace/types.ts`
- Create: `src/lib/workspace/storage.ts`
- Create: `src/lib/workspace/favorites.ts`
- Create: `src/lib/workspace/history.ts`
- Create: `src/lib/workspace/clients.ts`
- Create: `src/lib/workspace/index.ts`
- Create: `src/components/workspace/useWorkspaceCollection.ts`
- Create: `tests/ts/workspace-storage.test.ts`
- Create: `tests/ts/workspace-models.test.ts`

**Core types:**

```ts
export interface FavoriteEntry {
  recordId: number;
  savedAt: string;
}

export interface HistoryEntry {
  recordId: number;
  lastOpenedAt: string;
  openCount: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  businessDescription: string;
  brandColors: string;
  tone: string;
  constraints: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const WORKSPACE_KEYS = {
  favorites: 'iyaaz:favorites:v1',
  history: 'iyaaz:history:v1',
  clients: 'iyaaz:clients:v1',
} as const;

export const HISTORY_LIMIT = 200;
```

**Storage interface:**

```ts
export const WORKSPACE_CHANGE_EVENT = 'iyaaz:workspace-change';

export function readWorkspaceRaw(key: string): string;
export function writeWorkspaceRaw(key: string, raw: string): void;
export function removeWorkspaceRaw(key: string): void;
export function subscribeWorkspace(key: string, onStoreChange: () => void): () => void;
```

Implementation rules:
- return `''` during SSR;
- maintain a module-level in-memory map as fallback;
- catch `SecurityError`/quota/storage access failures;
- after a successful logical write, dispatch `CustomEvent(WORKSPACE_CHANGE_EVENT, { detail: key })` for the current tab;
- also listen to the native `storage` event for changes from other same-origin tabs;
- parser functions reject malformed values and return safe empty arrays rather than throwing.

**Pure model interfaces:**

```ts
export function parseFavorites(raw: string): FavoriteEntry[];
export function toggleFavorite(entries: readonly FavoriteEntry[], recordId: number, now: string): FavoriteEntry[];
export function isFavorite(entries: readonly FavoriteEntry[], recordId: number): boolean;

export function parseHistory(raw: string): HistoryEntry[];
export function recordHistory(entries: readonly HistoryEntry[], recordId: number, now: string): HistoryEntry[];

export function parseClientProfiles(raw: string): ClientProfile[];
export function createClientProfile(input: ClientProfileInput, now: string, id: string): ClientProfile;
export function updateClientProfile(profiles: readonly ClientProfile[], id: string, patch: ClientProfileInput, now: string): ClientProfile[];
export function removeClientProfile(profiles: readonly ClientProfile[], id: string): ClientProfile[];
```

**Hook interface:**

```ts
export function useWorkspaceCollection<T>(options: {
  key: string;
  parse: (raw: string) => T;
  serialize: (value: T) => string;
  empty: T;
}): readonly [T, (next: T) => void, () => void];
```

Use `useSyncExternalStore` so same-tab custom events and cross-tab `storage` events share one subscription mechanism.

- [ ] **Step 1: Write RED storage tests** covering SSR-safe empty reads, malformed JSON, blocked-storage fallback, same-tab notification contract, and serializer round trips.
- [ ] **Step 2: Write RED pure-model tests** for favorite toggle/deduplication, history increment + recent ordering + `HISTORY_LIMIT`, and client create/update/delete normalization.
- [ ] **Step 3: Run `npm run test:logic`** and verify the new tests fail because workspace modules do not exist.
- [ ] **Step 4: Implement the minimal workspace modules and external-store hook** without importing React into pure model files.
- [ ] **Step 5: Run `npm run test:logic`** and verify GREEN.
- [ ] **Step 6: Run `npm run typecheck` and `npm run lint`** to catch browser/server boundary mistakes.
- [ ] **Step 7: Commit** the 6A foundation with a focused commit message.

---

### Task 2: Phase 6B — favorites, history and canonical record resolution

**Files:**
- Create: `src/app/api/shortcuts/route.ts`
- Create: `src/lib/workspace/records.ts`
- Create: `src/components/workspace/FavoriteButton.tsx`
- Create: `src/components/workspace/HistoryRecorder.tsx`
- Create: `src/components/workspace/WorkspaceRecordList.tsx`
- Create: `src/components/workspace/FavoritesView.tsx`
- Create: `src/components/workspace/HistoryView.tsx`
- Create: `src/app/[locale]/favorites/page.tsx`
- Create: `src/app/[locale]/history/page.tsx`
- Create: `src/styles/workspace.css`
- Modify: `src/components/library/LibraryRow.tsx`
- Modify: `src/components/library/ShortcutDetail.tsx`
- Modify: `src/app/[locale]/library/[id]/page.tsx`
- Modify: `src/lib/i18n.ts`
- Modify: `src/styles/library.css`
- Modify: `src/styles/detail.css`
- Modify: `tests/e2e/library.spec.ts`
- Create: `tests/e2e/workspace.spec.ts`
- Create: `tests/ts/workspace-records.test.ts`

**Batch record endpoint:**

`GET /api/shortcuts?ids=3,7,22`

Contract:
- parse comma-separated positive safe integers only;
- deduplicate IDs while preserving request order;
- maximum 100 IDs per request; invalid/oversized input returns `400`;
- response is `{ items: LibraryRecord[] }` using only the existing sanitized public contract;
- missing IDs are omitted, not fabricated;
- no write method is added.

Client record resolver chunks arbitrary local ID lists into groups of 100 and merges results in the original local order:

```ts
export async function resolveWorkspaceRecords(
  ids: readonly number[],
  fetcher: typeof fetch = fetch,
): Promise<LibraryRecord[]>;
```

**Favorite button:**

```tsx
<FavoriteButton locale={locale} recordId={record.id} />
```

Requirements:
- use existing `favorite` icon;
- `aria-pressed` reflects state;
- accessible Arabic/English label;
- fixed 44px target with no layout shift;
- update local store immediately.

**History recorder:**

```tsx
<HistoryRecorder recordId={record.id} />
```

Mounted on the detail route only; it records one open on initial client mount and does not create a server request.

**Favorites/history pages:**
- read IDs from the local workspace store;
- resolve only referenced IDs through the batch endpoint;
- discard missing canonical IDs from rendered results;
- search the resolved records using existing `normalizeSearchText` semantics;
- favorites sort: newest-saved default plus shortcut/name choices;
- history sort: most-recent default;
- remove one entry;
- clear-all uses a native or custom confirmation flow that is keyboard/touch reachable;
- meaningful empty state with link to `/{locale}/library`.

- [ ] **Step 1: Add RED unit tests** for strict batch-ID parsing/chunking/order preservation.
- [ ] **Step 2: Add RED Playwright tests** for favorite from a library row, persistence after reload, favorite from detail, history recording/incrementing, removing entries, clear confirmation, empty states, Arabic/English labels, and zero upload controls.
- [ ] **Step 3: Run focused logic and Playwright tests** and capture RED before production code exists.
- [ ] **Step 4: Implement the batch endpoint and record resolver** through `loadLibraryRecords()`/`findLibraryRecordById()` only.
- [ ] **Step 5: Implement `FavoriteButton` and `HistoryRecorder`** using the 6A store.
- [ ] **Step 6: Implement favorites/history routes and views** with no server persistence.
- [ ] **Step 7: Integrate favorite controls into `LibraryRow` and `ShortcutDetail`** without converting the whole detail page into a Client Component.
- [ ] **Step 8: Run focused Playwright tests** and verify GREEN.
- [ ] **Step 9: Run `npm run test:rtl`, `npm run lint`, and `npm run typecheck`**.
- [ ] **Step 10: Commit** 6B.

---

### Task 3: Phase 6C — local client profiles and deterministic Prompt Builder context

**Files:**
- Create: `src/components/workspace/ClientProfilesView.tsx`
- Create: `src/app/[locale]/clients/page.tsx`
- Modify: `src/components/prompt/PromptBuilder.tsx`
- Modify: `src/lib/prompt/assemble.ts`
- Modify: `src/lib/prompt/copy.ts`
- Modify: `src/lib/prompt/index.ts`
- Modify: `src/lib/i18n.ts`
- Modify: `src/styles/workspace.css`
- Modify: `src/styles/prompt-builder.css`
- Modify: `tests/ts/prompt-assemble.test.ts`
- Create: `tests/e2e/client-profiles.spec.ts`
- Modify: `tests/e2e/prompt-builder.spec.ts`

**Prompt context type:**

```ts
export interface PromptClientContext {
  name: string;
  businessDescription: string;
  brandColors: string;
  tone: string;
  constraints: string;
  notes: string;
}

export interface AssemblePromptOptions {
  record: LocalizedLibraryRecord;
  language: PromptLanguage;
  fields: readonly PromptFieldValue[];
  notes?: string;
  client?: PromptClientContext;
}
```

Prompt output gains a localized `Client context` / `سياق العميل` section immediately before project inputs. Include non-empty profile fields only.

Override rule is deterministic, not AI-inferred. If a populated explicit Prompt Builder field label/source fragment matches one of these semantic aliases, omit the corresponding generic profile line:
- brand colors: `brand color`, `brand palette`, `ألوان الهوية`, `الوان الهوية`;
- tone: `tone`, `نبرة`;
- constraints: `constraint`, `قيود`;
- business description: `business`, `activity`, `نشاط`, `نبذة`.

The client `name` remains contextual and is not overridden by a generic project field.

**Prompt draft:** extend the current session-only draft shape:

```ts
interface PromptDraft {
  values: Record<string, string>;
  notes: string;
  clientId: string;
}
```

Selected client profile therefore remains per-record/per-output-language session state and does not become a new persistent preference.

**Client route:**
- create profile with `crypto.randomUUID()`;
- edit existing profile;
- delete with explicit confirmation;
- all labels bilingual;
- no network mutation requests;
- empty collection state explains that profiles remain in this browser.

- [ ] **Step 1: Add RED pure prompt tests** proving client section order, omission of empty profile fields, alias-based override behavior, Arabic/English labels, and unchanged output when no client is supplied.
- [ ] **Step 2: Add RED Playwright tests** for create/edit/delete profile, persistence across reload, Prompt Builder profile selection, session restoration of selected profile, deterministic generated output containing client context, and no non-GET network request caused by profile operations.
- [ ] **Step 3: Run focused tests** and verify RED.
- [ ] **Step 4: Implement client CRUD UI** over the 6A store.
- [ ] **Step 5: Extend `assemblePrompt` purely** with optional client context and alias-based override logic.
- [ ] **Step 6: Extend Prompt Builder** with a profile selector sourced from local profiles and store `clientId` in the existing session draft.
- [ ] **Step 7: Run focused logic + Playwright tests** and verify GREEN.
- [ ] **Step 8: Run lint/typecheck/RTL audit**.
- [ ] **Step 9: Commit** 6C.

---

### Task 4: Phase 6D — real landing, documentation and truthful statistics

**Files:**
- Create: `src/lib/content/copy.ts`
- Create: `src/components/content/CatalogStats.tsx`
- Create: `src/app/[locale]/docs/page.tsx`
- Create: `src/app/[locale]/statistics/page.tsx`
- Create: `src/styles/content-pages.css`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/lib/i18n.ts`
- Modify: `src/app/globals.css`
- Create: `tests/ts/catalog-statistics.test.ts`
- Create: `tests/e2e/content-pages.spec.ts`

**Server data source:**

Use `getLibraryTaxonomy()` for live derived totals/distributions. Keep the existing manifest test as the artifact-level source of exact snapshot counts.

```ts
const taxonomy = await getLibraryTaxonomy();
// taxonomy.totals.records === 5812
// taxonomy.totals.domains === 9
// taxonomy.totals.categories === 21
// taxonomy.totals.subcategories === 364
```

Do not add analytics or usage counters.

**Landing page content:**
- bilingual product value statement;
- CTA to `/{locale}/library` and `/{locale}/docs`;
- workflow steps: find → configure → generate → copy;
- real catalog totals;
- browser-local privacy statement;
- no fake testimonials, user counts or growth claims.

**Documentation page sections:**
- discovering/searching/filtering shortcuts;
- detail page fields;
- Prompt Builder and independent output language;
- attachment reminders/no uploads;
- favorites/history;
- client profiles;
- browser-local privacy;
- current English translation fallback notice.

**Statistics page:**
- totals grid;
- shortcut-type distribution;
- domain distribution sorted deterministically by count descending, then Arabic name;
- category breakdown only where it remains readable; no meaningless charts.

**Copy organization:** keep long page copy in `src/lib/content/copy.ts` rather than further bloating `src/lib/i18n.ts`; `i18n.ts` retains shell/navigation labels.

- [ ] **Step 1: Add RED statistics tests** that build from existing taxonomy and assert exact totals/type counts without hard-coded invented business metrics.
- [ ] **Step 2: Add RED Playwright content tests** for Arabic/English landing/docs/statistics routes, truthful totals, CTAs, translation notice, correct document direction, and absence of horizontal overflow on mobile.
- [ ] **Step 3: Run focused tests** and verify RED.
- [ ] **Step 4: Implement content copy and statistics projection**.
- [ ] **Step 5: Replace the temporary home page and add docs/statistics server routes**.
- [ ] **Step 6: Add scoped content-page styles** using existing semantic tokens and selective glass only.
- [ ] **Step 7: Run focused tests, lint, typecheck and RTL audit** and verify GREEN.
- [ ] **Step 8: Commit** 6D.

---

### Task 5: Phase 6E — product navigation, responsive/accessibility closure and Phase 6 verification

**Files:**
- Create: `src/components/shell/AppNavigation.tsx`
- Modify: `src/components/shell/AppHeader.tsx`
- Modify: `src/lib/i18n.ts`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/shell.spec.ts`
- Modify: `tests/e2e/phase4e.spec.ts`
- Modify: `tests/e2e/workspace.spec.ts`
- Modify: `tests/e2e/client-profiles.spec.ts`
- Modify: `tests/e2e/content-pages.spec.ts`
- Update: PR #1 evidence after the final candidate is verified

**Navigation contract:**

```ts
const primaryItems = [
  ['home', `/${locale}`],
  ['library', `/${locale}/library`],
  ['favorites', `/${locale}/favorites`],
  ['history', `/${locale}/history`],
  ['clients', `/${locale}/clients`],
  ['docs', `/${locale}/docs`],
  ['statistics', `/${locale}/statistics`],
] as const;
```

`AppNavigation` is a small Client Component using `usePathname()` only for active-state semantics and local menu state. Desktop exposes the full concise nav. Mobile uses a menu button with `aria-expanded`/`aria-controls`; clicking a route closes the menu. Do not use an effect solely to reset state after route changes.

**Responsive verification:**
Maintain the existing explicit widths:
`320 / 360 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920`
for Arabic/English and Light/Dark. Extend the matrix to verify the new header/navigation does not overflow.

**Accessibility closure:**
- favorite controls expose `aria-pressed`;
- clear/delete confirmations are keyboard and touch usable;
- profile form fields have explicit labels;
- mobile menu has an accessible name and state;
- local save/remove feedback uses a polite status where user feedback is needed;
- all interactive targets remain at least 44px;
- focus remains visible;
- reduced motion continues to collapse shared durations.

**Storage-disabled browser scenario:**
Use a Playwright init script that overrides Storage operations to throw and prove favorites/client operations remain functional within the current page session using the memory fallback. Do not claim persistence across reload when persistence is deliberately unavailable.

- [ ] **Step 1: Add RED shell/navigation tests** for all seven destinations, current-page state, mobile menu, keyboard activation and 320px no-overflow.
- [ ] **Step 2: Add/extend RED resilience tests** for blocked storage fallback and accessibility semantics.
- [ ] **Step 3: Implement `AppNavigation` and shell labels/styles** with the smallest changes to existing `AppHeader`.
- [ ] **Step 4: Run focused E2E files**: `shell`, `workspace`, `client-profiles`, `content-pages`, `prompt-builder`, `library`.
- [ ] **Step 5: Run the full repository quality contract**:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

- [ ] **Step 6: Verify the full responsive bidi/theme matrix** and zero unintentional overflow.
- [ ] **Step 7: Push the exact Phase 6 candidate and wait for GitHub Actions `quality` + `browser` jobs**; do not certify from local/source inspection alone.
- [ ] **Step 8: Fetch the Playwright artifact and record its digest** for the same candidate SHA.
- [ ] **Step 9: Update PR #1 with Phase 6 scope, RED→GREEN evidence, final candidate SHA, CI run ID, Playwright count/artifact/digest, risks and explicit `NOT VERIFIED` items.
- [ ] **Step 10: Stop before Phase 7** and report Phase 6 status. Do not merge and do not deploy production.

---

## Phase 6 Definition of Done

Phase 6 is `PASS` only when all five tasks above are complete and one exact final candidate has:

- logic/data/RTL tests PASS;
- ESLint PASS;
- TypeScript typecheck PASS;
- Next.js production build PASS;
- full Playwright desktop/mobile regression PASS;
- new favorites/history/client-profile workflows verified at browser level;
- blocked-storage fallback verified at browser level;
- landing/docs/statistics verified in Arabic and English;
- responsive matrix PASS with no accidental horizontal overflow;
- PR #1 updated and still Draft/Open/Unmerged.

Vercel Preview remains outside Phase 6 and is handled in the release/Phase 8 track after a project is linked to `Mstrq4/iyaaz`.