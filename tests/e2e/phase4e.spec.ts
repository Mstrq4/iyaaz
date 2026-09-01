import { expect, test, type Page } from '@playwright/test';

const locales = ['ar', 'en'] as const;
const themes = ['light', 'dark'] as const;
const targetWidths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920] as const;

const shellCopy = {
  ar: {
    direction: 'rtl',
    navigation: 'التنقل الرئيسي',
    theme: 'تبديل المظهر',
  },
  en: {
    direction: 'ltr',
    navigation: 'Primary navigation',
    theme: 'Toggle theme',
  },
} as const;

async function seedTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript(({ value }) => {
    window.localStorage.setItem('iyaaz:theme', value);
  }, { value: theme });
}

function viewportHeight(width: number) {
  return width <= 430 ? 844 : width <= 768 ? 1024 : 900;
}

test.describe('Phase 4E responsive bidi theme matrix', () => {
  for (const locale of locales) {
    for (const theme of themes) {
      for (const width of targetWidths) {
        test(`${locale} ${theme} shell is safe at ${width}px`, async ({ page }) => {
          await page.setViewportSize({ width, height: viewportHeight(width) });
          await seedTheme(page, theme);
          await page.goto(`/${locale}`);

          const root = page.locator('html');
          await expect(root).toHaveAttribute('lang', locale);
          await expect(root).toHaveAttribute('dir', shellCopy[locale].direction);
          await expect(root).toHaveAttribute('data-theme', theme);
          await expect(page.getByRole('banner')).toBeVisible();
          await expect(page.getByRole('navigation', { name: shellCopy[locale].navigation })).toBeVisible();
          await expect(page.getByRole('main')).toBeVisible();
          await expect(page.getByRole('contentinfo')).toBeVisible();

          const metrics = await page.evaluate(() => {
            const rootStyle = getComputedStyle(document.documentElement);
            const bodyStyle = getComputedStyle(document.body);
            return {
              clientWidth: document.documentElement.clientWidth,
              scrollWidth: document.documentElement.scrollWidth,
              bodyFontSize: Number.parseFloat(bodyStyle.fontSize),
              direction: bodyStyle.direction,
              colorScheme: rootStyle.colorScheme,
              backgroundImage: bodyStyle.backgroundImage,
            };
          });

          expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
          expect(metrics.bodyFontSize).toBeGreaterThanOrEqual(16);
          expect(metrics.direction).toBe(shellCopy[locale].direction);
          expect(metrics.colorScheme).toContain(theme);
          expect(metrics.backgroundImage).toBe('none');

          const targets = page.locator('.app-header a, .app-header button');
          const targetCount = await targets.count();
          expect(targetCount).toBeGreaterThan(0);
          for (let index = 0; index < targetCount; index += 1) {
            const box = await targets.nth(index).boundingBox();
            expect(box, `header target ${index} should be rendered`).not.toBeNull();
            expect(box!.height, `header target ${index} should be at least 44px tall`).toBeGreaterThanOrEqual(44);
          }
        });
      }
    }
  }
});

test.describe('Phase 4E browser accessibility and runtime contracts', () => {
  test('keyboard skip link is the first tab stop and transfers focus to main content', async ({ page }) => {
    await page.goto('/ar');

    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();

    const outlineWidth = await skipLink.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth));
    expect(outlineWidth).toBeGreaterThanOrEqual(3);
    await expect.poll(async () => skipLink.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  for (const colorScheme of themes) {
    test(`system ${colorScheme} preference resolves before content when storage is empty`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.addInitScript(() => window.localStorage.removeItem('iyaaz:theme'));
      await page.goto('/en');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    });
  }

  test('saved theme takes precedence over the opposite system preference and survives reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/en');
    await page.evaluate(() => window.localStorage.setItem('iyaaz:theme', 'light'));
    await page.reload();

    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: shellCopy.en.theme }).click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('iyaaz:theme'))).toBe('dark');
    await page.reload();
    await expect(root).toHaveAttribute('data-theme', 'dark');
  });

  test('invalid saved theme falls back to the system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => window.localStorage.setItem('iyaaz:theme', 'violet'));
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('reduced motion collapses shared motion tokens', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');

    const motion = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        fast: style.getPropertyValue('--motion-fast').trim(),
        standard: style.getPropertyValue('--motion-standard').trim(),
        slow: style.getPropertyValue('--motion-slow').trim(),
        distance: style.getPropertyValue('--motion-distance').trim(),
      };
    });

    expect(Number.parseFloat(motion.fast)).toBe(0);
    expect(Number.parseFloat(motion.standard)).toBe(0);
    expect(Number.parseFloat(motion.slow)).toBe(0);
    expect(Number.parseFloat(motion.distance)).toBe(0);
  });

  test('canonical IYAAZ SVG mark loads as a real rendered image in both directions', async ({ page }) => {
    for (const locale of locales) {
      await page.goto(`/${locale}`);
      const mark = page.locator('.app-brand__mark');
      await expect(mark).toBeVisible();
      const state = await mark.evaluate((element) => {
        if (!(element instanceof HTMLImageElement)) return { complete: false, naturalWidth: 0, src: '' };
        return { complete: element.complete, naturalWidth: element.naturalWidth, src: element.currentSrc };
      });
      expect(state.complete).toBe(true);
      expect(state.naturalWidth).toBeGreaterThan(0);
      expect(state.src).toContain('/brand/mark-gradient.svg');
    }
  });
});
