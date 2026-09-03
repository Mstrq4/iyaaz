import type { FavoriteEntry } from './types.ts';

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

export function parseFavorites(raw: string): FavoriteEntry[] {
  if (!raw.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<number>();
  const entries: FavoriteEntry[] = [];
  for (const value of parsed) {
    if (!value || typeof value !== 'object') continue;
    const candidate = value as Record<string, unknown>;
    if (!isPositiveSafeInteger(candidate.recordId) || !isTimestamp(candidate.savedAt)) continue;
    if (seen.has(candidate.recordId)) continue;
    seen.add(candidate.recordId);
    entries.push({ recordId: candidate.recordId, savedAt: candidate.savedAt.trim() });
  }
  return entries;
}

export function toggleFavorite(
  entries: readonly FavoriteEntry[],
  recordId: number,
  now: string,
): FavoriteEntry[] {
  if (!isPositiveSafeInteger(recordId) || !isTimestamp(now)) return [...entries];
  if (entries.some((entry) => entry.recordId === recordId)) {
    return entries.filter((entry) => entry.recordId !== recordId);
  }
  return [{ recordId, savedAt: now.trim() }, ...entries];
}

export function isFavorite(entries: readonly FavoriteEntry[], recordId: number): boolean {
  return entries.some((entry) => entry.recordId === recordId);
}
