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
    notFound: 'الاختصار غير موجود',
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
    notFound: 'Shortcut not found',
  },
} as const;

const DETAIL_FIELDS = [
  'functionText',
  'requiredInputs',
  'executionInstructions',
  'outputs',
  'sizeRatio',
  'materialsTech',
  'lighting',
  'installationExecution',
  'visualStyle',
  'brandCompliance',
  'combinedShortcuts',
  'bestUse',
  'keywords',
  'assetType',
  'notes',
] as const;

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

  test(`${locale} shortcut detail renders record 3, grouped non-empty public fields and taxonomy back-links`, async ({ page, request }) => {
    const apiResponse = await request.get('/api/shortcuts/3');
    expect(apiResponse.status()).toBe(200);
    const record = await apiResponse.json() as Record<string, unknown> & {
      id: number;
      shortcut: string;
      mainDomain: string;
      category: string;
      subcategory: string;
    };

    const response = await page.goto(`/${locale}/library/3`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('[data-shortcut-detail="3"]')).toBeVisible();
    await expect(page.getByText('/ACPStorefrontLuxury', { exact: true })).toBeVisible();
    await expect(page.locator('[data-detail-section]')).toHaveCount(3);

    const expectedFields = DETAIL_FIELDS.filter((field) => {
      const value = record[field];
      return typeof value === 'string' && value.trim().length > 0;
    }).sort();
    const renderedFields = (await page.locator('[data-detail-field]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-detail-field')).filter(Boolean),
    )).sort();
    expect(renderedFields).toEqual(expectedFields);

    const domainHref = await page.locator('[data-taxonomy-link="domain"]').getAttribute('href');
    const categoryHref = await page.locator('[data-taxonomy-link="category"]').getAttribute('href');
    const subcategoryHref = await page.locator('[data-taxonomy-link="subcategory"]').getAttribute('href');
    expect(new URL(domainHref!, 'https://iyaaz.test').searchParams.get('domain')).toBe(record.mainDomain);
    expect(new URL(categoryHref!, 'https://iyaaz.test').searchParams.get('category')).toBe(record.category);
    expect(new URL(subcategoryHref!, 'https://iyaaz.test').searchParams.get('subcategory')).toBe(record.subcategory);

    const detailText = await page.locator('[data-shortcut-detail="3"]').innerText();
    expect(detailText).not.toMatch(/https?:\/\//i);
    expect(detailText).not.toMatch(/www\./i);
  });

  test(`${locale} missing shortcut detail returns a localized 404`, async ({ page }) => {
    const response = await page.goto(`/${locale}/library/99999`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: copy[locale].notFound })).toBeVisible();
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

test('shortcut detail uses a desktop rail and stacks safely on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/en/library/3');
  const desktopMain = await page.locator('[data-detail-main]').boundingBox();
  const desktopRail = await page.locator('[data-detail-rail]').boundingBox();
  expect(desktopMain).not.toBeNull();
  expect(desktopRail).not.toBeNull();
  expect(Math.abs((desktopMain?.y ?? 0) - (desktopRail?.y ?? 0))).toBeLessThan(24);
  expect((desktopMain?.width ?? 0)).toBeGreaterThan(desktopRail?.width ?? 0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const mobileMain = await page.locator('[data-detail-main]').boundingBox();
  const mobileRail = await page.locator('[data-detail-rail]').boundingBox();
  expect(mobileMain).not.toBeNull();
  expect(mobileRail).not.toBeNull();
  expect((mobileRail?.y ?? 0)).toBeGreaterThan((mobileMain?.y ?? 0) + (mobileMain?.height ?? 0) - 2);
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});
