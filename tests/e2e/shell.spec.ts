import { expect, test } from '@playwright/test';

const shellCopy = {
  ar: {
    navigation: 'التنقل الرئيسي',
    theme: 'تبديل المظهر',
    language: 'English',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    destinations: [
      ['الرئيسية', '/ar'],
      ['المكتبة', '/ar/library'],
      ['المفضلة', '/ar/favorites'],
      ['السجل', '/ar/history'],
      ['العملاء', '/ar/clients'],
      ['التوثيق', '/ar/docs'],
      ['الإحصائيات', '/ar/statistics'],
    ],
  },
  en: {
    navigation: 'Primary navigation',
    theme: 'Toggle theme',
    language: 'العربية',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    destinations: [
      ['Home', '/en'],
      ['Library', '/en/library'],
      ['Favorites', '/en/favorites'],
      ['History', '/en/history'],
      ['Clients', '/en/clients'],
      ['Docs', '/en/docs'],
      ['Statistics', '/en/statistics'],
    ],
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

  test(`${locale} desktop navigation exposes all seven product destinations with current-page semantics`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}`);

    const navigation = page.getByRole('navigation', { name: shellCopy[locale].navigation });
    for (const [label, href] of shellCopy[locale].destinations) {
      const link = navigation.getByRole('link', { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
    }
    await expect(navigation.getByRole('link', { name: shellCopy[locale].destinations[0][0], exact: true })).toHaveAttribute('aria-current', 'page');

    await page.goto(`/${locale}/library/3`);
    await expect(page.getByRole('navigation', { name: shellCopy[locale].navigation }).getByRole('link', { name: shellCopy[locale].destinations[1][0], exact: true })).toHaveAttribute('aria-current', 'page');
  });
}

test('mobile navigation opens by keyboard, closes on route selection and stays safe at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/en');

  const openButton = page.getByRole('button', { name: shellCopy.en.openMenu });
  await expect(openButton).toBeVisible();
  await expect(openButton).toHaveAttribute('aria-expanded', 'false');
  await openButton.focus();
  await page.keyboard.press('Enter');

  const closeButton = page.getByRole('button', { name: shellCopy.en.closeMenu });
  await expect(closeButton).toHaveAttribute('aria-expanded', 'true');
  const docsLink = page.getByRole('navigation', { name: shellCopy.en.navigation }).getByRole('link', { name: 'Docs', exact: true });
  await expect(docsLink).toBeVisible();
  await docsLink.click();

  await expect(page).toHaveURL(/\/en\/docs$/);
  await expect(page.getByRole('button', { name: shellCopy.en.openMenu })).toHaveAttribute('aria-expanded', 'false');
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});

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
