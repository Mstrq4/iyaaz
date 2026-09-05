'use client';

import Link from 'next/link';

import type { Locale } from '../../lib/i18n';
import type { LibraryRecord } from '../../lib/library/types';
import {
  removeFavoriteLabel,
  removeHistoryLabel,
  workspaceCopy,
} from '../../lib/workspace/copy';
import { IyaazIcon } from '../icons/IyaazIcon';

interface WorkspaceRecordListProps {
  locale: Locale;
  kind: 'favorites' | 'history';
  records: readonly LibraryRecord[];
  metadataById?: ReadonlyMap<number, string>;
  onRemove: (recordId: number) => void;
}

export function WorkspaceRecordList({
  locale,
  kind,
  records,
  metadataById,
  onRemove,
}: WorkspaceRecordListProps) {
  const copy = workspaceCopy[locale];
  const canonicalTextProps = locale === 'en' ? { lang: 'ar', dir: 'rtl' as const } : {};

  return (
    <div className="workspace-records">
      {records.map((record) => {
        const removeLabel = kind === 'favorites'
          ? removeFavoriteLabel(locale, record.shortcut)
          : removeHistoryLabel(locale, record.shortcut);
        const metadata = metadataById?.get(record.id);

        return (
          <article className="workspace-record" data-record-id={record.id} key={record.id}>
            <div className="workspace-record__content">
              <code dir="ltr">{record.shortcut}</code>
              <h2 {...canonicalTextProps}>{record.nameAr}</h2>
              <div className="workspace-record__meta" {...canonicalTextProps}>
                <span>{record.mainDomain}</span>
                <span>{record.category}</span>
                {metadata ? <span>{metadata}</span> : null}
              </div>
            </div>

            <div className="workspace-record__actions">
              <button
                type="button"
                className="icon-button"
                aria-label={removeLabel}
                title={removeLabel}
                onClick={() => onRemove(record.id)}
              >
                <IyaazIcon name="trash" />
              </button>
              <Link className="workspace-record__details" href={`/${locale}/library/${record.id}`}>
                <span>{copy.details}</span>
                <IyaazIcon name="arrow" />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
