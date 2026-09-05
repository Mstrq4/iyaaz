import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'http://127.0.0.1:3000';

async function expectCanonical(page: Page, path: string) {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${ORIGIN}${path}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${ORIGIN}${path}`);
}

async function expectRobots(page: Page, expected: RegExp) {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', expected);
}

async function expectAlternate(page: Page, locale: 'ar' | 'en', path: string) {
  await expect(page.locator(`link[rel="alternate"][hreflang="${locale}"]`)).toHaveAttribute('href', `${ORIGIN}${path}`);
}

async function expectUsefulDescription(page: Page) {
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description?.trim().length ?? 0).toBeGreaterThanOrEqual(20);
}

const publicPages = [
  { locale: 'ar', route: '', title: /حوّل الاختصار إلى إيعاز جاهز/, suffix: '' },
  { locale: 'en', route: '', title: /Turn a shortcut into a copy-ready prompt/i, suffix: '' },
  { locale: 'ar', route: '/library', title: /مكتبة الاختصارات/, suffix: '/library' },
  { locale: 'en', route: '/library', title: /Shortcut Library/i, suffix: '/library' },
  { locale: 'ar', route: '/docs', title: /توثيق إيعاز/, suffix: '/docs' },
  { locale: 'en', route: '/docs', title: /IYAAZ documentation/i, suffix: '/docs' },
  { locale: 'ar', route: '/statistics', title: /إحصاءات المكتبة/, suffix: '/statistics' },
  { locale: 'en', route: '/statistics', title: /Library statistics/i, suffix: '/statistics' },
] as const;

for (const item of publicPages) {
  test(`${item.locale}${item.route || '/'} has localized self-canonical metadata and bilingual alternates`, async ({ page }) => {
    const path = `/${item.locale}${item.route}`;
    await page.goto(path);

    await expect(page).toHaveTitle(item.title);
    await expectUsefulDescription(page);
    await expectCanonical(page, path);
    await expectRobots(page, /index.*follow/i);
    await expectAlternate(page, 'ar', `/ar${item.suffix}`);
    await expectAlternate(page, 'en', `/en${item.suffix}`);
  });
}

test('library query state is noindex/follow and canonicalizes every discovery URL to the clean collection', async ({ page }) => {
  await page.goto('/en/library?q=logo&sort=name&page=2');

  await expectCanonical(page, '/en/library');
  await expectRobots(page, /noindex.*follow/i);
  await expectAlternate(page, 'ar', '/ar/library');
  await expectAlternate(page, 'en', '/en/library');

  const head = await page.locator('head').innerHTML();
  expect(head).not.toContain('?q=');
  expect(head).not.toContain('sort=name');
});

test('Arabic shortcut fallback remains the canonical indexable source without advertising a false English alternate', async ({ page }) => {
  await page.goto('/ar/library/3');

  await expectCanonical(page, '/ar/library/3');
  await expectRobots(page, /index.*follow/i);
  await expectAlternate(page, 'ar', '/ar/library/3');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
});

test('English shortcut using canonical Arabic fallback is noindex/follow and canonicalizes to Arabic', async ({ page }) => {
  await page.goto('/en/library/3');

  await expectCanonical(page, '/ar/library/3');
  await expectRobots(page, /noindex.*follow/i);
  await expectAlternate(page, 'ar', '/ar/library/3');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
});

for (const path of ['/ar/favorites', '/en/history', '/ar/clients', '/en/access']) {
  test(`${path} is always excluded from public indexing`, async ({ page }) => {
    await page.goto(path);
    await expectRobots(page, /noindex.*nofollow/i);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  });
}
