import { expect, test } from '@playwright/test';

const locales = [
  {
    locale: 'ar',
    dir: 'rtl',
    landingHeading: 'حوّل الاختصار إلى إيعاز جاهز',
    libraryCta: 'استكشف المكتبة',
    docsCta: 'اقرأ التوثيق',
    docsHeading: 'توثيق إيعاز',
    statisticsHeading: 'إحصاءات المكتبة',
  },
  {
    locale: 'en',
    dir: 'ltr',
    landingHeading: 'Turn a shortcut into a copy-ready prompt',
    libraryCta: 'Explore the library',
    docsCta: 'Read the documentation',
    docsHeading: 'IYAAZ documentation',
    statisticsHeading: 'Library statistics',
  },
] as const;

for (const item of locales) {
  test(`${item.locale} landing renders product workflow, truthful totals and primary CTAs`, async ({ page }) => {
    await page.goto(`/${item.locale}`);

    await expect(page.locator('html')).toHaveAttribute('lang', item.locale);
    await expect(page.locator('html')).toHaveAttribute('dir', item.dir);
    await expect(page.getByRole('heading', { level: 1, name: item.landingHeading })).toBeVisible();
    await expect(page.getByRole('link', { name: item.libraryCta })).toHaveAttribute('href', `/${item.locale}/library`);
    await expect(page.getByRole('link', { name: item.docsCta })).toHaveAttribute('href', `/${item.locale}/docs`);

    const main = page.locator('main');
    await expect(main).toContainText('5,812');
    await expect(main).toContainText('9');
    await expect(main).toContainText('21');
    await expect(main).toContainText('364');
    await expect(main.locator('[data-workflow-step]')).toHaveCount(4);
  });

  test(`${item.locale} documentation explains the complete local workflow`, async ({ page }) => {
    await page.goto(`/${item.locale}/docs`);

    await expect(page.locator('html')).toHaveAttribute('dir', item.dir);
    await expect(page.getByRole('heading', { level: 1, name: item.docsHeading })).toBeVisible();
    await expect(page.locator('[data-doc-section]')).toHaveCount(8);
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });

  test(`${item.locale} statistics exposes canonical totals and distributions without usage metrics`, async ({ page }) => {
    await page.goto(`/${item.locale}/statistics`);

    await expect(page.locator('html')).toHaveAttribute('dir', item.dir);
    await expect(page.getByRole('heading', { level: 1, name: item.statisticsHeading })).toBeVisible();
    const statistics = page.locator('[data-catalog-statistics]');
    await expect(statistics).toContainText('5,812');
    await expect(statistics).toContainText('5,622');
    await expect(statistics).toContainText('118');
    await expect(statistics).toContainText('72');
    await expect(statistics.locator('[data-domain-row]')).toHaveCount(9);
  });
}

test('English documentation states the current canonical-Arabic translation fallback explicitly', async ({ page }) => {
  await page.goto('/en/docs');
  const translations = page.locator('#translations');
  await expect(translations.getByRole('heading', { name: 'Current English translation fallback' })).toBeVisible();
  await expect(translations.getByText(/canonical Arabic/i)).toBeVisible();
  await expect(translations.getByText(/complete English translation/i)).toBeVisible();
});

for (const route of ['/ar', '/en', '/ar/docs', '/en/docs', '/ar/statistics', '/en/statistics']) {
  test(`${route} remains horizontally safe at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
