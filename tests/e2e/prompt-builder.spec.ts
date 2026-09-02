import { expect, test, type Locator } from '@playwright/test';

import { parseRequiredInputs } from '../../src/lib/prompt/schema';

async function fillRequiredPromptControls(builder: Locator) {
  const controls = builder.locator('[data-prompt-control]');
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    const tagName = await control.evaluate((node: Element) => node.tagName.toLowerCase());
    const type = await control.getAttribute('type');

    if (tagName === 'select') {
      const options = await control.locator('option').count();
      expect(options).toBeGreaterThan(1);
      await control.selectOption({ index: 1 });
    } else if (type === 'number') {
      await control.fill('3');
    } else {
      await control.fill(`Sample value ${index + 1}`);
    }
  }
}

test('Arabic detail embeds a deterministic dynamic prompt builder with independent output language and validation', async ({ page }) => {
  await page.goto('/ar/library/3');

  const builder = page.locator('[data-prompt-builder]');
  await expect(builder).toBeVisible();
  await expect(builder.locator('[data-prompt-field]')).not.toHaveCount(0);
  await expect(builder.locator('input[type="file"]')).toHaveCount(0);

  const generate = builder.getByRole('button', { name: 'إنشاء النص الكامل' });
  await generate.click();
  await expect(builder.getByRole('alert')).toContainText('أكمل الحقول المطلوبة');

  await fillRequiredPromptControls(builder);

  await builder.getByLabel('لغة المخرجات').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  await builder.getByLabel('النبرة والأسلوب').selectOption('professional');

  const postRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') postRequests.push(request.url());
  });

  await generate.click();
  const output = builder.locator('[data-prompt-output]');
  await expect(output).toBeVisible();
  const professionalOutput = await output.inputValue();
  expect(professionalOutput).toContain('/ACPStorefrontLuxury');
  expect(professionalOutput).toContain('Output language: English');
  expect(professionalOutput).toContain('Tone: Professional');
  expect(professionalOutput).not.toMatch(/https?:\/\//i);
  expect(professionalOutput).not.toMatch(/www\./i);
  expect(postRequests).toEqual([]);

  await generate.click();
  expect(await output.inputValue()).toBe(professionalOutput);

  await builder.getByLabel('النبرة والأسلوب').selectOption('');
  await generate.click();
  const neutralOutput = await output.inputValue();
  expect(neutralOutput).not.toBe(professionalOutput);
  expect(neutralOutput).not.toContain('Tone: Professional');
});

test('English UI exposes the same builder without changing document direction', async ({ page }) => {
  await page.goto('/en/library/3');
  const builder = page.locator('[data-prompt-builder]');
  await expect(builder.getByRole('heading', { name: 'Prompt Builder' })).toBeVisible();
  await expect(builder.getByLabel('Output language')).toHaveValue('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(builder.locator('input[type="file"]')).toHaveCount(0);
});

test('a dataset record with an asset-reference requirement renders reminders only and never an upload control', async ({ page, request }) => {
  const response = await request.get('/api/search', {
    params: { q: 'شعار', limit: '200' },
  });
  expect(response.status()).toBe(200);
  const payload = await response.json() as {
    items: Array<{ id: number; requiredInputs: string }>;
  };

  const record = payload.items.find((item) =>
    parseRequiredInputs(item.requiredInputs).fields.some((field) => field.type === 'asset-reference'),
  );
  expect(record, 'expected at least one public record with a parseable asset-reference requirement').toBeTruthy();

  await page.goto(`/ar/library/${record!.id}`);
  const builder = page.locator('[data-prompt-builder]');
  await expect(builder.locator('[data-asset-reminder]').first()).toBeVisible();
  await expect(builder.locator('input[type="file"]')).toHaveCount(0);
});
