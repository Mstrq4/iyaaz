import assert from 'node:assert/strict';
import test from 'node:test';

import {
  chunkWorkspaceRecordIds,
  parseWorkspaceRecordIds,
  resolveWorkspaceRecords,
} from '../../src/lib/workspace/records.ts';

function fakeRecord(id: number) {
  return { id, shortcut: `/Shortcut${id}` };
}

test('batch workspace IDs are strict, deduplicated and preserve request order', () => {
  assert.deepEqual(parseWorkspaceRecordIds('3,7,3,22'), [3, 7, 22]);
  assert.equal(parseWorkspaceRecordIds(''), undefined);
  assert.equal(parseWorkspaceRecordIds('0'), undefined);
  assert.equal(parseWorkspaceRecordIds('-1'), undefined);
  assert.equal(parseWorkspaceRecordIds('3abc'), undefined);
  assert.equal(parseWorkspaceRecordIds('1,,2'), undefined);
  assert.equal(parseWorkspaceRecordIds(Array.from({ length: 101 }, (_, index) => index + 1).join(',')), undefined);
});

test('workspace record IDs chunk into bounded groups of one hundred', () => {
  const ids = Array.from({ length: 205 }, (_, index) => index + 1);
  const chunks = chunkWorkspaceRecordIds(ids);
  assert.deepEqual(chunks.map((chunk) => chunk.length), [100, 100, 5]);
  assert.equal(chunks[0][0], 1);
  assert.equal(chunks[2][4], 205);
});

test('record resolver chunks requests, omits missing records and restores local ID order', async () => {
  const ids = [...Array.from({ length: 101 }, (_, index) => index + 1), 999999];
  const requested: string[] = [];

  const fetcher = async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    const query = new URL(url, 'https://iyaaz.test').searchParams.get('ids') ?? '';
    const batch = query.split(',').filter(Boolean).map(Number);
    const items = batch
      .filter((id) => id !== 999999)
      .reverse()
      .map(fakeRecord);
    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const records = await resolveWorkspaceRecords(ids, fetcher as typeof fetch);
  assert.equal(requested.length, 2);
  assert.deepEqual(records.map((record) => record.id), Array.from({ length: 101 }, (_, index) => index + 1));
});
