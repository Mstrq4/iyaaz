import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSitemapEntries } from '../../src/lib/seo/sitemap.ts';
import type { LibraryRecord } from '../../src/lib/library/types.ts';

function record(id: number): LibraryRecord {
  return {
    id,
    shortcut: `/Shortcut${id}`,
    nameAr: `اختصار ${id}`,
    mainDomain: 'التصميم',
    category: 'فئة',
    subcategory: 'فرعية',
    shortcutType: 'متخصص',
    functionText: 'وظيفة',
    requiredInputs: 'مدخلات',
    executionInstructions: 'تعليمات',
    outputs: 'مخرجات',
    sizeRatio: '',
    materialsTech: '',
    lighting: '',
    installationExecution: '',
    visualStyle: '',
    brandCompliance: '',
    combinedShortcuts: '',
    bestUse: '',
    keywords: '',
    assetType: '',
    notes: '',
  };
}

test('public sitemap contains clean bilingual collection routes, every Arabic shortcut, and translated English shortcuts only', () => {
  const entries = buildSitemapEntries({
    mode: 'public',
    siteOrigin: new URL('https://iyaaz.example'),
    records: [record(1), record(2), record(3)],
    translatedEnglishIds: new Set([2, 3, 999]),
  });
  const urls = entries.map((entry) => entry.url);

  assert.deepEqual(urls.slice(0, 8), [
    'https://iyaaz.example/ar',
    'https://iyaaz.example/en',
    'https://iyaaz.example/ar/library',
    'https://iyaaz.example/en/library',
    'https://iyaaz.example/ar/docs',
    'https://iyaaz.example/en/docs',
    'https://iyaaz.example/ar/statistics',
    'https://iyaaz.example/en/statistics',
  ]);

  assert.ok(urls.includes('https://iyaaz.example/ar/library/1'));
  assert.ok(urls.includes('https://iyaaz.example/ar/library/2'));
  assert.ok(urls.includes('https://iyaaz.example/ar/library/3'));
  assert.ok(!urls.includes('https://iyaaz.example/en/library/1'));
  assert.ok(urls.includes('https://iyaaz.example/en/library/2'));
  assert.ok(urls.includes('https://iyaaz.example/en/library/3'));
  assert.ok(!urls.includes('https://iyaaz.example/en/library/999'));

  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every((url) => !/[?#]/.test(url)));
  assert.ok(urls.every((url) => !/credential|token|source|reference|favorites|history|clients|access/i.test(url)));
});

test('private and shared sitemap inventories are empty', () => {
  for (const mode of ['private', 'shared'] as const) {
    const entries = buildSitemapEntries({
      mode,
      siteOrigin: new URL('https://iyaaz.example'),
      records: [record(1)],
      translatedEnglishIds: new Set([1]),
    });
    assert.deepEqual(entries, []);
  }
});
