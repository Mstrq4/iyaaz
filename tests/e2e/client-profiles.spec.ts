import { expect, test } from '@playwright/test';

const CLIENTS_KEY = 'iyaaz:clients:v1';

for (const locale of ['ar', 'en'] as const) {
  const ar = locale === 'ar';

  test(`${locale} client profiles create, edit, persist and delete locally without mutation requests`, async ({ page }) => {
    const nonGetRequests: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`);
    });

    await page.goto(`/${locale}/clients`);
    await expect(page.locator('html')).toHaveAttribute('dir', ar ? 'rtl' : 'ltr');
    await expect(page.getByRole('heading', { name: ar ? 'ملفات العملاء' : 'Client profiles' })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);

    await page.getByLabel(ar ? 'اسم العميل' : 'Client name').fill(ar ? 'برايم موبايل' : 'Prime Mobile');
    await page.getByLabel(ar ? 'نبذة النشاط' : 'Business description').fill(ar ? 'هواتف ذكية ومستلزماتها' : 'Smartphones and accessories');
    await page.getByLabel(ar ? 'ألوان الهوية' : 'Brand colors').fill('#000000, #D3B316');
    await page.getByLabel(ar ? 'النبرة' : 'Tone').fill(ar ? 'فاخر وواضح' : 'Premium and clear');
    await page.getByLabel(ar ? 'القيود' : 'Constraints').fill(ar ? 'بدون زخرفة زائدة' : 'No decorative clutter');
    await page.getByRole('button', { name: ar ? 'حفظ الملف' : 'Save profile' }).click();

    const stored = await page.evaluate((key) => localStorage.getItem(key), CLIENTS_KEY);
    expect(stored).toContain(ar ? 'برايم موبايل' : 'Prime Mobile');
    await page.reload();
    await expect(page.getByText(ar ? 'برايم موبايل' : 'Prime Mobile', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: ar ? /تعديل/ : /Edit/ }).first().click();
    await page.getByLabel(ar ? 'النبرة' : 'Tone').fill(ar ? 'تقني وفاخر' : 'Technical and premium');
    await page.getByRole('button', { name: ar ? 'حفظ التعديلات' : 'Save changes' }).click();
    await page.reload();
    expect(await page.evaluate((key) => localStorage.getItem(key), CLIENTS_KEY)).toContain(ar ? 'تقني وفاخر' : 'Technical and premium');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: ar ? /حذف/ : /Delete/ }).first().click();
    await expect(page.getByText(ar ? 'برايم موبايل' : 'Prime Mobile', { exact: true })).toHaveCount(0);
    expect(nonGetRequests).toEqual([]);
  });
}
