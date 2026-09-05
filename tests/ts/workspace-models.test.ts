import assert from 'node:assert/strict';
import test from 'node:test';

import {
  WORKSPACE_KEYS,
  HISTORY_LIMIT,
  type ClientProfileInput,
} from '../../src/lib/workspace/types.ts';
import {
  isFavorite,
  parseFavorites,
  toggleFavorite,
} from '../../src/lib/workspace/favorites.ts';
import {
  parseHistory,
  recordHistory,
} from '../../src/lib/workspace/history.ts';
import {
  createClientProfile,
  parseClientProfiles,
  removeClientProfile,
  updateClientProfile,
} from '../../src/lib/workspace/clients.ts';

const t1 = '2026-09-03T00:00:00.000Z';
const t2 = '2026-09-03T01:00:00.000Z';
const t3 = '2026-09-03T02:00:00.000Z';

const clientInput: ClientProfileInput = {
  name: '  متجر ألف  ',
  businessDescription: '  متجر هواتف ذكية  ',
  brandColors: '  #3E1848, #E7E6F5  ',
  tone: '  فاخر وواضح  ',
  constraints: '  بدون ازدحام بصري  ',
  notes: '  الأولوية للهوية  ',
};

test('workspace keys and history bound are versioned and stable', () => {
  assert.deepEqual(WORKSPACE_KEYS, {
    favorites: 'iyaaz:favorites:v1',
    history: 'iyaaz:history:v1',
    clients: 'iyaaz:clients:v1',
  });
  assert.equal(HISTORY_LIMIT, 200);
});

test('favorite parsing rejects malformed entries and deduplicates record ids', () => {
  const raw = JSON.stringify([
    { recordId: 3, savedAt: t2 },
    { recordId: 3, savedAt: t1 },
    { recordId: 0, savedAt: t1 },
    { recordId: 7, savedAt: '' },
    { recordId: 8, savedAt: t3 },
  ]);

  assert.deepEqual(parseFavorites(raw), [
    { recordId: 3, savedAt: t2 },
    { recordId: 8, savedAt: t3 },
  ]);
});

test('favorite toggle adds once and removes every duplicate of an existing record', () => {
  const added = toggleFavorite([], 3, t2);
  assert.deepEqual(added, [{ recordId: 3, savedAt: t2 }]);
  assert.equal(isFavorite(added, 3), true);

  const removed = toggleFavorite([
    { recordId: 3, savedAt: t2 },
    { recordId: 7, savedAt: t1 },
    { recordId: 3, savedAt: t1 },
  ], 3, t3);
  assert.deepEqual(removed, [{ recordId: 7, savedAt: t1 }]);
  assert.equal(isFavorite(removed, 3), false);
});

test('history recording increments an existing entry and moves it to the front', () => {
  const result = recordHistory([
    { recordId: 2, lastOpenedAt: t2, openCount: 1 },
    { recordId: 1, lastOpenedAt: t1, openCount: 2 },
  ], 1, t3);

  assert.deepEqual(result, [
    { recordId: 1, lastOpenedAt: t3, openCount: 3 },
    { recordId: 2, lastOpenedAt: t2, openCount: 1 },
  ]);
});

test('history parsing is safe, deduplicated and ordered by most recent open', () => {
  const raw = JSON.stringify([
    { recordId: 1, lastOpenedAt: t1, openCount: 2 },
    { recordId: 2, lastOpenedAt: t3, openCount: 1 },
    { recordId: 1, lastOpenedAt: t2, openCount: 9 },
    { recordId: -1, lastOpenedAt: t3, openCount: 1 },
    { recordId: 9, lastOpenedAt: t3, openCount: 0 },
  ]);

  assert.deepEqual(parseHistory(raw), [
    { recordId: 2, lastOpenedAt: t3, openCount: 1 },
    { recordId: 1, lastOpenedAt: t2, openCount: 9 },
  ]);
  assert.deepEqual(parseHistory('not-json'), []);
});

test('history stays bounded at HISTORY_LIMIT while preserving newest-first order', () => {
  const existing = Array.from({ length: HISTORY_LIMIT }, (_, index) => ({
    recordId: index + 1,
    lastOpenedAt: new Date(Date.UTC(2026, 8, 1, 0, index, 0)).toISOString(),
    openCount: 1,
  })).reverse();

  const result = recordHistory(existing, HISTORY_LIMIT + 1, t3);
  assert.equal(result.length, HISTORY_LIMIT);
  assert.equal(result[0]?.recordId, HISTORY_LIMIT + 1);
  assert.equal(result.some((entry) => entry.recordId === 1), false);
});

test('client profile create normalizes user-authored fields and preserves explicit id/timestamps', () => {
  const profile = createClientProfile(clientInput, t1, 'client-1');
  assert.deepEqual(profile, {
    id: 'client-1',
    name: 'متجر ألف',
    businessDescription: 'متجر هواتف ذكية',
    brandColors: '#3E1848, #E7E6F5',
    tone: 'فاخر وواضح',
    constraints: 'بدون ازدحام بصري',
    notes: 'الأولوية للهوية',
    createdAt: t1,
    updatedAt: t1,
  });
});

test('client profile update preserves identity/creation time, replaces normalized fields and updates updatedAt', () => {
  const original = createClientProfile(clientInput, t1, 'client-1');
  const patch: ClientProfileInput = {
    ...clientInput,
    name: '  متجر باء  ',
    notes: '  ملاحظة محدثة  ',
  };

  const updated = updateClientProfile([original], 'client-1', patch, t2);
  assert.equal(updated.length, 1);
  assert.equal(updated[0]?.id, 'client-1');
  assert.equal(updated[0]?.createdAt, t1);
  assert.equal(updated[0]?.updatedAt, t2);
  assert.equal(updated[0]?.name, 'متجر باء');
  assert.equal(updated[0]?.notes, 'ملاحظة محدثة');
});

test('client profile parsing rejects malformed records, deduplicates ids and CRUD removal is immutable', () => {
  const valid = createClientProfile(clientInput, t1, 'client-1');
  const second = createClientProfile({ ...clientInput, name: 'عميل ثان' }, t2, 'client-2');
  const parsed = parseClientProfiles(JSON.stringify([
    valid,
    { ...valid, name: 'duplicate' },
    { ...second, id: '' },
    second,
  ]));

  assert.deepEqual(parsed, [valid, second]);
  assert.deepEqual(parseClientProfiles('{bad-json'), []);

  const removed = removeClientProfile(parsed, 'client-1');
  assert.deepEqual(removed, [second]);
  assert.deepEqual(parsed, [valid, second], 'remove must not mutate the input array');
});
