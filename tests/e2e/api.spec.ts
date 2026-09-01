import { expect, test } from '@playwright/test';

function expectPublicPayload(value: unknown): void {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toMatch(/https?:\/\//i);
  expect(serialized).not.toMatch(/www\./i);
  expect(serialized).not.toMatch(/"(?:source|reference|sourceReference|المصدر المرجعي)"\s*:/i);
}

test.describe('Phase 3E HTTP API contract', () => {
  test('search returns the known shortcut through the running Next.js server', async ({ request }) => {
    const response = await request.get('/api/search', {
      params: {
        q: '/ACPStorefrontLuxury',
        domain: 'الواجهات التجارية',
        limit: '5',
      },
    });

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.limit).toBe(5);
    expect(payload.offset).toBe(0);
    expect(payload.sort).toBe('relevance');
    expect(payload.items[0]).toMatchObject({
      id: 3,
      shortcut: '/ACPStorefrontLuxury',
      mainDomain: 'الواجهات التجارية',
    });
    expectPublicPayload(payload);
  });

  test('search applies type filtering, deterministic sorting and pagination over HTTP', async ({ request }) => {
    const response = await request.get('/api/search', {
      params: {
        type: 'Master',
        sort: 'id-desc',
        offset: '1',
        limit: '3',
      },
    });

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.total).toBe(118);
    expect(payload.offset).toBe(1);
    expect(payload.limit).toBe(3);
    expect(payload.sort).toBe('id-desc');
    expect(payload.items).toHaveLength(3);
    expect(payload.items.every((item: { shortcutType: string }) => item.shortcutType === 'Master')).toBe(true);
    expect(payload.items[0].id).toBeGreaterThan(payload.items[1].id);
    expect(payload.items[1].id).toBeGreaterThan(payload.items[2].id);
    expectPublicPayload(payload);
  });

  test('search clamps bounds and falls back from invalid sort values over HTTP', async ({ request }) => {
    const response = await request.get('/api/search', {
      params: {
        limit: '9999',
        offset: '-20',
        sort: 'unsupported-sort',
      },
    });

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.total).toBe(5812);
    expect(payload.offset).toBe(0);
    expect(payload.limit).toBe(200);
    expect(payload.sort).toBe('relevance');
    expect(payload.items).toHaveLength(200);
    expectPublicPayload(payload);
  });

  test('taxonomy exposes the verified hierarchy through the running server', async ({ request }) => {
    const response = await request.get('/api/taxonomy');

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.totals).toEqual({
      records: 5812,
      domains: 9,
      categories: 21,
      subcategories: 364,
    });
    expect(payload.domains).toHaveLength(9);
    expect(Object.fromEntries(payload.shortcutTypes.map((item: { name: string; count: number }) => [item.name, item.count]))).toEqual({
      Master: 118,
      'متخصص': 5622,
      'مركب': 72,
    });
    expectPublicPayload(payload);
  });

  test('shortcut detail returns the known record through HTTP', async ({ request }) => {
    const response = await request.get('/api/shortcuts/3');

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      id: 3,
      shortcut: '/ACPStorefrontLuxury',
      mainDomain: 'الواجهات التجارية',
    });
    expectPublicPayload(payload);
  });

  test('shortcut detail rejects missing and malformed identifiers', async ({ request }) => {
    for (const id of ['0', '99999', '3abc']) {
      const response = await request.get(`/api/shortcuts/${id}`);
      expect(response.status(), `expected ${id} to be rejected`).toBe(404);
      expect(await response.json()).toEqual({ error: 'not_found' });
    }
  });
});
