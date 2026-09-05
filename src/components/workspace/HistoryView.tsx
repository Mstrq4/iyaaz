'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Locale } from '../../lib/i18n';
import { normalizeSearchText } from '../../lib/library/search';
import type { LibraryRecord } from '../../lib/library/types';
import { historyOpenCount, workspaceCopy } from '../../lib/workspace/copy';
import { parseHistory } from '../../lib/workspace/history';
import { resolveWorkspaceRecords } from '../../lib/workspace/records';
import { WORKSPACE_KEYS, type HistoryEntry } from '../../lib/workspace/types';
import { useWorkspaceCollection } from './useWorkspaceCollection';
import { WorkspaceRecordList } from './WorkspaceRecordList';

const EMPTY_HISTORY: HistoryEntry[] = [];
const serializeHistory = (entries: HistoryEntry[]) => JSON.stringify(entries);

interface ResolvedState {
  key: string;
  items: LibraryRecord[];
  error: boolean;
}

export function HistoryView({ locale }: { locale: Locale }) {
  const copy = workspaceCopy[locale];
  const [history, setHistory, clearHistory] = useWorkspaceCollection<HistoryEntry[]>({
    key: WORKSPACE_KEYS.history,
    parse: parseHistory,
    serialize: serializeHistory,
    empty: EMPTY_HISTORY,
  });
  const [query, setQuery] = useState('');
  const idsKey = history.map((entry) => entry.recordId).join(',');
  const [resolved, setResolved] = useState<ResolvedState>({ key: '', items: [], error: false });

  useEffect(() => {
    if (!idsKey) return;
    let active = true;
    const ids = idsKey.split(',').map(Number);
    void resolveWorkspaceRecords(ids)
      .then((items) => {
        if (active) setResolved({ key: idsKey, items, error: false });
      })
      .catch(() => {
        if (active) setResolved({ key: idsKey, items: [], error: true });
      });
    return () => {
      active = false;
    };
  }, [idsKey]);

  const metadataById = useMemo(() => new Map(
    history.map((entry) => [entry.recordId, historyOpenCount(locale, entry.openCount)]),
  ), [history, locale]);

  const visibleRecords = useMemo(() => {
    if (resolved.key !== idsKey) return [];
    const activeIds = new Set(history.map((entry) => entry.recordId));
    const recent = new Map(history.map((entry) => [entry.recordId, entry.lastOpenedAt]));
    const normalizedQuery = normalizeSearchText(query);
    return resolved.items
      .filter((record) => {
        if (!activeIds.has(record.id)) return false;
        if (!normalizedQuery) return true;
        const searchable = normalizeSearchText([
          record.shortcut,
          record.nameAr,
          record.mainDomain,
          record.category,
          record.subcategory,
        ].join(' '));
        return searchable.includes(normalizedQuery);
      })
      .sort((a, b) => Date.parse(recent.get(b.id) ?? '') - Date.parse(recent.get(a.id) ?? '') || a.id - b.id);
  }, [history, idsKey, query, resolved]);

  const remove = (recordId: number) => {
    setHistory(history.filter((entry) => entry.recordId !== recordId));
  };

  const clear = () => {
    if (window.confirm(copy.confirmClearHistory)) clearHistory();
  };

  if (history.length === 0) {
    return (
      <div className="workspace-empty">
        <p>{copy.emptyHistory}</p>
        <Link href={`/${locale}/library`}>{copy.backToLibrary}</Link>
      </div>
    );
  }

  const pending = resolved.key !== idsKey;
  const error = resolved.key === idsKey && resolved.error;

  return (
    <div className="workspace-view">
      <div className="workspace-toolbar">
        <label>
          <span>{copy.searchHistory}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" />
        </label>
        <button type="button" className="workspace-clear" onClick={clear}>{copy.clearHistory}</button>
      </div>

      {pending ? <p className="workspace-status" role="status">{copy.loading}</p> : null}
      {error ? <p className="workspace-status" role="alert">{copy.error}</p> : null}
      {!pending && !error && visibleRecords.length === 0 ? (
        <div className="workspace-empty">
          <p>{copy.emptyHistory}</p>
          <Link href={`/${locale}/library`}>{copy.backToLibrary}</Link>
        </div>
      ) : null}
      {!pending && !error && visibleRecords.length > 0 ? (
        <WorkspaceRecordList
          locale={locale}
          kind="history"
          records={visibleRecords}
          metadataById={metadataById}
          onRemove={remove}
        />
      ) : null}
    </div>
  );
}
