import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const modulePath = path.join(process.cwd(), 'src/lib/library/query-state.ts');

async function loadModule() {
  assert.ok(existsSync(modulePath), 'src/lib/library/query-state.ts must exist for Phase 5B');
  return import(pathToFileURL(modulePath).href);
}

test('parseLibraryQueryState normalizes values and chooses the correct default sort', async () => {
  const { parseLibraryQueryState } = await loadModule();

  assert.deepEqual(parseLibraryQueryState(''), {
    q: '',
    domain: '',
    category: '',
    subcategory: '',
    type: '',
    sort: 'id-asc',
    page: 1,
  });

  assert.deepEqual(parseLibraryQueryState('?q=%20logo%20&page=0&sort=unknown'), {
    q: 'logo',
    domain: '',
    category: '',
    subcategory: '',
    type: '',
    sort: 'relevance',
    page: 1,
  });
});

test('serializeLibraryQueryState omits empty/default values and remains round-trippable', async () => {
  const { parseLibraryQueryState, serializeLibraryQueryState } = await loadModule();
  const state = parseLibraryQueryState('?q=logo&domain=Branding&category=Logos&type=Master&sort=id-desc&page=3');

  assert.equal(
    serializeLibraryQueryState(state),
    'q=logo&domain=Branding&category=Logos&type=Master&sort=id-desc&page=3',
  );
  assert.equal(serializeLibraryQueryState(parseLibraryQueryState('')), '');
  assert.equal(serializeLibraryQueryState(parseLibraryQueryState('?q=logo&sort=relevance&page=1')), 'q=logo');
});

test('updateLibraryQueryState resets dependent filters and page deterministically', async () => {
  const { updateLibraryQueryState } = await loadModule();
  const base = {
    q: '',
    domain: 'A',
    category: 'A1',
    subcategory: 'A1x',
    type: 'Master',
    sort: 'id-asc' as const,
    page: 4,
  };

  assert.deepEqual(updateLibraryQueryState(base, { domain: 'B' }), {
    ...base,
    domain: 'B',
    category: '',
    subcategory: '',
    page: 1,
  });

  assert.deepEqual(updateLibraryQueryState(base, { category: 'A2' }), {
    ...base,
    category: 'A2',
    subcategory: '',
    page: 1,
  });

  assert.deepEqual(updateLibraryQueryState(base, { type: 'متخصص' }), {
    ...base,
    type: 'متخصص',
    page: 1,
  });
});

test('query changes switch between implicit default sorts without overriding an explicit sort', async () => {
  const { updateLibraryQueryState } = await loadModule();
  const emptyDefault = {
    q: '', domain: '', category: '', subcategory: '', type: '', sort: 'id-asc' as const, page: 7,
  };
  const searched = updateLibraryQueryState(emptyDefault, { q: 'logo' });
  assert.equal(searched.sort, 'relevance');
  assert.equal(searched.page, 1);

  const explicit = { ...searched, sort: 'id-desc' as const };
  assert.equal(updateLibraryQueryState(explicit, { q: 'poster' }).sort, 'id-desc');
});

test('page helpers use a fixed 50-row page size and clamp against totals', async () => {
  const { LIBRARY_PAGE_SIZE, clampLibraryPage, offsetForLibraryPage } = await loadModule();

  assert.equal(LIBRARY_PAGE_SIZE, 50);
  assert.equal(offsetForLibraryPage(1), 0);
  assert.equal(offsetForLibraryPage(3), 100);
  assert.equal(clampLibraryPage(0, 51), 1);
  assert.equal(clampLibraryPage(999, 51), 2);
  assert.equal(clampLibraryPage(4, 0), 1);
});
