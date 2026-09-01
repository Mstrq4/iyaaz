import Link from 'next/link';

import type { Locale, LibraryCopy } from '../../lib/i18n';
import {
  LIBRARY_PAGE_SIZE,
  clampLibraryPage,
  serializeLibraryQueryState,
  updateLibraryQueryState,
  type LibraryQueryState,
} from '../../lib/library/query-state';
import { IyaazIcon } from '../icons/IyaazIcon';

interface PaginationProps {
  locale: Locale;
  copy: LibraryCopy;
  pathname: string;
  state: LibraryQueryState;
  total: number;
}

export function Pagination({ locale, copy, pathname, state, total }: PaginationProps) {
  const currentPage = clampLibraryPage(state.page, total);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / LIBRARY_PAGE_SIZE));

  const hrefFor = (page: number) => {
    const query = serializeLibraryQueryState(updateLibraryQueryState(state, { page }));
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <nav className="library-pagination" aria-label={copy.pagination} data-locale={locale}>
      <div className="library-pagination__controls">
        {currentPage > 1 ? (
          <Link className="library-pagination__link" href={hrefFor(currentPage - 1)} scroll={false}>
            <IyaazIcon name="chevron" className="library-pagination__icon--previous" />
            <span>{copy.previous}</span>
          </Link>
        ) : (
          <span className="library-pagination__link" aria-disabled="true">
            <IyaazIcon name="chevron" className="library-pagination__icon--previous" />
            <span>{copy.previous}</span>
          </span>
        )}

        <span className="library-pagination__status">
          {copy.page} {currentPage} {copy.of} {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link className="library-pagination__link" href={hrefFor(currentPage + 1)} scroll={false}>
            <span>{copy.next}</span>
            <IyaazIcon name="chevron" className="library-pagination__icon--next" />
          </Link>
        ) : (
          <span className="library-pagination__link" aria-disabled="true">
            <span>{copy.next}</span>
            <IyaazIcon name="chevron" className="library-pagination__icon--next" />
          </span>
        )}
      </div>
    </nav>
  );
}
