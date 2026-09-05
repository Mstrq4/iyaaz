# IYAAZ Phase 5 Library + Prompt Builder Design

## Status
Approved for implementation by the user on 2026-09-02.

## Goal
Build the first complete product workflow on top of the verified Phase 3 data APIs and Phase 4 bilingual shell: users can discover shortcuts, inspect details, choose Arabic or English prompt output independently of the UI locale, fill a schema-driven form, and copy a deterministic prompt without the runtime application calling an AI model.

## Product boundaries
- Arabic remains the canonical source data.
- English library content is produced before runtime and stored as static sanitized data.
- No Supabase/database.
- No runtime translation API.
- No runtime AI/model API.
- No user file upload. Image/logo needs are rendered as attachment reminders only.
- No source/reference URLs are exposed in browser data.
- Existing `/api/search`, `/api/taxonomy`, and `/api/shortcuts/[id]` contracts remain the public runtime boundary and may be extended only in backward-compatible ways.
- Runtime browser state for prompt drafts uses `sessionStorage`; favorites/history/client profiles remain later localStorage work.
- PR #1 stays Draft/Open; no merge to `main` and no production deployment without explicit user authorization.

## Architecture
Phase 5 is split into five independently testable stages.

### 5A — Bilingual data pipeline
The Arabic `data/library.snapshot.json` remains canonical. A build-time translation pipeline creates a static English overlay/snapshot. Translation is behind a provider adapter and never runs in browser/runtime requests.

Translation artifacts:
- `data/library.en.snapshot.json`: public English overlay keyed by record `id` and public field name.
- `data/library.en.manifest.json`: source snapshot hash, translation schema version, record count, translated field count, provider metadata without secrets, and output hash.
- `data/translation-cache.json`: deterministic cache keyed by `record id + field + source field hash`, containing translated text and source hash only. No credentials or raw provider responses.

The pipeline must:
1. hash each canonical source field;
2. reuse cached translation when the hash is unchanged;
3. translate only changed/missing fields;
4. preserve IDs and shortcut tokens exactly;
5. sanitize translated text with the same URL/source-reference boundary used for Arabic;
6. fail closed if a generated public field contains a URL/source/reference leak;
7. write artifacts atomically and deterministically;
8. never log or persist the API key.

Provider contract is implementation-neutral. Production credentials use environment variables such as `IYAAZ_TRANSLATION_API_KEY`; provider-specific endpoint/region settings must not use a `NEXT_PUBLIC_` prefix. Tests use a fake provider so CI never needs a secret.

Runtime localization resolves a record as:
- Arabic UI/output: canonical Arabic record.
- English UI/output: canonical structural values plus available English overlay values.
- Missing English translation: explicit unavailable/fallback state; never silently fabricate English text.

### 5B — Library Explorer
Primary route: `/{locale}/library`.

Search state is URL-driven:
- `q`
- `domain`
- `category`
- `subcategory`
- `type`
- `sort`
- `page`

Rules:
- Domain change invalidates incompatible category/subcategory.
- Category change invalidates incompatible subcategory.
- Query input is debounced; filter/sort changes apply immediately.
- With a query, default sort is relevance. Without a query, default ordering is ID ascending.
- Server/API pagination defaults to 50 records; the browser never loads all 5,812 records simply to browse.
- Rows are data-dense, not oversized marketing cards.
- Each row shows shortcut, localized name/summary where available, domain/category/type, a fast copy action, and a link to details.
- Copy feedback swaps to a check state for approximately one second without layout shift.
- Empty, loading, error, and no-results states are bilingual and accessible.

### 5C — Shortcut Detail
Route: `/{locale}/library/{id}`.

The page shows only non-empty public fields, grouped into useful sections such as identity/classification, purpose/best use, requirements, execution, outputs, dimensions, materials/technology, lighting, installation, visual style, brand compliance, combined shortcuts, keywords/assets, and notes.

No source/reference URL appears anywhere.

Desktop uses a content column plus a prompt-builder rail. Mobile stacks detail content then builder, with a fast in-page jump target.

Taxonomy links point back to canonical `/library` query state during Phase 5. SEO-specific taxonomy routes remain Phase 7 work.

### 5D — Schema-driven Prompt Builder
Prompt language is independent of UI locale. The user explicitly selects `ar` or `en`.

The builder parses `requiredInputs` into a deterministic field schema. Runtime parsing does not call AI. The parser uses conservative rules:
- numbered/bulleted/newline/semicolon-separated requirements become individual fields;
- recognized option syntax becomes `select` only when options are explicit in source text;
- obvious yes/no requirements become boolean controls;
- everything else becomes text/textarea according to length/context;
- unparseable input falls back to a single `project_details` textarea instead of guessing.

Generated field descriptors include stable IDs, label, input kind, required flag, optional explicit options, and source fragment.

Prompt assembly is deterministic and pure. Input is:
- localized shortcut record;
- selected prompt language;
- schema field values;
- optional free notes.

Output contains:
1. shortcut identity and intended function;
2. user-provided project inputs;
3. execution instructions;
4. expected outputs;
5. dimensional/material/lighting/visual/brand constraints when non-empty;
6. final quality/consistency instruction;
7. attachment reminders when the source requirements mention logo/image/reference assets.

The builder never claims an attachment was uploaded. It renders reminders such as “Attach the logo in your AI tool before sending this prompt.”

Draft field values use `sessionStorage` keyed by shortcut ID and selected prompt language. No server persistence is required.

### 5E — Integration and verification
Browser tests cover:
- Arabic RTL and English LTR library routes;
- URL-driven search/filter/sort/page state;
- taxonomy filter cascading;
- known shortcut discovery;
- row copy feedback;
- detail route success/404;
- no source/reference leakage;
- dynamic field parsing for representative required-input formats;
- Arabic and English prompt output selection independent of UI locale;
- deterministic prompt generation;
- session draft persistence;
- attachment reminder behavior;
- keyboard/focus/touch/overflow regressions on representative Phase 4 viewport matrix values.

All existing Phase 3/4 tests remain green.

## Error handling
- Translation script missing credentials: fail with a concise configuration error before any provider call or partial output write.
- Translation provider transient failure: retry only within bounded configured attempts; do not write a partially updated final snapshot.
- Translation sanitization failure: stop and identify record ID/field, never print credentials.
- Runtime English overlay missing: explicit fallback/unavailable state.
- Search API error: accessible retry state; preserve URL query state.
- Detail 404/malformed ID: localized not-found behavior.
- Prompt schema parse ambiguity: fallback textarea rather than speculative fields.

## Visual and interaction direction
Continue the approved Phase 4 system: data-dense + drill-down + editorial + selective glass. Avoid emoji, generic oversized cards, generic AI-purple gradients, and decorative surfaces that reduce information density. Use canonical IYAAZ SVG identity and logical RTL-safe CSS.

## Security and privacy
Translation secrets exist only in build/operator environment variables. They are not committed, serialized into artifacts, exposed to browser bundles, or prefixed `NEXT_PUBLIC_`. Browser prompt drafts remain local to the session. User-entered prompt data is not sent to the translation provider.

## Phase 5 completion gate
Phase 5 closes only when 5A–5E have RED→GREEN evidence, CI quality/build/browser gates pass on the same final candidate, and PR #1 remains unmerged unless the user separately authorizes merge.