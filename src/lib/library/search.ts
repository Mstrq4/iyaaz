import type { LibraryRecord } from './types.ts';

export type SearchSort = 'relevance' | 'id-asc' | 'id-desc' | 'shortcut-asc' | 'name-asc';

export interface SearchFilters {
  mainDomain?: string;
  category?: string;
  subcategory?: string;
  shortcutType?: string;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  offset?: number;
  limit?: number;
}

export interface SearchResult {
  items: LibraryRecord[];
  total: number;
}

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const WHITESPACE = /\s+/g;

const SEARCH_FIELDS = [
  'shortcut',
  'nameAr',
  'mainDomain',
  'category',
  'subcategory',
  'shortcutType',
  'functionText',
  'requiredInputs',
  'executionInstructions',
  'outputs',
  'sizeRatio',
  'materialsTech',
  'lighting',
  'installationExecution',
  'visualStyle',
  'brandCompliance',
  'combinedShortcuts',
  'bestUse',
  'keywords',
  'assetType',
  'notes',
] as const satisfies readonly (keyof LibraryRecord)[];

interface ScoredRecord {
  record: LibraryRecord;
  score: number;
}

export function normalizeSearchText(value: string): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(ARABIC_DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLocaleLowerCase('en-US')
    .replace(WHITESPACE, ' ')
    .trim();
}

function tokenVariants(token: string): readonly string[] {
  const variants = new Set([token]);
  if (token.length > 2 && token.endsWith('ة')) variants.add(token.slice(0, -1));
  return [...variants];
}

function recordSearchText(record: LibraryRecord): string {
  return SEARCH_FIELDS.map((field) => normalizeSearchText(String(record[field] ?? '')))
    .filter(Boolean)
    .join(' ');
}

function matchesFilters(record: LibraryRecord, filters: SearchFilters): boolean {
  return (
    (!filters.mainDomain || record.mainDomain === filters.mainDomain) &&
    (!filters.category || record.category === filters.category) &&
    (!filters.subcategory || record.subcategory === filters.subcategory) &&
    (!filters.shortcutType || record.shortcutType === filters.shortcutType)
  );
}

function phraseScore(record: LibraryRecord, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const shortcut = normalizeSearchText(record.shortcut);
  const nameAr = normalizeSearchText(record.nameAr);
  const keywords = normalizeSearchText(record.keywords);
  const domain = normalizeSearchText(record.mainDomain);
  const category = normalizeSearchText(record.category);
  const subcategory = normalizeSearchText(record.subcategory);

  let score = 0;
  if (shortcut === normalizedQuery) score += 10_000;
  else if (shortcut.startsWith(normalizedQuery)) score += 4_000;
  else if (shortcut.includes(normalizedQuery)) score += 2_000;

  if (nameAr === normalizedQuery) score += 1_800;
  else if (nameAr.startsWith(normalizedQuery)) score += 1_200;
  else if (nameAr.includes(normalizedQuery)) score += 800;

  if (keywords.includes(normalizedQuery)) score += 500;
  if (subcategory.includes(normalizedQuery)) score += 350;
  if (category.includes(normalizedQuery)) score += 250;
  if (domain.includes(normalizedQuery)) score += 200;
  return score;
}

function tokenScore(record: LibraryRecord, queryTokens: readonly string[]): number {
  if (queryTokens.length === 0) return 0;
  const normalizedFields = SEARCH_FIELDS.map((field) => normalizeSearchText(String(record[field] ?? '')));
  let score = 0;

  for (const token of queryTokens) {
    const variants = tokenVariants(token);
    let best = 0;
    for (let index = 0; index < normalizedFields.length; index += 1) {
      const fieldValue = normalizedFields[index];
      if (!variants.some((variant) => fieldValue.includes(variant))) continue;
      if (index === 0) best = Math.max(best, 300);
      else if (index === 1) best = Math.max(best, 180);
      else if (index >= 2 && index <= 4) best = Math.max(best, 100);
      else best = Math.max(best, 40);
    }
    score += best;
  }
  return score;
}

function matchesQuery(record: LibraryRecord, queryTokens: readonly string[]): boolean {
  if (queryTokens.length === 0) return true;
  const haystack = recordSearchText(record);
  return queryTokens.every((token) => tokenVariants(token).some((variant) => haystack.includes(variant)));
}

function compareRecords(a: ScoredRecord, b: ScoredRecord, sort: SearchSort, hasQuery: boolean): number {
  switch (sort) {
    case 'id-desc':
      return b.record.id - a.record.id;
    case 'id-asc':
      return a.record.id - b.record.id;
    case 'shortcut-asc':
      return a.record.shortcut.localeCompare(b.record.shortcut, 'en', { sensitivity: 'base', numeric: true }) || a.record.id - b.record.id;
    case 'name-asc':
      return a.record.nameAr.localeCompare(b.record.nameAr, 'ar', { sensitivity: 'base', numeric: true }) || a.record.id - b.record.id;
    case 'relevance':
    default:
      return (hasQuery ? b.score - a.score : 0) || a.record.id - b.record.id;
  }
}

function normalizePageValue(value: number | undefined, fallback: number, maximum?: number): number {
  if (!Number.isFinite(value)) return fallback;
  const integer = Math.max(0, Math.trunc(value as number));
  return maximum === undefined ? integer : Math.min(integer, maximum);
}

export function searchLibrary(records: readonly LibraryRecord[], options: SearchOptions = {}): SearchResult {
  const normalizedQuery = normalizeSearchText(options.query ?? '');
  const queryTokens = normalizedQuery ? normalizedQuery.split(' ').filter(Boolean) : [];
  const filters = options.filters ?? {};
  const sort = options.sort ?? 'relevance';
  const offset = normalizePageValue(options.offset, 0);
  const limit = normalizePageValue(options.limit, 50, 200) || 50;

  const matches: ScoredRecord[] = [];
  for (const record of records) {
    if (!matchesFilters(record, filters)) continue;
    if (!matchesQuery(record, queryTokens)) continue;
    matches.push({
      record,
      score: phraseScore(record, normalizedQuery) + tokenScore(record, queryTokens),
    });
  }

  matches.sort((a, b) => compareRecords(a, b, sort, queryTokens.length > 0));
  return {
    total: matches.length,
    items: matches.slice(offset, offset + limit).map(({ record }) => record),
  };
}

export const SEARCHABLE_LIBRARY_FIELDS = SEARCH_FIELDS;
