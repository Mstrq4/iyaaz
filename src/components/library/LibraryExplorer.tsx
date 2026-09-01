'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { libraryCopy, type Locale } from '../../lib/i18n';
import {
  LIBRARY_PAGE_SIZE,
  clampLibraryPage,
  offsetForLibraryPage,
  parseLibraryQueryState,
  serializeLibraryQueryState,
  updateLibraryQueryState,
  type LibraryQueryPatch,
} from '../../lib/library/query-state';
import type { SearchSort } from '../../lib/library/search';
import type { LibraryRecord } from '../../lib/library/types';
import { LibraryFilters, type LibraryTaxonomy } from './LibraryFilters';
import { LibraryRow } from './LibraryRow';
import { Pagination } from './Pagination';

interface LibraryExplorerProps {
  locale: Locale;
}

interface SearchResponse {
  items: LibraryRecord[];
  total: number;
  offset: number;
  limit: number;
  sort: SearchSort;
}

export function LibraryExplorer({ locale }: LibraryExplorerProps) {
  const copy = libraryCopy[locale];
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const state = useMemo(() => parseLibraryQueryState(searchString), [searchString]);

  const [queryInput, setQueryInput] = useState(state.q);
  const [taxonomy, setTaxonomy] = useState<LibraryTaxonomy | null>(null);
  const [taxonomyError, setTaxonomyError] = useState(false);
  const [taxonomyRetry, setTaxonomyRetry] = useState(0);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState(false);
  const [searchRetry, setSearchRetry] = useState(0);
  const [isPending, setIsPending] = useState(true);

  const replaceState = useCallback((nextState: ReturnType<typeof parseLibraryQueryState>) => {
    const serialized = serializeLibraryQueryState(nextState);
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false });
  }, [pathname, router]);

  const applyPatch = useCallback((patch: LibraryQueryPatch) => {
    replaceState(updateLibraryQueryState(state, patch));
  }, [replaceState, state]);

  useEffect(() => {
    setQueryInput(state.q);
  }, [state.q]);

  useEffect(() => {
    if (queryInput.trim() === state.q) return;
    const timer = setTimeout(() => applyPatch({ q: queryInput }), 300);
    return () => clearTimeout(timer);
  }, [applyPatch, queryInput, state.q]);

  useEffect(() => {
    const controller = new AbortController();
    setTaxonomyError(false);

    const run = async () => {
      try {
        const response = await fetch('/api/taxonomy', { signal: controller.signal });
        if (!response.ok) throw new Error(`taxonomy ${response.status}`);
        const payload = await response.json() as LibraryTaxonomy;
        if (!payload || !Array.isArray(payload.domains) || !Array.isArray(payload.shortcutTypes)) {
          throw new Error('invalid taxonomy payload');
        }
        setTaxonomy(payload);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setTaxonomyError(true);
      }
    };

    void run();
    return () => controller.abort();
  }, [taxonomyRetry]);

  useEffect(() => {
    const controller = new AbortController();
    setSearchError(false);
    setIsPending(true);

    const run = async () => {
      try {
        const params = new URLSearchParams();
        if (state.q) params.set('q', state.q);
        if (state.domain) params.set('domain', state.domain);
        if (state.category) params.set('category', state.category);
        if (state.subcategory) params.set('subcategory', state.subcategory);
        if (state.type) params.set('type', state.type);
        params.set('sort', state.sort);
        params.set('offset', String(offsetForLibraryPage(state.page)));
        params.set('limit', String(LIBRARY_PAGE_SIZE));

        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`search ${response.status}`);
        const payload = await response.json() as SearchResponse;
        if (!payload || !Array.isArray(payload.items) || !Number.isFinite(payload.total)) {
          throw new Error('invalid search payload');
        }

        const clampedPage = clampLibraryPage(state.page, payload.total);
        if (clampedPage !== state.page) {
          replaceState({ ...state, page: clampedPage });
          return;
        }

        setResult(payload);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setSearchError(true);
      } finally {
        if (!controller.signal.aborted) setIsPending(false);
      }
    };

    void run();
    return () => controller.abort();
  }, [replaceState, searchRetry, state]);

  const formattedTotal = result
    ? new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(result.total)
    : '—';

  return (
    <div className="library-explorer" aria-busy={isPending}>
      <aside className="library-controls" aria-label={copy.filters}>
        <div className="library-search">
          <label htmlFor="library-search-input">{copy.search}</label>
          <div className="library-search__field">
            <input
              id="library-search-input"
              type="search"
              value={queryInput}
              placeholder={copy.searchPlaceholder}
              autoComplete="off"
              onChange={(event) => setQueryInput(event.target.value)}
            />
            {queryInput ? (
              <button type="button" onClick={() => setQueryInput('')}>
                {copy.clearSearch}
              </button>
            ) : null}
          </div>
        </div>

        <LibraryFilters copy={copy} state={state} taxonomy={taxonomy} onPatch={applyPatch} />

        {taxonomyError ? (
          <div className="library-inline-error" role="alert">
            <span>{copy.error}</span>
            <button type="button" onClick={() => setTaxonomyRetry((value) => value + 1)}>{copy.retry}</button>
          </div>
        ) : null}

        {locale === 'en' && copy.translationNotice ? (
          <p className="library-translation-note">{copy.translationNotice}</p>
        ) : null}
      </aside>

      <section className="library-results" aria-labelledby="library-results-heading">
        <header className="library-results__toolbar">
          <div>
            <span id="library-results-heading">{copy.results}</span>
            <strong>{formattedTotal} {copy.records}</strong>
          </div>
          {isPending && result ? <span className="library-updating" role="status">{copy.updating}</span> : null}
        </header>

        {searchError ? (
          <div className="library-status library-status--error" role="alert">
            <p>{copy.error}</p>
            <button type="button" onClick={() => setSearchRetry((value) => value + 1)}>{copy.retry}</button>
          </div>
        ) : null}

        {!result && !searchError ? (
          <div className="library-status" role="status">{copy.loading}</div>
        ) : null}

        {result && !searchError && result.items.length === 0 ? (
          <div className="library-status">
            <p>{copy.noResults}</p>
            {state.q ? <button type="button" onClick={() => setQueryInput('')}>{copy.clearSearch}</button> : null}
          </div>
        ) : null}

        {result && !searchError && result.items.length > 0 ? (
          <div className="library-list">
            {result.items.map((record) => (
              <LibraryRow key={record.id} locale={locale} copy={copy} record={record} />
            ))}
          </div>
        ) : null}

        {result && !searchError && result.total > 0 ? (
          <Pagination locale={locale} copy={copy} pathname={pathname} state={state} total={result.total} />
        ) : null}
      </section>
    </div>
  );
}
