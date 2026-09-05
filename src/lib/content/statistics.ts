import type { LibraryTaxonomy, TaxonomyCountNode } from '../library/server.ts';

export type CatalogCategoryStatistic = TaxonomyCountNode;

export interface CatalogDomainStatistic extends TaxonomyCountNode {
  categories: CatalogCategoryStatistic[];
}

export interface CatalogStatistics {
  totals: LibraryTaxonomy['totals'];
  shortcutTypes: TaxonomyCountNode[];
  domains: CatalogDomainStatistic[];
}

function compareArabicName(a: string, b: string): number {
  return a.localeCompare(b, 'ar', { sensitivity: 'base', numeric: true });
}

function sortByCountThenArabicName<T extends TaxonomyCountNode>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.count - a.count || compareArabicName(a.name, b.name));
}

export function buildCatalogStatistics(taxonomy: LibraryTaxonomy): CatalogStatistics {
  return {
    totals: { ...taxonomy.totals },
    shortcutTypes: sortByCountThenArabicName(
      taxonomy.shortcutTypes.map((item) => ({ name: item.name, count: item.count })),
    ),
    domains: sortByCountThenArabicName(
      taxonomy.domains.map((domain) => ({
        name: domain.name,
        count: domain.count,
        categories: sortByCountThenArabicName(
          domain.categories.map((category) => ({ name: category.name, count: category.count })),
        ),
      })),
    ),
  };
}
