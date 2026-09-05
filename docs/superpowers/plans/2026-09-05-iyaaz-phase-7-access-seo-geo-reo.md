# IYAAZ Phase 7 Access Modes + SEO/GEO/REO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stateless public/private/shared deployment access controls and complete truthful bilingual SEO/GEO/REO delivery without changing IYAAZ's no-database, browser-local workspace architecture.

**Architecture:** Keep access configuration and HMAC credentials entirely server-side, using one versioned credential format, an HttpOnly cookie after same-origin exchange, early `proxy.ts` rejection plus authoritative page/API guards, and exact-record scoping for shared mode. Keep discovery metadata in dedicated SEO helpers so page metadata, canonical/alternate policy, JSON-LD, sitemap and robots all consume the same access/indexability rules instead of duplicating policy in individual routes.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2, TypeScript 5.8, Node `node:crypto` HMAC-SHA256 + `timingSafeEqual`, Next.js Metadata/robots/sitemap APIs, HttpOnly cookies, existing static sanitized JSON library, Playwright desktop/mobile, Node test runner, Python repository safety gates.

**Spec:** `docs/superpowers/specs/2026-09-05-iyaaz-phase-7-access-seo-geo-reo-design.md`

## Global Constraints

- Reuse `feat/iyaaz-platform` and PR #1; do not create a replacement PR.
- Do not merge to `main` and do not deploy production without a separate explicit user approval.
- Access modes are exactly `public`, `private`, and `shared`; unknown/misconfigured protected modes fail closed.
- `IYAAZ_ACCESS_SECRET` is server-only and must never use `NEXT_PUBLIC_`.
- Use one current HMAC secret only; rotating it intentionally invalidates existing credentials.
- No database, Supabase, accounts, OAuth, persistent server session store, or per-token revocation database.
- No direct AI/model API and no file/image upload controls.
- Favorites, history and client profiles stay browser-local and never enter credentials or server logs.
- Shared scope is one exact shortcut record only; no collection bundles, search scope or arbitrary route scopes.
- Public library data continues through the existing sanitized contract; never expose workbook/source/reference URLs.
- Arabic and English remain first-class presentation routes.
- English detail pages using canonical-Arabic fallback are `noindex,follow` and canonicalize to Arabic until a real English overlay exists.
- Personal routes (`favorites`, `history`, `clients`) and access surfaces are always `noindex,nofollow`.
- Private/shared content is never public SEO inventory.
- Query-state library pages canonicalize to clean `/{locale}/library` and are `noindex,follow`.
- Structured data must be truthful and use canonical URLs only; no ratings, reviews, authors, usage counts, fabricated FAQ content, keyword stuffing or non-standard AI metadata.
- Final Phase 7 evidence must refer to one exact candidate SHA with full desktop/mobile regression and access/SEO matrices green.

---

### Task 1: Phase 7A — strict access configuration, credentials and maintainer link generation

**Files:**
- Create: `src/lib/access/types.ts`
- Create: `src/lib/access/config.ts`
- Create: `src/lib/access/credential.ts`
- Create: `src/lib/access/links.ts`
- Create: `src/lib/access/index.ts`
- Create: `scripts/generate_access_link.ts`
- Create: `tests/ts/access-config.test.ts`
- Create: `tests/ts/access-credential.test.ts`
- Modify: `.env.example`
- Modify: `package.json`

**Interfaces:**

```ts
export type AccessMode = 'public' | 'private' | 'shared';
export type AccessCredentialKind = 'private' | 'share';
export type AccessCredentialScope = 'app' | 'shortcut';

export interface AccessCredentialPayload {
  v: 1;
  kind: AccessCredentialKind;
  exp: number;
  iat: number;
  scope: AccessCredentialScope;
  recordId?: number;
}

export interface AccessConfig {
  mode: AccessMode;
  secret: string | null;
  siteUrl: URL;
}

export function readAccessConfig(env?: NodeJS.ProcessEnv): AccessConfig;
export function signAccessCredential(payload: AccessCredentialPayload, secret: string): string;
export function verifyAccessCredential(token: string, secret: string, nowSeconds?: number): AccessCredentialPayload | null;
export function buildLocalizedAccessUrl(options: {
  siteUrl: URL;
  locale: 'ar' | 'en';
  credential: string;
}): URL;
```

Credential wire format is `base64url(payload-json).base64url(hmac-sha256(payload-segment))`. Validation order must be structural parse → signature-length check → constant-time signature comparison → payload validation → expiry/future-issued checks. Use a maximum future `iat` skew of 300 seconds. Require `private + app + no recordId`; require `share + shortcut + positive safe integer recordId`.

`readAccessConfig()` rules:
- missing mode defaults to `public` only when the variable is absent/blank;
- any non-empty unknown mode throws;
- `private`/`shared` require `IYAAZ_ACCESS_SECRET` trimmed length >= 32 characters or throw;
- `public` ignores an absent access secret;
- `NEXT_PUBLIC_SITE_URL` must parse as absolute `http:` or `https:` URL; invalid values throw.

`.env.example` should keep only the current access contract:

```dotenv
IYAAZ_ACCESS_MODE=public
IYAAZ_ACCESS_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keep existing translation variables below these lines; remove obsolete unused `IYAAZ_PRIVATE_KEY` and `IYAAZ_SHARE_SECRET` examples.

Maintainer CLI contract:

```bash
npm run access:link -- --kind private --expires-in 3600 --locale ar
npm run access:link -- --kind share --record-id 3 --expires-in 86400 --locale en
```

The CLI reads `IYAAZ_ACCESS_SECRET` and `NEXT_PUBLIC_SITE_URL` from process environment, requires explicit positive expiry seconds, prints only the generated localized URL, and never prints the secret or raw payload.

- [ ] **Step 1: Write RED access-config tests** for public default, strict enum parsing, protected-mode missing/short secret failure, valid protected config and invalid site origin.
- [ ] **Step 2: Run `npm run test:logic`** and confirm failures are caused by missing `src/lib/access/*` modules.
- [ ] **Step 3: Implement `types.ts` and `config.ts` minimally** to satisfy the configuration tests.
- [ ] **Step 4: Run `npm run test:logic`** and verify the configuration tests pass.
- [ ] **Step 5: Write RED credential tests** covering round trip, payload tampering, signature tampering, malformed base64/JSON, wrong version, expired token, future `iat > 300s`, invalid kind/scope combinations, missing/extra `recordId`, and different-signature-length rejection without throwing.
- [ ] **Step 6: Implement `credential.ts`** with `createHmac('sha256', secret)` and `timingSafeEqual()` only after equal-length buffers are established.
- [ ] **Step 7: Run `npm run test:logic`** and verify all credential tests pass.
- [ ] **Step 8: Write RED link-generation tests** proving the URL path is exactly `/{locale}/access`, the credential is stored only in the `#credential=` fragment, and no secret appears in the URL.
- [ ] **Step 9: Implement `links.ts` and `scripts/generate_access_link.ts`**, add `"access:link": "node --experimental-strip-types scripts/generate_access_link.ts"` to `package.json`, and update `.env.example`.
- [ ] **Step 10: Run `npm run test:logic && npm run lint && npm run typecheck`** and verify GREEN.
- [ ] **Step 11: Commit** Task 1 with `feat: add stateless access credential primitives`.

---

### Task 2: Phase 7B — secure credential exchange, HttpOnly cookie and localized access surface

**Files:**
- Create: `src/lib/access/cookie.ts`
- Create: `src/lib/access/authorization.ts`
- Create: `src/app/api/access/exchange/route.ts`
- Create: `src/components/access/AccessExchange.tsx`
- Create: `src/app/[locale]/access/page.tsx`
- Create: `src/styles/access.css`
- Create: `tests/ts/access-authorization.test.ts`
- Create: `tests/e2e/access-exchange.spec.ts`
- Modify: `src/app/globals.css`
- Modify: `src/lib/i18n.ts`

**Interfaces:**

```ts
export const ACCESS_COOKIE = 'iyaaz_access_v1';

export type AccessDecision =
  | { allowed: true; payload: AccessCredentialPayload | null }
  | { allowed: false; status: 401 | 404; reason: 'missing' | 'invalid' | 'scope' | 'record' | 'mode' };

export function authorizeAccess(options: {
  config: AccessConfig;
  token: string | undefined;
  target: { kind: 'app' } | { kind: 'shortcut'; recordId: number } | { kind: 'api' };
  nowSeconds?: number;
}): AccessDecision;

export function accessCookieOptions(payload: AccessCredentialPayload, nowSeconds: number, production: boolean): {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number;
};
```

Authorization rules:
- `public`: allow normal app/page/API targets without token;
- `private`: require valid `private/app` token for protected pages and read APIs;
- `shared`: allow only exact `{ kind: 'shortcut', recordId }` matching a valid `share/shortcut` payload; deny app/search/batch/taxonomy inventory;
- invalid/missing private API auth yields `401`;
- shared wrong-scope/wrong-record page access is non-revealing `404`;
- exchange/access routes are outside this function's protected-target set.

`POST /api/access/exchange` body:

```ts
{ credential: string }
```

Success response:

```ts
{ ok: true, redirectTo: '/ar' | '/en' | '/ar/library/3' | '/en/library/3' }
```

The request must also carry a validated locale (`ar|en`) in a small JSON field so the server chooses the localized path. The redirect target is derived from verified payload only. Do not accept absolute `returnTo` values.

The route sets `ACCESS_COOKIE` to the original signed credential with `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` when `NODE_ENV==='production'`, and `maxAge = min(exp-now, 7 days)` while never exceeding credential expiry. Invalid exchange returns a generic `401 { ok:false }` and does not set a cookie.

`AccessExchange` behavior:
- runs only on `/{locale}/access`;
- reads `window.location.hash` after mount;
- extracts only a single `credential` fragment parameter;
- POSTs to same-origin `/api/access/exchange` with `{ credential, locale }`;
- on success uses `window.location.replace(redirectTo)` so the fragment disappears;
- on failure removes the fragment with `history.replaceState` and renders a localized generic invalid/expired message;
- never renders the token into DOM text, attributes, logs or query parameters.

- [ ] **Step 1: Write RED authorization unit tests** for all public/private/shared target combinations and cookie max-age bounds.
- [ ] **Step 2: Run `npm run test:logic`** and verify RED because `authorization.ts`/`cookie.ts` are absent.
- [ ] **Step 3: Implement minimal authorization and cookie helpers** and verify unit GREEN.
- [ ] **Step 4: Write RED Playwright exchange tests** that generate credentials inside the test process using the shared signing helper, visit `/{locale}/access#credential=...`, assert the fragment disappears, assert valid exchange unlock target is returned, and assert invalid/expired credentials show localized generic failure without token text in HTML.
- [ ] **Step 5: Implement exchange route and localized access page/client component** with no public token mint endpoint.
- [ ] **Step 6: Add scoped `access.css` styles** using existing semantic tokens and logical properties; import from `globals.css`.
- [ ] **Step 7: Run focused `playwright test tests/e2e/access-exchange.spec.ts`** under protected-mode test configuration and verify GREEN.
- [ ] **Step 8: Run `npm run lint && npm run typecheck && npm run test:rtl`**.
- [ ] **Step 9: Commit** Task 2 with `feat: add secure localized access exchange`.

---

### Task 3: Phase 7B — authoritative page/API protection, early proxy boundary and shared read-only detail

**Files:**
- Create: `src/lib/access/server.ts`
- Create: `proxy.ts`
- Create: `src/components/access/AccessDenied.tsx` only if a reusable localized non-revealing denial surface is required by page tests
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/library/page.tsx`
- Modify: `src/app/[locale]/library/[id]/page.tsx`
- Modify: `src/app/[locale]/docs/page.tsx`
- Modify: `src/app/[locale]/statistics/page.tsx`
- Modify: `src/app/[locale]/favorites/page.tsx`
- Modify: `src/app/[locale]/history/page.tsx`
- Modify: `src/app/[locale]/clients/page.tsx`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/api/taxonomy/route.ts`
- Modify: `src/app/api/shortcuts/route.ts`
- Modify: `src/app/api/shortcuts/[id]/route.ts`
- Modify: `src/components/library/ShortcutDetail.tsx`
- Create: `tests/e2e/access-modes.spec.ts`

**Server guard interfaces:**

```ts
export async function requireAppPageAccess(locale: 'ar' | 'en'): Promise<void>;
export async function requireShortcutPageAccess(locale: 'ar' | 'en', recordId: number): Promise<{
  sharedReadOnly: boolean;
}>;
export async function requireReadApiAccess(target?: { recordId?: number }): Promise<Response | null>;
```

Implementation details:
- helpers call `readAccessConfig()`, `cookies()`, and `authorizeAccess()`;
- private page denial redirects to `/${locale}/access`;
- shared non-shortcut page denial returns localized `notFound()`/404 rather than inventory hints;
- shared shortcut mismatch returns `notFound()`;
- public mode returns immediately;
- APIs return `401` JSON for missing/invalid protected credentials; shared mode denies search/taxonomy/batch APIs and may allow only exact shortcut-detail API if tests show the detail UI requires it; do not expand shared scope merely for convenience.

Every protected page listed above must invoke the relevant server guard before loading/rendering protected content. `proxy.ts` is an early boundary only: it may redirect obviously unauthenticated private page requests and reject obviously unauthenticated protected APIs, but route/page guards remain authoritative.

Shared read-only rendering contract:
- `ShortcutDetail` receives `sharedReadOnly?: boolean`;
- when `true`, suppress `FavoriteButton`, `HistoryRecorder`, Prompt Builder/client-profile controls and links that enumerate broader inventory;
- keep sanitized shortcut content and localized presentation;
- locale switching between `/ar/library/{sameId}` and `/en/library/{sameId}` remains allowed because scope is record-based, not locale-based.

- [ ] **Step 1: Write RED Playwright mode-matrix tests** for public access, private denial before exchange, valid private cookie unlock, expired/tampered rejection, shared exact-record success, shared wrong-record 404, shared denial of library/docs/statistics/personal routes, and unauthorized protected API responses.
- [ ] **Step 2: Add RED assertions** that shared view has no favorite/history/client/prompt controls and cannot enumerate/search inventory.
- [ ] **Step 3: Run focused mode tests** and capture RED against the currently public-only app.
- [ ] **Step 4: Implement `src/lib/access/server.ts`** and add page/API guard calls one route at a time, running the focused tests after each cluster.
- [ ] **Step 5: Implement shared-read-only `ShortcutDetail` path** without converting server pages into unnecessary Client Components.
- [ ] **Step 6: Add `proxy.ts` early boundary** with matcher excluding Next static/image assets and the exchange/access surface; keep route guards as defense in depth.
- [ ] **Step 7: Run `npm run test:logic && npm run lint && npm run typecheck && npm run test:rtl`**.
- [ ] **Step 8: Run `playwright test tests/e2e/access-exchange.spec.ts tests/e2e/access-modes.spec.ts`** and verify GREEN in the full mode matrix.
- [ ] **Step 9: Commit** Task 3 with `feat: enforce public private and shared access modes`.

---

### Task 4: Phase 7C — canonical metadata, alternates and indexability policy

**Files:**
- Create: `src/lib/seo/site.ts`
- Create: `src/lib/seo/policy.ts`
- Create: `src/lib/seo/metadata.ts`
- Create: `src/lib/seo/index.ts`
- Create: `tests/ts/seo-policy.test.ts`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/library/page.tsx`
- Modify: `src/app/[locale]/library/[id]/page.tsx`
- Modify: `src/app/[locale]/docs/page.tsx`
- Modify: `src/app/[locale]/statistics/page.tsx`
- Modify: `src/app/[locale]/favorites/page.tsx`
- Modify: `src/app/[locale]/history/page.tsx`
- Modify: `src/app/[locale]/clients/page.tsx`
- Modify: `src/app/[locale]/access/page.tsx`
- Create: `tests/e2e/seo-metadata.spec.ts`

**Core interfaces:**

```ts
export function getSiteOrigin(env?: NodeJS.ProcessEnv): URL;

export interface IndexPolicy {
  index: boolean;
  follow: boolean;
  canonicalPath: string;
  alternatePaths?: Partial<Record<'ar' | 'en', string>>;
}

export function publicRoutePolicy(options: {
  mode: AccessMode;
  locale: 'ar' | 'en';
  route: 'home' | 'library' | 'docs' | 'statistics' | 'shortcut' | 'personal' | 'access';
  recordId?: number;
  hasQueryState?: boolean;
  englishTranslationStatus?: 'translated' | 'canonical-fallback';
}): IndexPolicy;

export function buildPageMetadata(options: {
  locale: 'ar' | 'en';
  title: string;
  description: string;
  policy: IndexPolicy;
  siteOrigin: URL;
}): Metadata;
```

Policy requirements:
- public clean home/library/docs/statistics: self-canonical, index/follow, Arabic+English alternates;
- public library with any non-empty query/search/filter/sort/page state: canonical clean library, `noindex,follow`, no sitemap implication;
- public Arabic shortcut detail: self-canonical/indexable;
- public English shortcut with real overlay: self-canonical/indexable + AR/EN alternates;
- public English shortcut using canonical-Arabic fallback: `noindex,follow`, canonical Arabic detail, do not advertise false English alternate inventory;
- personal/access: `noindex,nofollow` always;
- any private/shared page: `noindex,nofollow` and no public alternate inventory.

Do not put credentials or query-state parameters into canonical/alternate/Open Graph URLs. Use only existing brand identity for basic OG title/description/url.

- [ ] **Step 1: Write RED policy unit tests** for every rule above, including query-state and English fallback behavior.
- [ ] **Step 2: Implement `site.ts`, `policy.ts`, `metadata.ts`** and verify unit GREEN.
- [ ] **Step 3: Write RED Playwright metadata tests** asserting rendered canonical, `hreflang`, robots and localized title/description for home/library/docs/statistics/detail/personal/access routes.
- [ ] **Step 4: Add route-level `generateMetadata()` calls** consuming the shared helper; remove any generic layout metadata that would conflict with per-page canonical policy while retaining a safe fallback title template if useful.
- [ ] **Step 5: Ensure library metadata inspects `searchParams` only for presence of non-empty query state** and canonicalizes to the clean route.
- [ ] **Step 6: Ensure detail metadata checks localized record `translationStatus`** so English fallback is not falsely indexable.
- [ ] **Step 7: Run focused SEO Playwright tests** and verify GREEN.
- [ ] **Step 8: Run lint/typecheck/RTL tests**.
- [ ] **Step 9: Commit** Task 4 with `feat: add bilingual canonical metadata policy`.

---

### Task 5: Phase 7D — truthful JSON-LD, sitemap, robots and retrieval-oriented linking

**Files:**
- Create: `src/lib/seo/structured-data.ts`
- Create: `src/lib/seo/sitemap.ts`
- Create: `src/components/seo/JsonLd.tsx`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `tests/ts/seo-structured-data.test.ts`
- Create: `tests/e2e/seo-delivery.spec.ts`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/library/page.tsx`
- Modify: `src/app/[locale]/library/[id]/page.tsx`
- Modify content/detail components only where semantic hierarchy or internal-link text needs a targeted fix

**Structured-data interfaces:**

```ts
export function safeJsonLd(value: unknown): string;
export function websiteJsonLd(options: { siteOrigin: URL; locale: 'ar' | 'en'; name: string }): object;
export function collectionJsonLd(options: { canonicalUrl: URL; locale: 'ar' | 'en'; name: string; description: string }): object;
export function shortcutJsonLd(options: {
  canonicalUrl: URL;
  locale: 'ar' | 'en';
  record: LocalizedLibraryRecord;
  breadcrumbs: readonly { name: string; url: URL }[];
}): readonly object[];
```

`safeJsonLd()` must serialize JSON and escape `<`, `>`, `&`, U+2028 and U+2029 so catalog text cannot terminate the script context. `JsonLd` renders `<script type="application/ld+json">` from only this serializer.

Schemas:
- home: `WebSite`;
- library: `CollectionPage`;
- shortcut detail: `CreativeWork` and `BreadcrumbList`;
- docs/statistics rely on ordinary page metadata unless content later supports stronger schema.

Sitemap helper returns only public/indexable canonical URLs. In public mode include AR+EN home/library/docs/statistics, all Arabic shortcut details, and only genuinely translated English shortcut details. Exclude query states, personal/access routes, missing records and any URL containing `credential`, `token`, fragments or cookies. In private/shared modes return no protected inventory (an empty sitemap URL set is acceptable).

Robots:
- public mode: allow public application crawling while disallowing personal/access route prefixes where useful; rely on page `noindex` as the primary per-page directive;
- private/shared modes: `Disallow: /` for application inventory;
- robots is never used as authorization.

Retrieval/GEO/REO checks should validate existing pages have one clear localized h1, semantic headings/intros, breadcrumb/internal-link hierarchy and meaningful link text. Only make targeted content changes needed to satisfy those checks; do not create hidden text or duplicate SEO pages.

- [ ] **Step 1: Write RED structured-data unit tests** for schema types, canonical-only URLs, source/reference-field absence and script-breakout escaping.
- [ ] **Step 2: Implement JSON-LD helpers/component** and verify unit GREEN.
- [ ] **Step 3: Write RED sitemap-policy tests** covering public inventory, English fallback exclusion and zero protected inventory under private/shared mode.
- [ ] **Step 4: Implement sitemap helper plus `src/app/sitemap.ts` and `src/app/robots.ts`** from the same access/indexability rules.
- [ ] **Step 5: Write RED Playwright delivery tests** for JSON-LD validity, sitemap/robots output, absence of personal/tokenized/source URLs, and semantic h1/internal links.
- [ ] **Step 6: Integrate JSON-LD into home/library/detail server-rendered pages** only.
- [ ] **Step 7: Make only targeted semantic/internal-link corrections required by the tests**; do not add invented FAQ/AI metadata.
- [ ] **Step 8: Run `npm run test:logic`, focused SEO E2E, lint, typecheck and RTL audit** and verify GREEN.
- [ ] **Step 9: Commit** Task 5 with `feat: add structured data sitemap and robots delivery`.

---

### Task 6: Phase 7E — security gate, full access/SEO matrices and final Phase 7 verification

**Files:**
- Create or extend: `scripts/verify_security_boundaries.py`
- Create: `tests/test_phase7_security.py`
- Modify: `.github/workflows/ci.yml` only if the existing `npm test`/Python discovery does not already execute the new security test
- Modify: `tests/e2e/access-modes.spec.ts`
- Modify: `tests/e2e/seo-metadata.spec.ts`
- Modify: `tests/e2e/seo-delivery.spec.ts`
- Modify existing Phase 4–6 E2E files only for regressions caused by the new explicit modes, not to weaken old assertions
- Update: PR #1 evidence after exact final SHA is verified

**Security assertions:**

The Python gate scans source/config/build-relevant files and fails if:
- `NEXT_PUBLIC_IYAAZ_ACCESS_SECRET` or any `NEXT_PUBLIC_*ACCESS*SECRET*` identifier appears;
- server secret value names are imported by files marked `'use client'`;
- old `IYAAZ_PRIVATE_KEY` / `IYAAZ_SHARE_SECRET` runtime contracts remain in active source/config;
- canonical/alternate/sitemap/JSON-LD fixtures contain `credential=`, raw access tokens, `sourceUrl`, `referenceUrl` or workbook reference fields;
- shared authorization helpers contain permissive fallbacks for record mismatch;
- private/shared config catches errors and silently returns public mode.

**Final mode matrix:**
- `public`: existing Phase 3–6 desktop/mobile functionality remains green; public SEO inventory correct;
- `private`: protected pages/APIs denied before exchange, valid private token unlocks app, tampered/expired token rejected, metadata/robots/sitemap non-public;
- `shared`: exact shared shortcut only, AR/EN presentation of same record allowed, wrong record/inventory denied, personal controls absent, metadata `noindex,nofollow`, no protected sitemap inventory.

**Final verification commands:**

```bash
npm test
npm run lint
npm run typecheck
IYAAZ_ACCESS_MODE=public NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 npm run build
npm run test:e2e
```

Protected-mode Playwright projects/configuration must inject test-only `IYAAZ_ACCESS_SECRET` values through the test server environment, never commit a real secret. If one Playwright config cannot represent all three server environments cleanly, add a dedicated `playwright.access.config.ts` that launches separate web servers on distinct localhost ports for public/private/shared.

- [ ] **Step 1: Add RED Python security tests** for the boundaries above and verify they catch deliberately referenced forbidden test fixtures without scanning secrets from the real environment.
- [ ] **Step 2: Implement/extend security scanner** and verify Python GREEN.
- [ ] **Step 3: Run the full public regression suite** and fix only genuine regressions; do not loosen Phase 3–6 contracts.
- [ ] **Step 4: Run the private-mode matrix** including exchange/cookie/API/metadata/robots/sitemap behavior.
- [ ] **Step 5: Run the shared-mode matrix** including exact record scope, locale switching and suppression of workspace/Prompt Builder controls.
- [ ] **Step 6: Run final `npm test`, ESLint, TypeScript and production build** from a clean candidate.
- [ ] **Step 7: Run full desktop/mobile Playwright regression plus access and SEO suites** on the exact candidate SHA.
- [ ] **Step 8: Fetch CI evidence**: quality/browser conclusions, test counts, Playwright artifact ID and SHA-256 digest.
- [ ] **Step 9: Confirm PR #1 remains `Open + Draft + Unmerged`, targets `main`, and its head equals the verified candidate SHA.**
- [ ] **Step 10: Add Phase 7 completion evidence to PR #1 as metadata/comment only** so the verified code SHA does not change.
- [ ] **Step 11: Stop before Phase 8**. Do not mark ready, merge or deploy without the user's explicit next-stage approval.

---

## Plan Self-Review

- **Spec coverage:** Tasks 1–3 cover strict modes, HMAC credentials, exchange/cookie, early proxy and authoritative route/API enforcement; Task 4 covers canonical/alternate/noindex policy including English fallback and query states; Task 5 covers JSON-LD, sitemap, robots and retrieval-oriented semantic delivery; Task 6 covers security and final matrices.
- **No database/account drift:** No task introduces persistence beyond the existing browser-local workspace or the stateless HttpOnly signed credential cookie.
- **Scope discipline:** Shared access stays one exact shortcut. No token dashboard, revocation store, analytics, multi-record share bundle, OAuth, uploads or AI APIs are introduced.
- **Security consistency:** All protected authorization is server-side; proxy is only defense in depth; credential comparison is timing-safe; URL fragments prevent the initial credential from entering server request URLs; post-exchange targets derive from verified payload.
- **SEO consistency:** The same policy helpers drive metadata and sitemap decisions, preventing public/private/shared indexing rules from diverging.
- **TDD:** Every behavior-changing task begins with a failing unit or Playwright contract before implementation.
