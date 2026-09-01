import { expect, test } from '@playwright/test';

const shellCopy = {
  ar: {
    navigation: 'التنقل الرئيسي',
    theme: 'تبديل المظهر',
    language: 'English',
  },
  en: {
    navigation: 'Primary navigation',
    theme: 'Toggle theme',
    language: 'العربية',
  },
} as const;

for (const locale of ['ar', 'en'] as const) {
  test(`${locale} AppShell exposes the canonical identity and semantic landmarks`, async ({ page }) => {
    await page.goto(`/${locale}`);

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'IYAAZ — إيعاز' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: shellCopy[locale].navigation })).toBeVisible();
    await expect(page.getByRole('main')).toHaveAttribute('id', 'main-content');
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

test('theme toggle is visible in the shell and persists the selected theme', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('iyaaz:theme', 'light'));
  await page.goto('/ar');

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'light');

  const toggle = page.getByRole('button', { name: shellCopy.ar.theme });
  await expect(toggle).toBeVisible();
  await toggle.click();

  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('iyaaz:theme'))).toBe('dark');
});

test('language switcher moves between Arabic and English shells', async ({ page }) => {
  await page.goto('/ar');

  await page.getByRole('link', { name: shellCopy.ar.language }).click();

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('button', { name: shellCopy.en.theme })).toBeVisible();
});

test('shell canvas avoids a decorative page-level image or radial gradient', async ({ page }) => {
  await page.goto('/ar');
  const backgroundImage = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  expect(backgroundImage).toBe('none');
});

test('mobile shell does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/ar');
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
