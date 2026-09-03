import { expect, test } from '@playwright/test';

const FAVORITES_KEY = 'iyaaz:favorites:v1';
const HISTORY_KEY = 'iyaaz:history:v1';

test('batch shortcut endpoint is strict, deduplicated and omits missing IDs', async ({ request }) => {
  const response = await request.get('/api/shortcuts?ids=3,3,999999');
  expect(response.status()).toBe(200);
  const payload = await response.json() as { items: Array<{ id: number; shortcut: string }> };
  expect(payload.items.map((item) => item.id)).toEqual([3]);
  expect(payload.items[0].shortcut).toBe('/ACPStorefrontLuxury');

  for (const query of ['', '0', '-1', '3abc', '1,,2']) {
    const invalid = await request.get(`/api/shortcuts?ids=${encodeURIComponent(query)}`);
    expect(invalid.status()).toBe(400);
  }
});

test('favorite from an Arabic library row persists across reload with stable toggle semantics', async ({ page }) => {
  await page.goto('/ar/library?q=%2FACPStorefrontLuxury');
  const row = page.locator('[data-record-id="3"]');
  const favorite = row.getByRole('button', { name: 'المفضلة' });

  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), FAVORITES_KEY)).toContain('"recordId":3');

  await page.reload();
  await expect(page.locator('[data-record-id="3"]').getByRole('button', { name: 'المفضلة' })).toHaveAttribute('aria-pressed', 'true');
});

test('favorite from detail resolves on the favorites page and missing canonical IDs are omitted', async ({ page }) => {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify([{ recordId: 999999, savedAt: '2026-09-03T00:00:00.000Z' }]));
  }, { key: FAVORITES_KEY });
  await page.goto('/en/library/3');

  const favorite = page.getByRole('button', { name: 'Favorite' });
  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/en/favorites');
  await expect(page.getByRole('heading', { level: 1, name: 'Favorites' })).toBeVisible();
  await expect(page.getByText('/ACPStorefrontLuxury', { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-record-id="999999"]')).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test('favorites can remove one entry and clear all with confirmation', async ({ page }) => {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify([
      { recordId: 3, savedAt: '2026-09-03T01:00:00.000Z' },
      { recordId: 7, savedAt: '2026-09-03T00:00:00.000Z' },
    ]));
  }, { key: FAVORITES_KEY });
  await page.goto('/en/favorites');

  await page.getByRole('button', { name: 'Remove /ACPStorefrontLuxury from favorites' }).click();
  await expect(page.getByText('/ACPStorefrontLuxury', { exact: true })).toHaveCount(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear favorites' }).click();
  await expect(page.getByText('No favorites yet.')).toBeVisible();
});

test('opening a detail records and increments browser-local history without a mutation request', async ({ page }) => {
  const mutationRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') mutationRequests.push(`${request.method()} ${request.url()}`);
  });
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify([
      { recordId: 3, lastOpenedAt: '2026-09-02T00:00:00.000Z', openCount: 1 },
    ]));
  }, { key: HISTORY_KEY });

  await page.goto('/en/library/3');
  await expect.poll(async () => {
    return page.evaluate((key) => {
      const entries = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{ recordId: number; openCount: number }>;
      return entries.find((entry) => entry.recordId === 3)?.openCount ?? 0;
    }, HISTORY_KEY);
  }).toBe(2);
  expect(mutationRequests).toEqual([]);

  await page.goto('/en/history');
  await expect(page.getByRole('heading', { level: 1, name: 'History' })).toBeVisible();
  await expect(page.getByText('/ACPStorefrontLuxury', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('2 opens')).toBeVisible();
});

test('history supports removing entries, clearing with confirmation and Arabic empty state', async ({ page }) => {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify([
      { recordId: 3, lastOpenedAt: '2026-09-03T01:00:00.000Z', openCount: 2 },
      { recordId: 7, lastOpenedAt: '2026-09-03T00:00:00.000Z', openCount: 1 },
    ]));
  }, { key: HISTORY_KEY });
  await page.goto('/ar/history');

  await page.getByRole('button', { name: 'إزالة /ACPStorefrontLuxury من السجل' }).click();
  await expect(page.getByText('/ACPStorefrontLuxury', { exact: true })).toHaveCount(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'مسح السجل' }).click();
  await expect(page.getByText('لم تفتح أي اختصارات بعد.')).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});
