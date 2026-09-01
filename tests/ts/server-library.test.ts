import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const serverPath = path.join(process.cwd(), 'src/lib/library/server.ts');
const searchRoutePath = path.join(process.cwd(), 'src/app/api/search/route.ts');
const taxonomyRoutePath = path.join(process.cwd(), 'src/app/api/taxonomy/route.ts');
const detailRoutePath = path.join(process.cwd(), 'src/app/api/shortcuts/[id]/route.ts');

function assertPublicPayload(value: unknown): void {
  const serialized = JSON.stringify(value);
  assert.equal(/https?:\/\//i.test(serialized), false, 'API payload must not expose URLs');
  assert.equal(/www\./i.test(serialized), false, 'API payload must not expose www URLs');
  assert.equal(/"(?:source|reference|sourceReference|المصدر المرجعي)"\s*:/i.test(serialized), false, 'API payload must not expose source/reference fields');
}

async function importRequired(modulePath: string, message: string) {
  assert.ok(existsSync(modulePath), message);
  return import(pathToFileURL(modulePath).href);
}

test('server loader caches the committed 5,812-record snapshot and exposes deterministic lookup', async () => {
  const server = await importRequired(serverPath, 'src/lib/library/server.ts must exist for Phase 3D');
  const first = await server.loadLibraryRecords();
  const second = await server.loadLibraryRecords();

  assert.equal(first, second, 'loader must reuse the same in-memory snapshot');
  assert.equal(first.length, 5812);
  assert.equal(server.findLibraryRecordById(first, 3)?.shortcut, '/ACPStorefrontLuxury');
  assert.equal(server.findLibraryRecordById(first, 99999), undefined);
  assertPublicPayload(first[0]);
});

test('taxonomy service derives the verified hierarchy and type counts from the snapshot', async () => {
  const server = await importRequired(serverPath, 'src/lib/library/server.ts must exist for Phase 3D');
  const taxonomy = await server.getLibraryTaxonomy();

  assert.equal(taxonomy.totals.records, 5812);
  assert.equal(taxonomy.totals.domains, 9);
  assert.equal(taxonomy.totals.categories, 21);
  assert.equal(taxonomy.totals.subcategories, 364);
  assert.deepEqual(Object.fromEntries(taxonomy.shortcutTypes.map((item: { name: string; count: number }) => [item.name, item.count])), {
    Master: 118,
    'متخصص': 5622,
    'مركب': 72,
  });
  assert.equal(taxonomy.domains.length, 9);
  assertPublicPayload(taxonomy);
});

test('search API uses the server snapshot, filters query parameters and returns only public data', async () => {
  const route = await importRequired(searchRoutePath, 'src/app/api/search/route.ts must exist for Phase 3D');
  const request = new Request('http://localhost/api/search?q=%2FACPStorefrontLuxury&domain=%D8%A7%D9%84%D9%88%D8%A7%D8%AC%D9%87%D8%A7%D8%AA%20%D8%A7%D9%84%D8%AA%D8%AC%D8%A7%D8%B1%D9%8A%D8%A9&limit=5');
  const response = await route.GET(request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.items[0].id, 3);
  assert.equal(payload.items[0].shortcut, '/ACPStorefrontLuxury');
  assert.equal(payload.limit, 5);
  assertPublicPayload(payload);
});

test('taxonomy API exposes the derived hierarchy without source/reference data', async () => {
  const route = await importRequired(taxonomyRoutePath, 'src/app/api/taxonomy/route.ts must exist for Phase 3D');
  const response = await route.GET();
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.totals.records, 5812);
  assert.equal(payload.domains.length, 9);
  assertPublicPayload(payload);
});

test('shortcut detail API returns one record and a deterministic 404 for missing IDs', async () => {
  const route = await importRequired(detailRoutePath, 'src/app/api/shortcuts/[id]/route.ts must exist for Phase 3D');
  const ok = await route.GET(new Request('http://localhost/api/shortcuts/3'), { params: Promise.resolve({ id: '3' }) });
  const item = await ok.json();
  assert.equal(ok.status, 200);
  assert.equal(item.id, 3);
  assert.equal(item.shortcut, '/ACPStorefrontLuxury');
  assertPublicPayload(item);

  const missing = await route.GET(new Request('http://localhost/api/shortcuts/99999'), { params: Promise.resolve({ id: '99999' }) });
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'not_found' });
});
