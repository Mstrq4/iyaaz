# IYAAZ Phase 5 Library + Prompt Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete bilingual library discovery/detail/prompt-builder workflow with build-time English translation and zero runtime AI/translation calls.

**Architecture:** Keep Arabic as canonical static data. Generate an English overlay at build/operator time through a provider-neutral translation core with an Azure Translator adapter and deterministic hash cache. Runtime library/detail pages consume server APIs and localized overlays; the Prompt Builder is schema-driven and deterministic in the browser.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Python 3.12, Playwright, static JSON, Azure Translator Text API only during operator/build translation runs.

**Spec:** `docs/superpowers/specs/2026-09-02-iyaaz-phase-5-library-prompt-builder-design.md`

## Global Constraints
- Arabic `data/library.snapshot.json` remains canonical.
- No Supabase/database.
- No runtime translation API and no runtime AI/model API.
- Translation credentials are environment-only and never `NEXT_PUBLIC_*`.
- No user uploads; assets are attachment reminders only.
- No source/reference URLs in public artifacts or browser output.
- Prompt output language is independent from UI locale.
- Prompt drafts use sessionStorage only.
- Preserve all Phase 3/4 CI and Playwright contracts.
- No merge to `main` and no production deployment without explicit user approval.

---

### Task 1: Phase 5A translation core and deterministic cache

**Files:**
- Create: `scripts/translation_pipeline.py`
- Create: `tests/test_translation_pipeline.py`
- Modify: `.env.example`

**Interfaces:**
- Produces `TranslationProvider.translate_batch(texts: list[str]) -> list[str]` protocol.
- Produces `source_hash(value: str) -> str`.
- Produces `build_translation_overlay(records, cache, provider) -> tuple[list[dict], dict]`.
- Produces deterministic cache entries keyed by `<id>:<field>` with `sourceSha256` and `translation`.

- [ ] **Step 1: Write failing tests** covering source hashes, cache reuse, changed-field retranslations, shortcut preservation, output ordering, URL sanitization, secret-free manifest/cache, and atomic no-partial-output behavior.
- [ ] **Step 2: Run `python -m pytest tests/test_translation_pipeline.py -q`** and verify RED because `scripts.translation_pipeline` does not exist.
- [ ] **Step 3: Implement minimal translation core** using public text sanitizer semantics from `scripts/build_snapshot.py`; translate all user-facing text fields except `shortcut` and `combinedShortcuts`; preserve `id` and shortcut tokens exactly.
- [ ] **Step 4: Add environment contract** to `.env.example`: `IYAAZ_TRANSLATION_PROVIDER=azure`, `IYAAZ_TRANSLATION_API_KEY=`, `IYAAZ_TRANSLATION_REGION=`, optional `IYAAZ_TRANSLATION_ENDPOINT=`. No `NEXT_PUBLIC_` key.
- [ ] **Step 5: Run focused tests** and verify GREEN.
- [ ] **Step 6: Commit** translation core and tests.

### Task 2: Phase 5A Azure build-time adapter and CLI artifact writer

**Files:**
- Modify: `scripts/translation_pipeline.py`
- Modify: `tests/test_translation_pipeline.py`

**Interfaces:**
- Produces `AzureTranslatorProvider` using the stable text translate endpoint with `from=ar`, `to=en`, API key header, optional region header, bounded retry for 429/5xx, and request batches.
- Produces CLI: `python scripts/translation_pipeline.py --source data/library.snapshot.json --output-dir data`.
- Writes `library.en.snapshot.json`, `library.en.manifest.json`, and `translation-cache.json` atomically only after full successful generation.

- [ ] **Step 1: Add RED tests** with a fake HTTP transport for auth headers, batching, bounded retries, malformed response rejection, missing-secret preflight failure, and no partial file replacement.
- [ ] **Step 2: Run focused tests** and verify RED.
- [ ] **Step 3: Implement adapter/CLI** using Python standard library HTTP only; never log the key.
- [ ] **Step 4: Run focused tests** and verify GREEN.
- [ ] **Step 5: Run all Python tests**.
- [ ] **Step 6: Commit** adapter/CLI.

### Task 3: Phase 5A runtime localization overlay

**Files:**
- Create: `src/lib/library/localization.ts`
- Modify: `src/lib/library/types.ts`
- Modify: `src/lib/library/server.ts`
- Create: `tests/ts/localization.test.ts`

**Interfaces:**
- Produces `LocalizedLibraryRecord` with stable structural values and localized display values.
- Produces `localizeLibraryRecord(record, overlay, locale)`.
- Produces server loader for English overlay when artifact exists; absence is explicit and does not fabricate translations.

- [ ] **Step 1: Add RED TypeScript tests** for Arabic canonical output, English overlay merge, missing-overlay state, and no mutation of canonical records.
- [ ] **Step 2: Run TypeScript tests** and verify RED.
- [ ] **Step 3: Implement types/localizer/server loader**.
- [ ] **Step 4: Run TypeScript tests** and verify GREEN.
- [ ] **Step 5: Run full CI gates** and record Phase 5A candidate.
- [ ] **Step 6: Commit** and stop for 5A checkpoint if staged execution is requested.

### Task 4: Phase 5B Library Explorer

**Files:**
- Create: `src/app/[locale]/library/page.tsx`
- Create: `src/components/library/LibraryExplorer.tsx`
- Create: `src/components/library/LibraryFilters.tsx`
- Create: `src/components/library/LibraryRow.tsx`
- Create: `src/components/library/Pagination.tsx`
- Create: `src/lib/library/query-state.ts`
- Modify: `src/lib/i18n.ts`
- Modify: `src/app/globals.css`
- Create: `tests/ts/query-state.test.ts`
- Create: `tests/e2e/library.spec.ts`

**Interfaces:**
- URL parameters: `q, domain, category, subcategory, type, sort, page`.
- Page size: 50.
- Cascading filter reset rules live in pure `query-state.ts` helpers.

- [ ] **Step 1: RED unit tests** for parse/serialize/reset/default-sort/page clamping.
- [ ] **Step 2: Implement pure query-state helpers** and verify unit GREEN.
- [ ] **Step 3: RED Playwright tests** for route rendering, known shortcut search, filter cascade, sorting, paging, copy-check feedback, RTL/LTR, and no overflow.
- [ ] **Step 4: Implement Explorer components** against `/api/search` and `/api/taxonomy`.
- [ ] **Step 5: Verify browser GREEN** and full regression.
- [ ] **Step 6: Commit** Phase 5B.

### Task 5: Phase 5C Shortcut Detail

**Files:**
- Create: `src/app/[locale]/library/[id]/page.tsx`
- Create: `src/components/library/ShortcutDetail.tsx`
- Create: `src/components/library/DetailSection.tsx`
- Modify: `src/lib/i18n.ts`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/library.spec.ts`

**Interfaces:**
- Route `/{locale}/library/{id}`.
- Server fetch/load resolves known ID or localized not-found.
- Only non-empty public fields render.

- [ ] **Step 1: Add RED Playwright tests** for ID 3 detail, grouped fields, taxonomy back-links, 404, no source/reference leakage, desktop rail/mobile stack.
- [ ] **Step 2: Implement detail route/components**.
- [ ] **Step 3: Verify targeted GREEN and full regression**.
- [ ] **Step 4: Commit** Phase 5C.

### Task 6: Phase 5D Prompt schema parser

**Files:**
- Create: `src/lib/prompt/schema.ts`
- Create: `tests/ts/prompt-schema.test.ts`

**Interfaces:**
- `PromptFieldKind = 'text' | 'textarea' | 'select' | 'boolean'`.
- `PromptFieldDescriptor = { id, label, kind, required, options?, sourceFragment }`.
- `parseRequiredInputs(requiredInputs: string): PromptFieldDescriptor[]`.

- [ ] **Step 1: Add RED tests** for bullets, numbered items, semicolon lists, explicit options, yes/no fields, stable IDs, empty input, and ambiguity fallback.
- [ ] **Step 2: Implement conservative parser** with no AI/runtime network call.
- [ ] **Step 3: Verify unit GREEN**.
- [ ] **Step 4: Commit** parser.

### Task 7: Phase 5D deterministic prompt assembler and UI

**Files:**
- Create: `src/lib/prompt/assemble.ts`
- Create: `tests/ts/prompt-assemble.test.ts`
- Create: `src/components/prompt/PromptBuilder.tsx`
- Create: `src/components/prompt/PromptField.tsx`
- Modify: `src/components/library/ShortcutDetail.tsx`
- Modify: `src/lib/i18n.ts`
- Modify: `src/app/globals.css`
- Create: `tests/e2e/prompt-builder.spec.ts`

**Interfaces:**
- `assemblePrompt({ record, language, fields, notes }) -> { text, attachmentReminders }`.
- Draft key: `iyaaz:prompt-draft:<recordId>:<language>` in sessionStorage.

- [ ] **Step 1: RED unit tests** for deterministic ordering, Arabic/English selection independent of UI locale, empty fields, notes, and attachment reminders.
- [ ] **Step 2: Implement pure assembler** and verify unit GREEN.
- [ ] **Step 3: RED browser tests** for dynamic controls, session draft persistence, language switch, output regeneration, copy feedback, and no upload control.
- [ ] **Step 4: Implement PromptBuilder UI**.
- [ ] **Step 5: Verify browser GREEN** and full regression.
- [ ] **Step 6: Commit** Phase 5D.

### Task 8: Phase 5E closure and security regression

**Files:**
- Modify: `tests/e2e/phase4e.spec.ts` only if a new product route needs representative viewport checks without weakening existing assertions.
- Create: `tests/test_phase5_artifacts.py`
- Modify: PR conversation metadata only after verification.

**Interfaces:**
- Final candidate must pass all Phase 3, Phase 4, and Phase 5 gates on the same SHA.

- [ ] **Step 1: Add artifact/security tests** asserting no translation key in repository artifacts, no `NEXT_PUBLIC_` translation secret, no source/reference URLs, manifest/hash consistency when English artifact exists, and no runtime translation endpoint references in browser code.
- [ ] **Step 2: Run complete Python + TypeScript + lint + typecheck + production build + Playwright suite**.
- [ ] **Step 3: Inspect final PR head and workflow jobs/artifact digest**.
- [ ] **Step 4: Record Phase 5 RED→GREEN evidence in PR conversation without changing the candidate SHA**.
- [ ] **Step 5: Keep PR Draft/Open/unmerged; do not deploy production.**

## Self-review
- Spec coverage: 5A bilingual pipeline, 5B explorer, 5C detail, 5D prompt builder, 5E verification are each mapped to tasks.
- No runtime AI/translation path is introduced.
- Translation provider is isolated behind a protocol; Azure is only the first build-time adapter.
- Missing production translation credentials are an operator configuration boundary, not a reason for CI to need secrets; CI uses fake providers.
- No placeholder implementation steps remain.
