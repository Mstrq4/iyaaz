import { expect, test } from '@playwright/test';

import { signAccessCredential } from '../../src/lib/access/credential.ts';

const MODE = process.env.IYAAZ_ACCESS_MODE ?? 'public';
const SECRET = process.env.IYAAZ_ACCESS_SECRET ?? 'iyaaz-phase7-browser-test-secret-0001';

function privateCredential(nowSeconds: number, expiresIn = 3600): string {
  return signAccessCredential({
    v: 1,
    kind: 'private',
    iat: nowSeconds,
    exp: nowSeconds + expiresIn,
    scope: 'app',
  }, SECRET);
}

function shareCredential(nowSeconds: number, recordId = 3, expiresIn = 3600): string {
  return signAccessCredential({
    v: 1,
    kind: 'share',
    iat: nowSeconds,
    exp: nowSeconds + expiresIn,
    scope: 'shortcut',
    recordId,
  }, SECRET);
}

async function exchangeCredential(
  page: import('@playwright/test').Page,
  locale: 'ar' | 'en',
  credential: string,
  expectedPath: string,
) {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await page.goto(`/${locale}/access?exchange=${nonce}#credential=${encodeURIComponent(credential)}`);
  await page.waitForURL((url) => url.pathname === expectedPath && !url.hash);
}

if (MODE === 'private') {
  test('private mode denies protected pages and APIs before exchange, then unlocks the app with a valid private credential', async ({ page }) => {
    await page.goto('/en/library');
    await expect(page).toHaveURL(/\/en\/access$/);

    const deniedApi = await page.evaluate(async () => (await fetch('/api/search?q=ACPStorefrontLuxury')).status);
    expect(deniedApi).toBe(401);

    await exchangeCredential(page, 'en', privateCredential(Math.floor(Date.now() / 1000)), '/en');
    await page.goto('/en/library');
    await expect(page.getByRole('heading', { level: 1, name: 'Shortcut Library' })).toBeVisible();

    const allowedApi = await page.evaluate(async () => (await fetch('/api/search?q=ACPStorefrontLuxury')).status);
    expect(allowedApi).toBe(200);
  });

  test('private mode rejects tampered or expired cookies and returns to the access surface', async ({ page, context }) => {
    const now = Math.floor(Date.now() / 1000);
    const valid = privateCredential(now);
    await exchangeCredential(page, 'en', valid, '/en');

    await context.addCookies([{
      name: 'iyaaz_access_v1',
      value: `${valid.slice(0, -1)}x`,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }]);
    await page.goto('/en/docs');
    await expect(page).toHaveURL(/\/en\/access$/);

    const expired = privateCredential(now - 120, 30);
    await context.addCookies([{
      name: 'iyaaz_access_v1',
      value: expired,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }]);
    await page.goto('/en/statistics');
    await expect(page).toHaveURL(/\/en\/access$/);
  });
}

if (MODE === 'shared') {
  test('shared mode unlocks only the exact shortcut and renders it read-only', async ({ page }) => {
    const credential = shareCredential(Math.floor(Date.now() / 1000), 3);
    await exchangeCredential(page, 'en', credential, '/en/library/3');

    await expect(page.getByText('/ACPStorefrontLuxury', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Favorite' })).toHaveCount(0);
    await expect(page.locator('[data-prompt-builder]')).toHaveCount(0);
    await expect(page.locator('[data-taxonomy-link]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Library', exact: true })).toHaveCount(0);

    const exactApi = await page.evaluate(async () => (await fetch('/api/shortcuts/3')).status);
    expect(exactApi).toBe(200);
  });

  test('shared mode returns non-revealing 404s for wrong records, inventory pages and enumeration APIs', async ({ page }) => {
    const credential = shareCredential(Math.floor(Date.now() / 1000), 3);
    await exchangeCredential(page, 'en', credential, '/en/library/3');

    for (const path of [
      '/en/library/4',
      '/en/library',
      '/en/docs',
      '/en/statistics',
      '/en/favorites',
      '/en/history',
      '/en/clients',
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }

    await page.goto('/en/library/3');
    const statuses = await page.evaluate(async () => {
      const urls = ['/api/search?q=x', '/api/taxonomy', '/api/shortcuts?ids=3', '/api/shortcuts/4'];
      return Promise.all(urls.map(async (url) => [url, (await fetch(url)).status] as const));
    });
    expect(Object.fromEntries(statuses)).toEqual({
      '/api/search?q=x': 404,
      '/api/taxonomy': 404,
      '/api/shortcuts?ids=3': 404,
      '/api/shortcuts/4': 404,
    });
  });
}
