import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const modulePath = path.join(process.cwd(), 'src/lib/theme.ts');

test('theme helper toggles light and dark deterministically', async () => {
  assert.ok(existsSync(modulePath), 'src/lib/theme.ts must exist');
  const theme = await import(pathToFileURL(modulePath).href);
  assert.equal(theme.nextTheme('light'), 'dark');
  assert.equal(theme.nextTheme('dark'), 'light');
  assert.equal(theme.normalizeTheme('anything'), 'light');
});
