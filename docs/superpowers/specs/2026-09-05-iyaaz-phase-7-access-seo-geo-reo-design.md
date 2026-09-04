# IYAAZ Phase 7 — Access Modes + SEO/GEO/REO Design

## Status

Approved design direction. This specification defines Phase 7 only. It does not authorize merge to `main` or production deployment.

## Objective

Add three deployment access modes and complete public discoverability/retrieval delivery without changing IYAAZ's core no-database architecture.

Phase 7 must:

- support `public`, `private`, and limited `shared` deployments from one codebase;
- enforce private/shared access before protected content delivery;
- use stateless, expiring HMAC-signed credentials rather than accounts or a database;
- keep workspace data browser-local;
- make public pages correctly indexable in Arabic/English with canonical URLs, language alternates, structured data, robots and sitemap support;
- keep personal, private, shared and duplicate/query-state pages out of public SEO inventory;
- improve retrieval quality through server-rendered semantic content, hierarchy and internal linking rather than invented AI-only metadata or keyword stuffing.

This specification operationalizes the existing contracts in `docs/architecture/access-modes.md` and `docs/architecture/seo-geo-reo.md`.

## Fixed architecture constraints

1. Reuse `feat/iyaaz-platform` and PR #1.
2. No database, Supabase, user-account system or persistent server session store.
3. No direct AI/model API and no upload controls.
4. Arabic and English remain first-class routes.
5. Public library data continues through the existing sanitized record contract only.
6. Favorites, history and client profiles remain browser-local and are never included in shared credentials.
7. `IYAAZ_ACCESS_SECRET` is server-only and must never use a `NEXT_PUBLIC_` prefix.
8. Access credentials expire and are verified server-side using HMAC-SHA256 with constant-time signature comparison.
9. Public indexing must never expose source/reference URLs, access tokens, private paths or browser-local data.
10. Merge and production remain separate explicit approval gates.

---

## Phase 7A — Access-mode configuration and credential primitives

### Deployment mode

Introduce a strict server-side mode parser:

```ts
type AccessMode = 'public' | 'private' | 'shared';
```

Environment:

- `IYAAZ_ACCESS_MODE=public|private|shared`
- `IYAAZ_ACCESS_SECRET=<server-only secret>` required for `private` and `shared`
- `NEXT_PUBLIC_SITE_URL=<canonical public origin>` remains suitable for canonical metadata because it is intentionally public.

Unknown modes fail closed. `private`/`shared` without a valid server secret fail closed rather than silently becoming public.

### Credential format

Use a compact stateless credential with a versioned JSON payload and HMAC-SHA256 signature.

Minimum payload:

```ts
interface AccessCredentialPayload {
  v: 1;
  kind: 'private' | 'share';
  exp: number;        // Unix seconds
  iat: number;        // Unix seconds
  scope: 'app' | 'shortcut';
  recordId?: number;  // required for shortcut share scope
}
```

Rules:

- base64url encoding only;
- reject malformed JSON, unsupported versions, non-safe IDs, missing fields and expired credentials;
- reject future `iat` beyond a small clock-skew allowance;
- `private` requires `scope='app'`;
- `share` initially supports only `scope='shortcut'` with one exact `recordId`;
- verify signatures with timing-safe comparison;
- one current secret only in Phase 7; rotating the secret intentionally invalidates all outstanding credentials.

No token mint endpoint is exposed publicly. Because the design is intentionally stateless, Phase 7 does not provide per-token revocation before expiry; emergency/global revocation is performed by rotating `IYAAZ_ACCESS_SECRET`.

### Credential generation

Add a maintainer-side script/CLI that can generate:

- a private full-app credential with explicit expiry;
- a shared shortcut credential for one record ID with explicit expiry;
- a localized access URL using `ar` or `en` without embedding the server secret.

The script reads the server secret from the environment and never writes it to source control.

---

## Phase 7B — Secure exchange, cookie and authorization boundary

### Token delivery

Generated access links target the localized non-indexed access route using a URL fragment, for example conceptually:

`/{locale}/access#credential=<token>`

The fragment is intentionally not sent in the initial HTTP request. Client code posts the credential to a same-origin exchange route, then removes/replaces the fragment by navigating to the allowed target.

### Exchange route

`POST /api/access/exchange`

Behavior:

- validates the credential server-side;
- rejects malformed/expired/wrong-kind credentials with a generic error;
- returns the authorized redirect target;
- sets an expiring HttpOnly cookie containing the signed credential;
- cookie uses `SameSite=Lax`, `Path=/`, and `Secure` in production;
- cookie lifetime never exceeds credential expiry;
- no credential is returned in response HTML or logged by application code.

### Authorization model

Use one shared server authorization module as the source of truth. Next.js `proxy.ts` may provide an early redirect/reject boundary, but it is not the sole authorization layer.

Authoritative checks must also be applied in protected server layouts/routes and protected API handlers.

Mode behavior:

**public**
- normal public routes and existing sanitized read APIs are accessible without a credential;
- personal browser-local routes remain available but `noindex`.

**private**
- all product content/read APIs require a valid unexpired private `scope='app'` credential;
- `/{locale}/access`, required static assets and the exchange endpoint remain reachable;
- unauthenticated page requests go to the localized access surface;
- unauthenticated API requests return `401` JSON.

**shared**
- a valid share credential grants only the one exact shortcut detail identified by `recordId`;
- it does not grant library search, favorites, history, clients, statistics, docs, other shortcut IDs or batch/search APIs;
- the same scoped shortcut may be viewed through the supported Arabic or English presentation route without expanding the record scope;
- shared rendering is read-only and suppresses personal workspace controls;
- wrong-scope or wrong-record access returns a non-revealing `404`/denied result rather than disclosing broader inventory;
- `/{locale}/access` and exchange remain reachable.

The initial shared scope is intentionally narrow. General collections, arbitrary route scopes and client-authored share bundles are out of scope for Phase 7.

### Return-target safety

Any post-exchange return path must be selected from the verified credential payload/server policy. Do not trust arbitrary absolute `returnTo` URLs from query parameters. If a relative return path is accepted for private mode, validate it as same-origin and path-only.

---

## Phase 7C — Public metadata, canonical and language-alternate policy

### Metadata base

Use the canonical site origin from `NEXT_PUBLIC_SITE_URL` through Next.js Metadata APIs.

### Public localized routes

For public mode, provide localized metadata for:

- `/{locale}`
- `/{locale}/library`
- `/{locale}/docs`
- `/{locale}/statistics`
- `/{locale}/library/{id}`

Each indexable localized page has:

- localized title and description;
- self canonical URL;
- Arabic/English alternate-language links where the alternate is genuinely indexable;
- stable Open Graph basics using existing brand identity only; no fabricated ratings, authors or user counts.

### Search/filter query states

`/{locale}/library` query/filter/sort/page states must not create crawlable duplicate inventory.

Policy:

- canonical points to the clean `/{locale}/library` URL;
- any non-empty search/filter/sort/page query state is `noindex,follow`;
- no query-state URLs appear in sitemap output.

### English fallback detail pages

Until a complete English translation exists:

- Arabic shortcut detail remains the canonical indexable source;
- an English detail page using canonical-Arabic fallback content is `noindex,follow`;
- its canonical points to the Arabic detail page;
- once a real English overlay exists for that record, the English detail becomes self-canonical/indexable and Arabic/English alternates are emitted normally.

This avoids claiming duplicate Arabic fallback content as independently localized English inventory.

### Personal/private/shared indexing

Always `noindex,nofollow`:

- `/{locale}/favorites`
- `/{locale}/history`
- `/{locale}/clients`
- `/{locale}/access`
- private-mode content
- shared-mode content

Private/shared credentials must never appear in canonical, Open Graph, alternate or structured-data URLs.

---

## Phase 7D — Structured data, sitemap, robots and retrieval-oriented delivery

### Structured data

Use JSON-LD only where the current content supports it truthfully.

Initial types:

- home: `WebSite`;
- library: `CollectionPage`;
- shortcut detail: `CreativeWork` + `BreadcrumbList`;
- docs/statistics: ordinary `WebPage` metadata unless stronger schema is genuinely supported by the content.

Rules:

- never add fake reviews, ratings, authors, organization claims or usage counts;
- structured-data URLs use canonical URLs only;
- safely serialize JSON-LD so user/catalog text cannot break out of the script element.

### Sitemap

In `public` mode, sitemap contains only canonical indexable public URLs:

- Arabic/English home, library, docs and statistics;
- every Arabic canonical shortcut detail;
- English shortcut details only when a real English translation overlay makes them indexable.

Exclude personal routes, localized access routes, query states, missing records and all credential-bearing URLs.

In `private` and `shared` modes, no protected inventory is listed in sitemap.

### Robots

**public mode**
- allow public canonical pages;
- personal/access routes are excluded from indexing through page metadata and may be disallowed where appropriate.

**private/shared mode**
- robots policy disallows crawling the application inventory;
- page-level metadata remains `noindex,nofollow` as defense in depth.

Robots is not treated as an authorization mechanism.

### GEO/REO principles

Improve machine retrieval through standard, truthful web structure:

- one clear localized `h1` per page;
- stable headings and descriptive intros;
- server-rendered public copy;
- breadcrumbs and hierarchical internal links;
- canonical URLs and alternates;
- structured data where appropriate;
- truthful catalog statistics already derived from canonical data;
- meaningful link text.

Do not add hidden text, keyword stuffing, fabricated FAQs, speculative AI-only meta tags or duplicate pages solely for search engines/LLMs. No non-standard `llms.txt` requirement is added in Phase 7.

---

## Phase 7E — Security, regression and release-candidate verification

### Required automated coverage

Unit tests:

- strict access-mode parser;
- HMAC signing/verification;
- tamper rejection;
- expiry/future-issued rejection;
- private vs shared scope enforcement;
- exact shared record-ID enforcement;
- deterministic access-link generation;
- canonical/alternate metadata helpers;
- sitemap inclusion/exclusion helpers;
- JSON-LD output safety.

HTTP/Playwright tests:

- public mode remains fully usable;
- private mode denies content before credential exchange;
- valid private exchange sets cookie and unlocks app;
- expired/tampered token is rejected;
- shared token opens exactly one shortcut and no other inventory;
- personal workspace controls are absent from shared view;
- APIs reject unauthorized access under protected modes;
- localized access route has no credential in rendered HTML after exchange/navigation;
- Arabic/English canonical + alternates are correct;
- query-state library pages are noindex and canonicalized cleanly;
- personal routes are noindex;
- English fallback detail policy is correct;
- public sitemap/robots contain no protected/personal/tokenized URLs;
- private/shared robots and sitemap expose no protected inventory;
- JSON-LD is valid and contains no source/reference fields;
- existing Phase 3–6 desktop/mobile, RTL/LTR, theme and workspace regressions remain green.

### Security gate

Add/extend repository safety checks proving:

- `IYAAZ_ACCESS_SECRET` never appears in browser bundles or `NEXT_PUBLIC_*` variables;
- access credentials do not appear in sitemap/canonical/alternate/structured-data output;
- no source/reference URLs become public through SEO helpers;
- shared scope cannot expand by altering route/query values;
- private/shared authorization fails closed on misconfiguration.

### Completion gate

Phase 7 is complete only when one exact candidate SHA has:

- logic/data/security tests PASS;
- ESLint PASS;
- typecheck PASS;
- production build PASS;
- RTL audit PASS;
- full desktop/mobile Playwright regression PASS;
- access-mode matrix PASS;
- SEO/GEO/REO matrix PASS.

PR #1 remains Draft/Open/Unmerged after Phase 7. Production deployment and merge remain Phase 8/final explicit approvals.

## Explicit non-goals

Phase 7 does not add:

- user accounts or password database;
- OAuth/Auth.js/Supabase Auth;
- persistent server sessions;
- per-token revocation database;
- database-backed share management;
- arbitrary multi-record share bundles;
- analytics or usage tracking;
- AI model calls;
- image/file upload;
- invented SEO metrics or testimonials;
- production deployment;
- merge to `main`.

## References / rationale

- Existing repository contract: `docs/architecture/access-modes.md`.
- Existing repository contract: `docs/architecture/seo-geo-reo.md`.
- Next.js 16 uses `proxy.ts` for request-boundary interception; Proxy is an early boundary, not the sole authorization system.
- Next.js Metadata APIs support dynamic metadata, canonical URLs, alternates, robots and sitemap file conventions.
- HMAC comparisons must be timing-safe; all incoming URL/credential parameters are untrusted and must be strictly validated.
