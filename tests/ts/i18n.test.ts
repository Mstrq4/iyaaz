import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const modulePath = path.join(process.cwd(), 'src/lib/i18n.ts');

test('locale foundation exists and maps Arabic/English directions correctly', async () => {
  assert.ok(existsSync(modulePath), 'src/lib/i18n.ts must exist');
  const i18n = await import(pathToFileURL(modulePath).href);

  assert.deepEqual(i18n.SUPPORTED_LOCALES, ['ar', 'en']);
  assert.equal(i18n.isLocale('ar'), true);
  assert.equal(i18n.isLocale('en'), true);
  assert.equal(i18n.isLocale('fr'), false);
  assert.equal(i18n.directionForLocale('ar'), 'rtl');
  assert.equal(i18n.directionForLocale('en'), 'ltr');
});
