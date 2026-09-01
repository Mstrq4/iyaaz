import type { SearchSort } from './search.ts';

export const LIBRARY_PAGE_SIZE = 50;

export interface LibraryQueryState {
  q: string;
  domain: string;
  category: string;
  subcategory: string;
  type: string;
  sort: SearchSort;
  page: number;
}

export type LibraryQueryPatch = Partial<LibraryQueryState>;

const SEARCH_SORTS = new Set<SearchSort>([
  'relevance',
  'id-asc',
  'id-desc',
  'shortcut-asc',
  'name-asc',
]);

function clean(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizePage(value: string | number | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.trunc(parsed));
}

export function defaultSortForQuery(query: string): SearchSort {
  return clean(query) ? 'relevance' : 'id-asc';
}

function toSearchParams(value: string | URLSearchParams): URLSearchParams {
  if (value instanceof URLSearchParams) return new URLSearchParams(value);
  return new URLSearchParams(value.startsWith('?') ? value.slice(1) : value);
}

export function parseLibraryQueryState(value: string | URLSearchParams): LibraryQueryState {
  const params = toSearchParams(value);
  const q = clean(params.get('q'));
  const requestedSort = clean(params.get('sort')) as SearchSort;

  return {
    q,
    domain: clean(params.get('domain')),
    category: clean(params.get('category')),
    subcategory: clean(params.get('subcategory')),
    type: clean(params.get('type')),
    sort: SEARCH_SORTS.has(requestedSort) ? requestedSort : defaultSortForQuery(q),
    page: normalizePage(params.get('page')),
  };
}

export function serializeLibraryQueryState(state: LibraryQueryState): string {
  const params = new URLSearchParams();
  const q = clean(state.q);
  const domain = clean(state.domain);
  const category = clean(state.category);
  const subcategory = clean(state.subcategory);
  const type = clean(state.type);
  const sort = SEARCH_SORTS.has(state.sort) ? state.sort : defaultSortForQuery(q);
  const page = normalizePage(state.page);

  if (q) params.set('q', q);
  if (domain) params.set('domain', domain);
  if (category) params.set('category', category);
  if (subcategory) params.set('subcategory', subcategory);
  if (type) params.set('type', type);
  if (sort !== defaultSortForQuery(q)) params.set('sort', sort);
  if (page > 1) params.set('page', String(page));

  return params.toString();
}

export function updateLibraryQueryState(
  state: LibraryQueryState,
  patch: LibraryQueryPatch,
): LibraryQueryState {
  const next: LibraryQueryState = {
    ...state,
    ...patch,
    q: patch.q === undefined ? state.q : clean(patch.q),
    domain: patch.domain === undefined ? state.domain : clean(patch.domain),
    category: patch.category === undefined ? state.category : clean(patch.category),
    subcategory: patch.subcategory === undefined ? state.subcategory : clean(patch.subcategory),
    type: patch.type === undefined ? state.type : clean(patch.type),
    page: patch.page === undefined ? state.page : normalizePage(patch.page),
  };

  const queryChanged = patch.q !== undefined && next.q !== state.q;
  const domainChanged = patch.domain !== undefined && next.domain !== state.domain;
  const categoryChanged = patch.category !== undefined && next.category !== state.category;
  const subcategoryChanged = patch.subcategory !== undefined && next.subcategory !== state.subcategory;
  const typeChanged = patch.type !== undefined && next.type !== state.type;
  const sortChanged = patch.sort !== undefined && next.sort !== state.sort;

  if (queryChanged && patch.sort === undefined && state.sort === defaultSortForQuery(state.q)) {
    next.sort = defaultSortForQuery(next.q);
  }

  if (domainChanged) {
    next.category = '';
    next.subcategory = '';
  } else if (categoryChanged) {
    next.subcategory = '';
  }

  if (queryChanged || domainChanged || categoryChanged || subcategoryChanged || typeChanged || sortChanged) {
    next.page = 1;
  }

  return next;
}

export function clampLibraryPage(page: number, totalRecords: number): number {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalRecords) / LIBRARY_PAGE_SIZE));
  return Math.min(normalizePage(page), totalPages);
}

export function offsetForLibraryPage(page: number): number {
  return (normalizePage(page) - 1) * LIBRARY_PAGE_SIZE;
}
