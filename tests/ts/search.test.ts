import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const modulePath = path.join(process.cwd(), 'src/lib/library/search.ts');
const snapshotPath = path.join(process.cwd(), 'data/library.snapshot.json');

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  shortcut: '/LogoModern',
  nameAr: 'شعار حديث',
  mainDomain: 'الشعارات والهوية',
  category: 'الشعارات',
  subcategory: 'شعار حديث',
  shortcutType: 'متخصص',
  functionText: 'إنشاء شعار حديث',
  requiredInputs: 'اسم العلامة',
  executionInstructions: 'استخدم تكوينًا نظيفًا',
  outputs: 'شعار',
  sizeRatio: '1:1',
  materialsTech: '',
  lighting: '',
  installationExecution: '',
  visualStyle: 'معدني حديث',
  brandCompliance: 'حافظ على الهوية',
  combinedShortcuts: '',
  bestUse: 'هوية بصرية',
  keywords: 'logo modern branding',
  assetType: 'شعار',
  notes: '',
  ...overrides,
});

async function loadSearchModule() {
  assert.ok(existsSync(modulePath), 'src/lib/library/search.ts must exist for Phase 3C');
  return import(pathToFileURL(modulePath).href);
}

test('normalizes Arabic variants, diacritics, tatweel, case and whitespace', async () => {
  const { normalizeSearchText } = await loadSearchModule();
  assert.equal(normalizeSearchText('  إِعْــلَان   آلِيّ  '), 'اعلان الي');
  assert.equal(normalizeSearchText('  Logo   DESIGN  '), 'logo design');
});

test('ranks exact shortcut matches ahead of weaker text matches', async () => {
  const { searchLibrary } = await loadSearchModule();
  const records = [
    makeRecord(),
    makeRecord({ id: 2, shortcut: '/PosterModern', nameAr: 'ملصق حديث', keywords: 'poster /LogoModern inspiration' }),
  ];
  const result = searchLibrary(records, { query: '/LogoModern' });
  assert.equal(result.total, 2);
  assert.deepEqual(result.items.map((item: { id: number }) => item.id), [1, 2]);
});

test('matches query tokens across useful record fields', async () => {
  const { searchLibrary } = await loadSearchModule();
  const records = [
    makeRecord({ id: 1, visualStyle: 'معدني', bestUse: 'هوية بصرية' }),
    makeRecord({ id: 2, shortcut: '/Other', visualStyle: 'ورقي', bestUse: 'مطبوعة' }),
  ];
  const result = searchLibrary(records, { query: 'هوية معدنية' });
  assert.deepEqual(result.items.map((item: { id: number }) => item.id), [1]);
});

test('applies domain/category/subcategory/type filters and deterministic sorting', async () => {
  const { searchLibrary } = await loadSearchModule();
  const records = [
    makeRecord({ id: 1, shortcut: '/A', mainDomain: 'د1', category: 'ف1', subcategory: 'ص1', shortcutType: 'متخصص' }),
    makeRecord({ id: 2, shortcut: '/B', mainDomain: 'د1', category: 'ف1', subcategory: 'ص1', shortcutType: 'Master' }),
    makeRecord({ id: 3, shortcut: '/C', mainDomain: 'د2', category: 'ف2', subcategory: 'ص2', shortcutType: 'Master' }),
  ];
  const filtered = searchLibrary(records, {
    filters: { mainDomain: 'د1', category: 'ف1', subcategory: 'ص1', shortcutType: 'Master' },
  });
  assert.deepEqual(filtered.items.map((item: { id: number }) => item.id), [2]);

  const sorted = searchLibrary(records, { sort: 'id-desc' });
  assert.deepEqual(sorted.items.map((item: { id: number }) => item.id), [3, 2, 1]);
});

test('searches the committed 5,812-record snapshot deterministically', async () => {
  const { searchLibrary } = await loadSearchModule();
  const records = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  assert.equal(records.length, 5812);

  const exact = searchLibrary(records, { query: '/ACPStorefrontLuxury', limit: 5 });
  assert.equal(exact.total >= 1, true);
  assert.equal(exact.items[0].id, 3);

  const arabic = searchLibrary(records, { query: 'كلادينج فاخر', limit: 10 });
  assert.equal(arabic.items.some((item: { id: number }) => item.id === 3), true);
});
