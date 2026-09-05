'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Locale } from '../../lib/i18n';
import { normalizeSearchText } from '../../lib/library/search';
import type { LibraryRecord } from '../../lib/library/types';
import { parseFavorites } from '../../lib/workspace/favorites';
import { resolveWorkspaceRecords } from '../../lib/workspace/records';
import { WORKSPACE_KEYS, type FavoriteEntry } from '../../lib/workspace/types';
import { workspaceCopy } from '../../lib/workspace/copy';
import { useWorkspaceCollection } from './useWorkspaceCollection';
import { WorkspaceRecordList } from './WorkspaceRecordList';

const EMPTY_FAVORITES: FavoriteEntry[] = [];
const serializeFavorites = (entries: FavoriteEntry[]) => JSON.stringify(entries);
type FavoriteSort = 'newest' | 'shortcut' | 'name';

interface ResolvedState {
  key: string;
  items: LibraryRecord[];
  error: boolean;
}

export function FavoritesView({ locale }: { locale: Locale }) {
  const copy = workspaceCopy[locale];
  const [favorites, setFavorites, clearFavorites] = useWorkspaceCollection<FavoriteEntry[]>({
    key: WORKSPACE_KEYS.favorites,
    parse: parseFavorites,
    serialize: serializeFavorites,
    empty: EMPTY_FAVORITES,
  });
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<FavoriteSort>('newest');
  const idsKey = favorites.map((entry) => entry.recordId).join(',');
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

  const visibleRecords = useMemo(() => {
    if (resolved.key !== idsKey) return [];
    const activeIds = new Set(favorites.map((entry) => entry.recordId));
    const savedAt = new Map(favorites.map((entry) => [entry.recordId, entry.savedAt]));
    const normalizedQuery = normalizeSearchText(query);
    const items = resolved.items.filter((record) => {
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
    });

    return [...items].sort((a, b) => {
      if (sort === 'shortcut') return a.shortcut.localeCompare(b.shortcut, 'en', { sensitivity: 'base' });
      if (sort === 'name') return a.nameAr.localeCompare(b.nameAr, 'ar', { sensitivity: 'base' });
      return Date.parse(savedAt.get(b.id) ?? '') - Date.parse(savedAt.get(a.id) ?? '') || a.id - b.id;
    });
  }, [favorites, idsKey, query, resolved, sort]);

  const remove = (recordId: number) => {
    setFavorites(favorites.filter((entry) => entry.recordId !== recordId));
  };

  const clear = () => {
    if (window.confirm(copy.confirmClearFavorites)) clearFavorites();
  };

  if (favorites.length === 0) {
    return (
      <div className="workspace-empty">
        <p>{copy.emptyFavorites}</p>
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
          <span>{copy.searchFavorites}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" />
        </label>
        <label>
          <span>{copy.sort}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as FavoriteSort)}>
            <option value="newest">{copy.newest}</option>
            <option value="shortcut">{copy.shortcut}</option>
            <option value="name">{copy.name}</option>
          </select>
        </label>
        <button type="button" className="workspace-clear" onClick={clear}>{copy.clearFavorites}</button>
      </div>

      {pending ? <p className="workspace-status" role="status">{copy.loading}</p> : null}
      {error ? <p className="workspace-status" role="alert">{copy.error}</p> : null}
      {!pending && !error && visibleRecords.length === 0 ? (
        <div className="workspace-empty">
          <p>{copy.emptyFavorites}</p>
          <Link href={`/${locale}/library`}>{copy.backToLibrary}</Link>
        </div>
      ) : null}
      {!pending && !error && visibleRecords.length > 0 ? (
        <WorkspaceRecordList locale={locale} kind="favorites" records={visibleRecords} onRemove={remove} />
      ) : null}
    </div>
  );
}
