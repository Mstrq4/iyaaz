'use client';

import type { Locale } from '../../lib/i18n';
import { isFavorite, parseFavorites, toggleFavorite } from '../../lib/workspace/favorites';
import { workspaceCopy } from '../../lib/workspace/copy';
import { WORKSPACE_KEYS, type FavoriteEntry } from '../../lib/workspace/types';
import { IyaazIcon } from '../icons/IyaazIcon';
import { useWorkspaceCollection } from './useWorkspaceCollection';

const EMPTY_FAVORITES: FavoriteEntry[] = [];
const serializeFavorites = (entries: FavoriteEntry[]) => JSON.stringify(entries);

export function FavoriteButton({ locale, recordId }: { locale: Locale; recordId: number }) {
  const copy = workspaceCopy[locale];
  const [favorites, setFavorites] = useWorkspaceCollection<FavoriteEntry[]>({
    key: WORKSPACE_KEYS.favorites,
    parse: parseFavorites,
    serialize: serializeFavorites,
    empty: EMPTY_FAVORITES,
  });
  const pressed = isFavorite(favorites, recordId);

  return (
    <button
      type="button"
      className="icon-button workspace-favorite-button"
      aria-label={copy.favorite}
      title={copy.favorite}
      aria-pressed={pressed}
      onClick={() => setFavorites(toggleFavorite(favorites, recordId, new Date().toISOString()))}
    >
      <IyaazIcon name="favorite" />
    </button>
  );
}
