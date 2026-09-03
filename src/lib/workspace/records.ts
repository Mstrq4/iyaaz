import type { LibraryRecord } from '../library/types.ts';

export const WORKSPACE_RECORD_BATCH_LIMIT = 100;

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function normalizeRecordIds(ids: readonly number[]): number[] {
  const seen = new Set<number>();
  const normalized: number[] = [];
  for (const id of ids) {
    if (!isPositiveSafeInteger(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }
  return normalized;
}

export function parseWorkspaceRecordIds(raw: string | null): number[] | undefined {
  if (raw === null || !raw.trim()) return undefined;
  const parts = raw.split(',');
  if (parts.length > WORKSPACE_RECORD_BATCH_LIMIT || parts.some((part) => !/^[1-9]\d*$/.test(part))) {
    return undefined;
  }

  const ids = parts.map(Number);
  if (ids.some((id) => !isPositiveSafeInteger(id))) return undefined;
  return normalizeRecordIds(ids);
}

export function chunkWorkspaceRecordIds(
  ids: readonly number[],
  limit = WORKSPACE_RECORD_BATCH_LIMIT,
): number[][] {
  const normalizedLimit = Number.isSafeInteger(limit) && limit > 0 ? limit : WORKSPACE_RECORD_BATCH_LIMIT;
  const normalized = normalizeRecordIds(ids);
  const chunks: number[][] = [];
  for (let index = 0; index < normalized.length; index += normalizedLimit) {
    chunks.push(normalized.slice(index, index + normalizedLimit));
  }
  return chunks;
}

function isLibraryRecordArray(value: unknown): value is LibraryRecord[] {
  return Array.isArray(value) && value.every((item) => (
    item !== null &&
    typeof item === 'object' &&
    Number.isSafeInteger((item as { id?: unknown }).id) &&
    typeof (item as { shortcut?: unknown }).shortcut === 'string'
  ));
}

export async function resolveWorkspaceRecords(
  ids: readonly number[],
  fetcher: typeof fetch = fetch,
): Promise<LibraryRecord[]> {
  const normalized = normalizeRecordIds(ids);
  if (normalized.length === 0) return [];

  const byId = new Map<number, LibraryRecord>();
  for (const batch of chunkWorkspaceRecordIds(normalized)) {
    const params = new URLSearchParams({ ids: batch.join(',') });
    const response = await fetcher(`/api/shortcuts?${params.toString()}`);
    if (!response.ok) throw new Error(`workspace records ${response.status}`);
    const payload = await response.json() as { items?: unknown };
    if (!isLibraryRecordArray(payload.items)) throw new Error('invalid workspace records payload');
    for (const record of payload.items) byId.set(record.id, record);
  }

  return normalized.flatMap((id) => {
    const record = byId.get(id);
    return record ? [record] : [];
  });
}
