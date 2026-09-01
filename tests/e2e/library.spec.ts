import { expect, test } from '@playwright/test';

const copy = {
  ar: {
    heading: 'مكتبة الاختصارات',
    search: 'ابحث في المكتبة',
    domain: 'المجال',
    category: 'الفئة',
    subcategory: 'الفئة الفرعية',
    type: 'النوع',
    sort: 'الترتيب',
    next: 'التالي',
    copyShortcut: 'نسخ الاختصار',
    copied: 'تم النسخ',
  },
  en: {
    heading: 'Shortcut Library',
    search: 'Search the library',
    domain: 'Domain',
    category: 'Category',
    subcategory: 'Subcategory',
    type: 'Type',
    sort: 'Sort',
    next: 'Next',
    copyShortcut: 'Copy shortcut',
    copied: 'Copied',
  },
} as const;

for (const locale of ['ar', 'en'] as const) {
  test(`${locale} library route renders the data-dense explorer in the correct direction`, async ({ page }) => {
    await page.goto(`/${locale}/library`);

    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.getByRole('heading', { level: 1, name: copy[locale].heading })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: copy[locale].search })).toBeVisible();
    await expect(page.locator('[data-record-id]').first()).toBeVisible();
    await expect(page.locator('[data-record-id]')).toHaveCount(50);
  });

  test(`${locale} known shortcut search is debounced into URL state and ranks record 3 first`, async ({ page }) => {
    await page.goto(`/${locale}/library`);
    const search = page.getByRole('searchbox', { name: copy[locale].search });

    await search.fill('/ACPStorefrontLuxury');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('/ACPStorefrontLuxury');
    await expect(page.locator('[data-record-id="3"]')).toBeVisible();
    await expect(page.locator('[data-record-id]').first()).toHaveAttribute('data-record-id', '3');
  });

  test(`${locale} domain changes clear dependent category and subcategory state`, async ({ page, request }) => {
    const detailResponse = await request.get('/api/shortcuts/3');
    const record = await detailResponse.json() as {
      mainDomain: string;
      category: string;
      subcategory: string;
    };
    const taxonomyResponse = await request.get('/api/taxonomy');
    const taxonomy = await taxonomyResponse.json() as {
      domains: Array<{ name: string }>;
    };
    const otherDomain = taxonomy.domains.find((item) => item.name !== record.mainDomain)?.name;
    expect(otherDomain).toBeTruthy();

    await page.goto(`/${locale}/library`);
    const domain = page.getByLabel(copy[locale].domain, { exact: true });
    const category = page.getByLabel(copy[locale].category, { exact: true });
    const subcategory = page.getByLabel(copy[locale].subcategory, { exact: true });

    await domain.selectOption(record.mainDomain);
    await expect.poll(() => new URL(page.url()).searchParams.get('domain')).toBe(record.mainDomain);
    await category.selectOption(record.category);
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe(record.category);
    await subcategory.selectOption(record.subcategory);
    await expect.poll(() => new URL(page.url()).searchParams.get('subcategory')).toBe(record.subcategory);

    await domain.selectOption(otherDomain!);
    await expect.poll(() => new URL(page.url()).searchParams.get('domain')).toBe(otherDomain!);
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get('subcategory')).toBeNull();
    await expect(category).toHaveValue('');
    await expect(subcategory).toHaveValue('');
  });
}

test('sorting and paging stay URL-driven and request only the current 50-row page', async ({ page }) => {
  await page.goto('/ar/library');
  await expect(page.locator('[data-record-id]').first()).toHaveAttribute('data-record-id', '1');

  await page.getByLabel(copy.ar.sort, { exact: true }).selectOption('id-desc');
  await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('id-desc');
  await expect(page.locator('[data-record-id]').first()).toHaveAttribute('data-record-id', '5812');
  await expect(page.locator('[data-record-id]')).toHaveCount(50);

  await page.getByRole('link', { name: copy.ar.next }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('2');
  await expect(page.locator('[data-record-id]').first()).toHaveAttribute('data-record-id', '5762');
  await expect(page.locator('[data-record-id]')).toHaveCount(50);
});

test('row copy action swaps to a check state without layout shift and restores after about one second', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/ar/library?q=%2FACPStorefrontLuxury');

  const row = page.locator('[data-record-id="3"]');
  await expect(row).toBeVisible();
  const button = row.getByRole('button', { name: copy.ar.copyShortcut });
  const before = await button.boundingBox();
  expect(before).not.toBeNull();

  await button.click();
  await expect(row.getByRole('button', { name: copy.ar.copied })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('/ACPStorefrontLuxury');
  const during = await row.getByRole('button', { name: copy.ar.copied }).boundingBox();
  expect(during?.width).toBe(before?.width);
  expect(during?.height).toBe(before?.height);

  await expect(row.getByRole('button', { name: copy.ar.copyShortcut })).toBeVisible({ timeout: 1800 });
});

test('library explorer remains horizontally safe at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/ar/library');
  await expect(page.locator('[data-record-id]').first()).toBeVisible();

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});
