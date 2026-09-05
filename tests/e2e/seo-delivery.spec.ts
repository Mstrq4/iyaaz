import { expect, test, type Page } from '@playwright/test';

async function jsonLd(page: Page): Promise<unknown[]> {
  const scripts = page.locator('script[type="application/ld+json"]');
  const values: unknown[] = [];
  for (let index = 0; index < await scripts.count(); index += 1) {
    values.push(JSON.parse(await scripts.nth(index).textContent() ?? 'null'));
  }
  return values;
}

function flattenTypes(values: readonly unknown[]): string[] {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return flattenTypes(value);
    if (!value || typeof value !== 'object') return [];
    const type = (value as Record<string, unknown>)['@type'];
    return typeof type === 'string' ? [type] : [];
  });
}

function sitemapLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
}

test('public robots and sitemap expose only clean public discovery surfaces', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toContain('Allow: /');
  expect(robotsText).toContain('Disallow: /ar/favorites');
  expect(robotsText).toContain('Disallow: /en/access');
  expect(robotsText).toContain('Sitemap: http://127.0.0.1:3000/sitemap.xml');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  const locations = sitemapLocations(xml);
  for (const path of ['/ar', '/en', '/ar/library', '/en/library', '/ar/docs', '/en/docs', '/ar/statistics', '/en/statistics', '/ar/library/3']) {
    expect(locations).toContain(`http://127.0.0.1:3000${path}`);
  }
  expect(locations).not.toContain('http://127.0.0.1:3000/en/library/3');
  expect(locations.every((url) => !/[?#]/.test(url))).toBe(true);
  expect(locations.join('\n')).not.toMatch(/favorites|history|clients|access|credential|token|sourceUrl|referenceUrl/i);
});

test('public home and clean library deliver canonical WebSite and CollectionPage JSON-LD', async ({ page }) => {
  await page.goto('/ar');
  const homeValues = await jsonLd(page);
  expect(flattenTypes(homeValues)).toContain('WebSite');
  expect(JSON.stringify(homeValues)).toContain('http://127.0.0.1:3000/ar');

  await page.goto('/ar/library');
  const libraryValues = await jsonLd(page);
  expect(flattenTypes(libraryValues)).toContain('CollectionPage');
  expect(JSON.stringify(libraryValues)).toContain('http://127.0.0.1:3000/ar/library');
});

test('filtered library state stays noindex-oriented and publishes no CollectionPage JSON-LD', async ({ page }) => {
  await page.goto('/ar/library?q=ACP');
  expect(await jsonLd(page)).toEqual([]);
});

test('Arabic shortcut detail delivers CreativeWork and BreadcrumbList without sensitive fields', async ({ page }) => {
  await page.goto('/ar/library/3');
  const values = await jsonLd(page);
  const types = flattenTypes(values);
  expect(types).toContain('CreativeWork');
  expect(types).toContain('BreadcrumbList');

  const serialized = JSON.stringify(values);
  expect(serialized).toContain('/ACPStorefrontLuxury');
  expect(serialized).toContain('http://127.0.0.1:3000/ar/library/3');
  expect(serialized).not.toMatch(/sourceUrl|referenceUrl|credential|token/i);
});

test('English canonical fallback does not publish duplicate shortcut JSON-LD', async ({ page }) => {
  await page.goto('/en/library/3');
  expect(await jsonLd(page)).toEqual([]);
});

test('retrieval surfaces keep one clear h1 and meaningful internal links', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /المكتبة/ }).first()).toHaveAttribute('href', '/ar/library');
  await expect(page.getByRole('link', { name: /التوثيق/ }).first()).toHaveAttribute('href', '/ar/docs');

  await page.goto('/ar/library/3');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('main a[href="/ar/library"]').first()).toBeVisible();
});
