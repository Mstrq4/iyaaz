import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { LibraryRecord } from './types.ts';

export interface TaxonomyCountNode {
  name: string;
  count: number;
}

export interface TaxonomyCategory extends TaxonomyCountNode {
  subcategories: TaxonomyCountNode[];
}

export interface TaxonomyDomain extends TaxonomyCountNode {
  categories: TaxonomyCategory[];
}

export interface LibraryTaxonomy {
  totals: {
    records: number;
    domains: number;
    categories: number;
    subcategories: number;
  };
  domains: TaxonomyDomain[];
  shortcutTypes: TaxonomyCountNode[];
}

const SNAPSHOT_PATH = path.join(process.cwd(), 'data', 'library.snapshot.json');

let recordsPromise: Promise<readonly LibraryRecord[]> | undefined;
let taxonomyPromise: Promise<LibraryTaxonomy> | undefined;

function compareArabic(a: string, b: string): number {
  return a.localeCompare(b, 'ar', { sensitivity: 'base', numeric: true });
}

function toSortedCountNodes(counts: ReadonlyMap<string, number>): TaxonomyCountNode[] {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => compareArabic(a.name, b.name));
}

async function readSnapshot(): Promise<readonly LibraryRecord[]> {
  const raw = await readFile(SNAPSHOT_PATH, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('IYAAZ library snapshot must be an array');
  return parsed as LibraryRecord[];
}

export function loadLibraryRecords(): Promise<readonly LibraryRecord[]> {
  recordsPromise ??= readSnapshot();
  return recordsPromise;
}

export function findLibraryRecordById(records: readonly LibraryRecord[], id: number): LibraryRecord | undefined {
  if (!Number.isInteger(id) || id < 1) return undefined;
  return records.find((record) => record.id === id);
}

function buildTaxonomy(records: readonly LibraryRecord[]): LibraryTaxonomy {
  const domains = new Map<
    string,
    { count: number; categories: Map<string, { count: number; subcategories: Map<string, number> }> }
  >();
  const categoryNames = new Set<string>();
  const subcategoryNames = new Set<string>();
  const shortcutTypes = new Map<string, number>();

  for (const record of records) {
    categoryNames.add(record.category);
    subcategoryNames.add(record.subcategory);
    shortcutTypes.set(record.shortcutType, (shortcutTypes.get(record.shortcutType) ?? 0) + 1);

    let domain = domains.get(record.mainDomain);
    if (!domain) {
      domain = { count: 0, categories: new Map() };
      domains.set(record.mainDomain, domain);
    }
    domain.count += 1;

    let category = domain.categories.get(record.category);
    if (!category) {
      category = { count: 0, subcategories: new Map() };
      domain.categories.set(record.category, category);
    }
    category.count += 1;
    category.subcategories.set(record.subcategory, (category.subcategories.get(record.subcategory) ?? 0) + 1);
  }

  const domainItems: TaxonomyDomain[] = [...domains.entries()]
    .map(([name, domain]) => ({
      name,
      count: domain.count,
      categories: [...domain.categories.entries()]
        .map(([categoryName, category]) => ({
          name: categoryName,
          count: category.count,
          subcategories: toSortedCountNodes(category.subcategories),
        }))
        .sort((a, b) => compareArabic(a.name, b.name)),
    }))
    .sort((a, b) => compareArabic(a.name, b.name));

  return {
    totals: {
      records: records.length,
      domains: domains.size,
      categories: categoryNames.size,
      subcategories: subcategoryNames.size,
    },
    domains: domainItems,
    shortcutTypes: toSortedCountNodes(shortcutTypes),
  };
}

export function getLibraryTaxonomy(): Promise<LibraryTaxonomy> {
  taxonomyPromise ??= loadLibraryRecords().then(buildTaxonomy);
  return taxonomyPromise;
}
