# IYAAZ Phase 6 — Local Workspace & Product Experience Design

## Status

Approved design direction. This specification defines Phase 6 only. It does not authorize merge or production deployment.

## Objective

Turn the already-verified shortcut library and deterministic Prompt Builder into a complete browser-local working experience without introducing a database, user accounts, server-side profile storage, direct AI-model calls, or file uploads.

Phase 6 completes the everyday product workflow around the library:

- remember useful shortcuts locally;
- keep a local activity history;
- reuse local client profiles in Prompt Builder;
- replace the temporary foundation home with a real bilingual landing page;
- add documentation and truthful statistics pages;
- close navigation, responsive and accessibility behavior for these surfaces.

## Fixed architecture constraints

The existing repository contracts remain authoritative:

1. Arabic and English are first-class.
2. Use logical CSS properties only; no physical directional properties.
3. No database.
4. No direct AI-model integration.
5. No image/file upload controls.
6. Prompt, client, favorite and history data remain browser-local only.
7. `sessionStorage` remains the home for in-progress Prompt Builder drafts.
8. `localStorage` is used for explicitly persistent local workspace data.
9. Public library data continues to flow through the existing sanitized server boundary.
10. Merge and production remain explicit approval gates.

## Phase 6A — Browser-local workspace foundation

### Storage model

Introduce a small typed browser-storage layer with versioned keys and safe parsing.

Suggested keys:

- `iyaaz:favorites:v1`
- `iyaaz:history:v1`
- `iyaaz:clients:v1`

Theme/language keys remain owned by their existing runtime code.

The storage layer must:

- never access `window` during server rendering;
- tolerate blocked/unavailable storage;
- tolerate malformed/legacy JSON without crashing the UI;
- expose deterministic read/write/update/remove helpers;
- notify same-tab consumers when local workspace state changes;
- use bounded history to avoid unbounded growth;
- store record identifiers and minimal user-authored metadata, not copies of the 11 MB library snapshot.

### Favorites shape

A favorite stores at minimum:

- `recordId`
- `savedAt`

The library record remains resolved from the canonical library source at render time.

### History shape

A history entry stores at minimum:

- `recordId`
- `lastOpenedAt`
- `openCount`

Opening the same shortcut updates its existing entry instead of creating duplicates. History is ordered by most recent use.

### Client profile shape

A client profile is browser-local user-authored data:

- `id`
- `name`
- `businessDescription`
- `brandColors`
- `tone`
- `constraints`
- `notes`
- `createdAt`
- `updatedAt`

No server endpoint is added for client profiles.

## Phase 6B — Favorites & History experience

### Routes

- `/{locale}/favorites`
- `/{locale}/history`

### Favorite controls

Favorite/unfavorite controls appear in both:

- library result rows/cards;
- shortcut detail pages.

Requirements:

- accessible button name in Arabic/English;
- pressed state communicated semantically;
- state updates immediately in the current tab;
- no layout shift when toggled;
- unavailable storage degrades to the in-memory session fallback rather than breaking the page.

### Favorites page

The favorites page shows only records whose IDs still exist in the library.

It supports:

- search within favorites;
- deterministic sorting;
- remove one favorite;
- clear all with explicit confirmation;
- useful empty state linking back to the library.

### History page

The history page shows recently opened shortcuts with last-opened context and open count.

It supports:

- search;
- most-recent-first default order;
- remove one entry;
- clear all with confirmation;
- empty state linking to the library.

Personal routes are intended to be `noindex` later in the SEO phase.

## Phase 6C — Local client profiles + Prompt Builder integration

### Routes / placement

Add a lightweight profile management surface at:

- `/{locale}/clients`

Prompt Builder receives a client-profile selector but continues to work with no profile selected.

### Profile management

Support:

- create;
- edit;
- delete with confirmation;
- select a profile for Prompt Builder.

No authentication is introduced in Phase 6.

### Prompt composition behavior

When a profile is selected, its non-empty fields are deterministically included as an explicit client-context section in the final prompt.

Rules:

- empty profile fields are omitted;
- selecting a profile must not mutate the library record;
- user-entered Prompt Builder values still override generic profile context where they refer to the same concept;
- output remains deterministic;
- no network call is introduced;
- no client profile content is stored on the server.

## Phase 6D — Landing, Documentation & Statistics

### Landing route

Replace the current foundation-only `/{locale}` page with a real bilingual landing experience.

The landing page should explain:

- what IYAAZ is;
- what the shortcut library contains;
- how the workflow works: find → configure → generate prompt → copy;
- the size of the real catalog using derived snapshot statistics;
- privacy boundary: local workspace data stays in the browser;
- direct calls to action to the library and documentation.

Use the existing data-dense/editorial identity, selective glass surfaces and established token system. Avoid generic AI marketing visuals and invented metrics.

### Documentation route

- `/{locale}/docs`

Documentation covers:

- finding shortcuts;
- filters and sorting;
- shortcut detail fields;
- Prompt Builder behavior;
- output-language selector;
- attachment reminders;
- favorites/history;
- local client profiles;
- privacy/storage explanation;
- known English-translation fallback behavior until the full translated snapshot is generated.

### Statistics route

- `/{locale}/statistics`

Statistics are derived from the canonical sanitized snapshot/manifest only.

Initial metrics include:

- total records;
- total domains;
- total categories;
- total subcategories;
- shortcut-type distribution;
- domain/category distributions where useful.

Do not invent user counts, prompt counts, usage activity, growth, satisfaction, or business KPIs.

## Phase 6E — Navigation, responsive and accessibility closure

### Primary navigation

Add the product surfaces coherently to the bilingual shell:

- Home
- Library
- Favorites
- History
- Clients
- Documentation
- Statistics

Desktop should remain concise and data-oriented. Mobile must use an intentionally designed navigation treatment rather than letting the desktop header overflow.

### Accessibility

All Phase 6 interactions must support:

- keyboard navigation;
- visible focus;
- native semantic form labels;
- accessible favorite pressed state;
- confirmation flows reachable by keyboard/touch;
- proper live feedback for save/remove/copy-like actions where needed;
- reduced-motion behavior;
- Arabic RTL and English LTR.

### Responsive targets

Preserve the established verification matrix with explicit attention to narrow mobile widths and zero unintentional horizontal overflow.

## Error and fallback behavior

Phase 6 must define graceful states for:

- storage unavailable;
- malformed local data;
- favorite/history references to deleted/missing record IDs;
- empty favorites/history/client collections;
- failed library record resolution;
- English catalog translation overlay unavailable.

No fallback may silently upload or server-persist local workspace content.

## Testing strategy

Use RED → GREEN for each behavior group.

### Unit / logic

Test:

- storage parsing/versioning;
- favorite toggling;
- bounded/deduplicated history;
- client profile CRUD helpers;
- deterministic client-context prompt composition;
- derived statistics.

### Browser E2E

Test Arabic and English on desktop/mobile for:

- favorite from library and detail;
- favorites persistence across reload;
- history recording and clearing;
- profile create/edit/delete;
- Prompt Builder profile selection and generated prompt inclusion;
- no file input or model API call;
- landing/docs/statistics rendering;
- navigation;
- storage-disabled fallback where practical;
- keyboard/focus behavior;
- RTL/LTR and overflow.

Run the existing full regression suite after Phase 6 changes.

## Explicitly out of scope for Phase 6

Deferred to Phase 7:

- public/private/shared deployment modes;
- HMAC-signed limited-share credentials;
- protected-content middleware/policy;
- complete SEO/GEO/REO implementation;
- canonical/hreflang/sitemap/robots/structured-data rollout;
- indexing policy for private/shared/personal routes.

Deferred to Phase 8 / release track:

- full independent candidate review;
- Vercel project linking/preview verification;
- final translated English snapshot generation when the Azure secret is available in an approved secret store;
- final merge approval;
- production deployment approval;
- post-production verification.

## Acceptance criteria

Phase 6 is complete only when:

1. Favorites, history and clients work without a server database.
2. Browser storage failures do not crash the app.
3. Favorites/history resolve against canonical library records rather than storing duplicate records.
4. Prompt Builder can use an optional local client profile without a network request.
5. Landing, docs and statistics are bilingual and use only truthful/derived facts.
6. New navigation is usable in RTL/LTR and on narrow mobile.
7. Existing library/detail/Prompt Builder behavior remains regression-green.
8. Repository quality gates and full Playwright desktop/mobile suite pass on the exact Phase 6 candidate SHA.
9. PR #1 remains unmerged and no production deployment occurs without explicit user approval.
