import assert from 'node:assert/strict';
import test from 'node:test';

import { getLibraryTaxonomy } from '../../src/lib/library/server.ts';
import { buildCatalogStatistics } from '../../src/lib/content/statistics.ts';

function assertCountDescendingThenArabicName(items: readonly { name: string; count: number }[]) {
  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1]!;
    const current = items[index]!;
    assert.ok(
      previous.count > current.count
        || (previous.count === current.count
          && previous.name.localeCompare(current.name, 'ar', { sensitivity: 'base', numeric: true }) <= 0),
      `${previous.name} (${previous.count}) must sort before ${current.name} (${current.count})`,
    );
  }
}

test('catalog statistics are projected from the canonical taxonomy with exact verified totals', async () => {
  const taxonomy = await getLibraryTaxonomy();
  const statistics = buildCatalogStatistics(taxonomy);

  assert.deepEqual(statistics.totals, {
    records: 5812,
    domains: 9,
    categories: 21,
    subcategories: 364,
  });
});

test('shortcut type counts are truthful, complete and deterministically sorted', async () => {
  const statistics = buildCatalogStatistics(await getLibraryTaxonomy());

  assert.equal(statistics.shortcutTypes.reduce((sum, item) => sum + item.count, 0), 5812);
  assert.deepEqual(
    Object.fromEntries(statistics.shortcutTypes.map((item) => [item.name, item.count])),
    {
      'متخصص': 5622,
      'مركب': 72,
      Master: 118,
    },
  );
  assertCountDescendingThenArabicName(statistics.shortcutTypes);
});

test('domain and category distributions are deterministic and preserve canonical counts', async () => {
  const statistics = buildCatalogStatistics(await getLibraryTaxonomy());

  assert.equal(statistics.domains.length, 9);
  assert.equal(statistics.domains.reduce((sum, domain) => sum + domain.count, 0), 5812);
  assertCountDescendingThenArabicName(statistics.domains);

  for (const domain of statistics.domains) {
    assert.equal(domain.categories.reduce((sum, category) => sum + category.count, 0), domain.count);
    assertCountDescendingThenArabicName(domain.categories);
  }
});
