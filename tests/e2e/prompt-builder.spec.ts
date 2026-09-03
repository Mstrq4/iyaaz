import { expect, test, type Locator } from '@playwright/test';

async function fillRequiredPromptControls(builder: Locator) {
  const controls = builder.locator('[data-prompt-control]');
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    const tagName = await control.evaluate((node: Element) => node.tagName.toLowerCase());
    if (tagName === 'select') {
      const options = await control.locator('option').count();
      expect(options).toBeGreaterThan(1);
      await control.selectOption({ index: 1 });
    } else {
      await control.fill(`Sample value ${index + 1}`);
    }
  }
}

test('Arabic detail generates a deterministic prompt in an independently selected language with validation, notes and copy feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/ar/library/3');

  const builder = page.locator('[data-prompt-builder]');
  await expect(builder).toBeVisible();
  await expect(builder.locator('[data-prompt-field]')).not.toHaveCount(0);
  await expect(builder.locator('input[type="file"]')).toHaveCount(0);

  const generate = builder.getByRole('button', { name: 'إنشاء النص الكامل' });
  await generate.click();
  await expect(builder.getByRole('alert')).toContainText('أكمل الحقول المطلوبة');

  await fillRequiredPromptControls(builder);
  await builder.getByLabel('ملاحظات إضافية').fill('حافظ على وضوح اللافتة من الشارع.');
  await builder.getByLabel('لغة المخرجات').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  const nonGetRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') nonGetRequests.push(request.url());
  });

  await fillRequiredPromptControls(builder);
  await builder.getByLabel('ملاحظات إضافية').fill('Keep the storefront legible from the street.');
  await generate.click();

  const output = builder.locator('[data-prompt-output]');
  await expect(output).toBeVisible();
  const firstOutput = await output.inputValue();
  expect(firstOutput).toContain('/ACPStorefrontLuxury');
  expect(firstOutput).toContain('Output language: English');
  expect(firstOutput).toContain('Additional notes:');
  expect(firstOutput).toContain('Final quality instruction:');
  expect(firstOutput).not.toMatch(/https?:\/\//i);
  expect(firstOutput).not.toMatch(/www\./i);
  expect(nonGetRequests).toEqual([]);

  await generate.click();
  expect(await output.inputValue()).toBe(firstOutput);

  const copy = builder.getByRole('button', { name: 'نسخ النص' });
  await copy.click();
  await expect(builder.getByRole('button', { name: 'تم النسخ' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(firstOutput);
  await expect(builder.getByRole('button', { name: 'نسخ النص' })).toBeVisible({ timeout: 1800 });
});

test('prompt drafts persist in sessionStorage per record and selected output language', async ({ page }) => {
  await page.goto('/ar/library/3');
  const builder = page.locator('[data-prompt-builder]');
  const language = builder.getByLabel('لغة المخرجات');
  const firstControl = builder.locator('[data-prompt-control]').first();
  const notes = builder.getByLabel('ملاحظات إضافية');

  await expect(language).toHaveValue('ar');
  await firstControl.fill('مسودة عربية');
  await notes.fill('ملاحظة عربية');
  await page.reload();
  await expect(builder.locator('[data-prompt-control]').first()).toHaveValue('مسودة عربية');
  await expect(builder.getByLabel('ملاحظات إضافية')).toHaveValue('ملاحظة عربية');

  await language.selectOption('en');
  await expect(builder.locator('[data-prompt-control]').first()).toHaveValue('');
  await builder.locator('[data-prompt-control]').first().fill('English draft');
  await builder.getByLabel('ملاحظات إضافية').fill('English note');
  await page.reload();
  await expect(builder.getByLabel('لغة المخرجات')).toHaveValue('ar');
  await builder.getByLabel('لغة المخرجات').selectOption('en');
  await expect(builder.locator('[data-prompt-control]').first()).toHaveValue('English draft');
  await expect(builder.getByLabel('ملاحظات إضافية')).toHaveValue('English note');

  await builder.getByLabel('لغة المخرجات').selectOption('ar');
  await expect(builder.locator('[data-prompt-control]').first()).toHaveValue('مسودة عربية');
  await expect(builder.getByLabel('ملاحظات إضافية')).toHaveValue('ملاحظة عربية');

  const keys = await page.evaluate(() => Object.keys(sessionStorage).sort());
  expect(keys).toContain('iyaaz:prompt-draft:3:ar');
  expect(keys).toContain('iyaaz:prompt-draft:3:en');
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

test('canonical record 3 renders two attachment reminders and never an upload control', async ({ page }) => {
  await page.goto('/ar/library/3');
  const builder = page.locator('[data-prompt-builder]');
  await expect(builder.locator('[data-asset-reminder]')).toHaveCount(2);
  await expect(builder.locator('input[type="file"]')).toHaveCount(0);
});

test('Prompt Builder selects a local client profile, restores it per language draft and emits deterministic client context', async ({ page }) => {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify([{
      id: 'prime-mobile',
      name: 'Prime Mobile',
      businessDescription: 'Smartphones and accessories retailer',
      brandColors: '#000000, #D3B316',
      tone: 'Premium and clear',
      constraints: 'No decorative clutter',
      notes: '',
      createdAt: '2026-09-03T00:00:00.000Z',
      updatedAt: '2026-09-03T00:00:00.000Z',
    }]));
  }, { key: 'iyaaz:clients:v1' });

  const nonGetRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto('/en/library/3');
  const builder = page.locator('[data-prompt-builder]');
  const profile = builder.getByLabel('Client profile');
  await expect(profile).toHaveValue('');
  await profile.selectOption('prime-mobile');
  await fillRequiredPromptControls(builder);
  await builder.getByRole('button', { name: 'Generate full prompt' }).click();

  const output = builder.locator('[data-prompt-output]');
  await expect(output).toContainText('Client context:');
  await expect(output).toContainText('Client: Prime Mobile');
  await expect(output).toContainText('Tone: Premium and clear');
  await expect(output).not.toContainText('Brand colors: #000000, #D3B316');
  await expect(output).toContainText('ألوان الهوية: Sample value 5');
  expect(nonGetRequests).toEqual([]);

  await page.reload();
  await expect(builder.getByLabel('Client profile')).toHaveValue('prime-mobile');
  const draft = await page.evaluate(() => sessionStorage.getItem('iyaaz:prompt-draft:3:en'));
  expect(draft).toContain('"clientId":"prime-mobile"');

  await builder.getByLabel('Output language').selectOption('ar');
  await expect(builder.getByLabel('Client profile')).toHaveValue('');
  await builder.getByLabel('Client profile').selectOption('prime-mobile');
  await fillRequiredPromptControls(builder);
  await builder.getByRole('button', { name: 'Generate full prompt' }).click();
  await expect(builder.locator('[data-prompt-output]')).toContainText('سياق العميل:');
  await expect(builder.locator('[data-prompt-output]')).toContainText('العميل: Prime Mobile');
});
