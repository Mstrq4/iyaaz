import { requireReadApiAccess } from '../../../lib/access/server.ts';
import { searchLibrary, type SearchFilters, type SearchSort } from '../../../lib/library/search.ts';
import { loadLibraryRecords } from '../../../lib/library/server.ts';

const SEARCH_SORTS = new Set<SearchSort>(['relevance', 'id-asc', 'id-desc', 'shortcut-asc', 'name-asc']);

function parseInteger(value: string | null, fallback: number, maximum?: number): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  const nonNegative = Math.max(0, parsed);
  return maximum === undefined ? nonNegative : Math.min(nonNegative, maximum);
}

function clean(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(request: Request): Promise<Response> {
  const denied = await requireReadApiAccess();
  if (denied) return denied;

  const url = new URL(request.url);
  const filters: SearchFilters = {
    mainDomain: clean(url.searchParams.get('domain')),
    category: clean(url.searchParams.get('category')),
    subcategory: clean(url.searchParams.get('subcategory')),
    shortcutType: clean(url.searchParams.get('type')),
  };
  const requestedSort = clean(url.searchParams.get('sort')) as SearchSort | undefined;
  const sort: SearchSort = requestedSort && SEARCH_SORTS.has(requestedSort) ? requestedSort : 'relevance';
  const offset = parseInteger(url.searchParams.get('offset'), 0);
  const limit = parseInteger(url.searchParams.get('limit'), 50, 200) || 50;
  const records = await loadLibraryRecords();
  const result = searchLibrary(records, {
    query: clean(url.searchParams.get('q')),
    filters,
    sort,
    offset,
    limit,
  });

  return Response.json(
    {
      items: result.items,
      total: result.total,
      offset,
      limit,
      sort,
    },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
