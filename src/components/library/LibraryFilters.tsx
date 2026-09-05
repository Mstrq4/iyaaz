'use client';

import type { LibraryCopy } from '../../lib/i18n';
import type { LibraryQueryPatch, LibraryQueryState } from '../../lib/library/query-state';
import type { SearchSort } from '../../lib/library/search';

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

interface LibraryFiltersProps {
  copy: LibraryCopy;
  state: LibraryQueryState;
  taxonomy: LibraryTaxonomy | null;
  onPatch: (patch: LibraryQueryPatch) => void;
}

const SORT_OPTIONS: SearchSort[] = ['relevance', 'id-asc', 'id-desc', 'shortcut-asc', 'name-asc'];

export function LibraryFilters({ copy, state, taxonomy, onPatch }: LibraryFiltersProps) {
  const selectedDomain = taxonomy?.domains.find((item) => item.name === state.domain);
  const categories = selectedDomain?.categories ?? [];
  const selectedCategory = categories.find((item) => item.name === state.category);
  const subcategories = selectedCategory?.subcategories ?? [];

  const sortLabels: Record<SearchSort, string> = {
    relevance: copy.sortRelevance,
    'id-asc': copy.sortOldest,
    'id-desc': copy.sortNewest,
    'shortcut-asc': copy.sortShortcut,
    'name-asc': copy.sortName,
  };

  return (
    <fieldset className="library-filters">
      <legend className="sr-only">{copy.filters}</legend>

      <div className="library-filter">
        <span><label htmlFor="library-domain">{copy.domain}</label></span>
        <select
          id="library-domain"
          value={state.domain}
          onChange={(event) => onPatch({ domain: event.target.value })}
          disabled={!taxonomy}
        >
          <option value="">{copy.allDomains}</option>
          {taxonomy?.domains.map((domain) => (
            <option key={domain.name} value={domain.name}>
              {domain.name} ({domain.count})
            </option>
          ))}
        </select>
      </div>

      <div className="library-filter">
        <span><label htmlFor="library-category">{copy.category}</label></span>
        <select
          id="library-category"
          value={state.category}
          onChange={(event) => onPatch({ category: event.target.value })}
          disabled={!state.domain || !selectedDomain}
        >
          <option value="">{copy.allCategories}</option>
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.name} ({category.count})
            </option>
          ))}
        </select>
      </div>

      <div className="library-filter">
        <span><label htmlFor="library-subcategory">{copy.subcategory}</label></span>
        <select
          id="library-subcategory"
          value={state.subcategory}
          onChange={(event) => onPatch({ subcategory: event.target.value })}
          disabled={!state.category || !selectedCategory}
        >
          <option value="">{copy.allSubcategories}</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.name} value={subcategory.name}>
              {subcategory.name} ({subcategory.count})
            </option>
          ))}
        </select>
      </div>

      <div className="library-filter">
        <span><label htmlFor="library-type">{copy.type}</label></span>
        <select
          id="library-type"
          value={state.type}
          onChange={(event) => onPatch({ type: event.target.value })}
          disabled={!taxonomy}
        >
          <option value="">{copy.allTypes}</option>
          {taxonomy?.shortcutTypes.map((type) => (
            <option key={type.name} value={type.name}>
              {type.name} ({type.count})
            </option>
          ))}
        </select>
      </div>

      <div className="library-filter library-filter--sort">
        <span><label htmlFor="library-sort">{copy.sort}</label></span>
        <select
          id="library-sort"
          value={state.sort}
          onChange={(event) => onPatch({ sort: event.target.value as SearchSort })}
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>{sortLabels[sort]}</option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
