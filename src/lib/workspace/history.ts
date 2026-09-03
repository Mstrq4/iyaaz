import { HISTORY_LIMIT, type HistoryEntry } from './types.ts';

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function compareRecent(a: HistoryEntry, b: HistoryEntry): number {
  return Date.parse(b.lastOpenedAt) - Date.parse(a.lastOpenedAt) || a.recordId - b.recordId;
}

export function parseHistory(raw: string): HistoryEntry[] {
  if (!raw.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const byId = new Map<number, HistoryEntry>();
  for (const value of parsed) {
    if (!value || typeof value !== 'object') continue;
    const candidate = value as Record<string, unknown>;
    if (
      !isPositiveSafeInteger(candidate.recordId) ||
      !isTimestamp(candidate.lastOpenedAt) ||
      !isPositiveSafeInteger(candidate.openCount)
    ) continue;

    const entry: HistoryEntry = {
      recordId: candidate.recordId,
      lastOpenedAt: candidate.lastOpenedAt.trim(),
      openCount: candidate.openCount,
    };
    const current = byId.get(entry.recordId);
    if (!current || Date.parse(entry.lastOpenedAt) > Date.parse(current.lastOpenedAt)) {
      byId.set(entry.recordId, entry);
    }
  }

  return [...byId.values()].sort(compareRecent).slice(0, HISTORY_LIMIT);
}

export function recordHistory(
  entries: readonly HistoryEntry[],
  recordId: number,
  now: string,
): HistoryEntry[] {
  if (!isPositiveSafeInteger(recordId) || !isTimestamp(now)) return [...entries];

  const existingCount = entries
    .filter((entry) => entry.recordId === recordId && isPositiveSafeInteger(entry.openCount))
    .reduce((maximum, entry) => Math.max(maximum, entry.openCount), 0);

  const next: HistoryEntry[] = [
    { recordId, lastOpenedAt: now.trim(), openCount: existingCount + 1 },
    ...entries.filter((entry) => entry.recordId !== recordId),
  ];

  return next.sort(compareRecent).slice(0, HISTORY_LIMIT);
}
