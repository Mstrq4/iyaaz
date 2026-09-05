import { expect, test } from '@playwright/test';

import { signAccessCredential } from '../../src/lib/access/credential.ts';

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

for (const item of [
  { locale: 'ar', failure: 'الرابط غير صالح أو منتهي الصلاحية' },
  { locale: 'en', failure: 'This access link is invalid or expired' },
] as const) {
  test(`${item.locale} private credential exchanges from the fragment into an HttpOnly cookie and removes the token from the URL`, async ({ page, context }) => {
    const now = Math.floor(Date.now() / 1000);
    const credential = privateCredential(now);
    const mutationRequests: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET' && request.method() !== 'HEAD') mutationRequests.push(`${request.method()} ${request.url()}`);
    });

    await page.goto(`/${item.locale}/access#credential=${encodeURIComponent(credential)}`);
    await page.waitForURL((url) => url.pathname === `/${item.locale}` && !url.hash);

    expect(page.url()).not.toContain(credential);
    expect(mutationRequests).toContain('POST http://127.0.0.1:3000/api/access/exchange');
    const cookies = await context.cookies();
    const cookie = cookies.find((entry) => entry.name === 'iyaaz_access_v1');
    expect(cookie).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Lax');
    expect(await page.evaluate(() => document.cookie)).not.toContain('iyaaz_access_v1');
  });

  test(`${item.locale} invalid credential is removed from the fragment and never rendered`, async ({ page }) => {
    const credential = 'invalid.secret.material';
    await page.goto(`/${item.locale}/access#credential=${credential}`);

    await expect(page.getByText(item.failure)).toBeVisible();
    await expect.poll(() => new URL(page.url()).hash).toBe('');
    expect(await page.content()).not.toContain(credential);
  });
}

test('share credential redirects only to its verified localized shortcut target', async ({ page, context }) => {
  const now = Math.floor(Date.now() / 1000);
  const credential = shareCredential(now, 3);

  await page.goto(`/en/access#credential=${encodeURIComponent(credential)}`);
  await page.waitForURL((url) => url.pathname === '/en/library/3' && !url.hash);

  const cookies = await context.cookies();
  expect(cookies.some((entry) => entry.name === 'iyaaz_access_v1' && entry.httpOnly)).toBe(true);
  expect(page.url()).not.toContain(credential);
});

test('expired credential fails generically, clears the fragment and does not set the access cookie', async ({ page, context }) => {
  const now = Math.floor(Date.now() / 1000);
  const expired = privateCredential(now - 120, 30);

  await page.goto(`/en/access#credential=${encodeURIComponent(expired)}`);
  await expect(page.getByText('This access link is invalid or expired')).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toBe('');

  const cookies = await context.cookies();
  expect(cookies.some((entry) => entry.name === 'iyaaz_access_v1')).toBe(false);
});
