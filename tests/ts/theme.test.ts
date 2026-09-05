import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const modulePath = path.join(process.cwd(), 'src/lib/theme.ts');

async function loadThemeModule() {
  assert.ok(existsSync(modulePath), 'src/lib/theme.ts must exist');
  return import(pathToFileURL(modulePath).href);
}

test('theme helpers parse, resolve and toggle deterministically', async () => {
  const theme = await loadThemeModule();

  assert.equal(theme.THEME_STORAGE_KEY, 'iyaaz:theme');
  assert.equal(theme.parseTheme('light'), 'light');
  assert.equal(theme.parseTheme('dark'), 'dark');
  assert.equal(theme.parseTheme('anything'), null);
  assert.equal(theme.parseTheme(undefined), null);
  assert.equal(theme.resolveTheme('dark', false), 'dark');
  assert.equal(theme.resolveTheme(null, true), 'dark');
  assert.equal(theme.resolveTheme(null, false), 'light');
  assert.equal(theme.nextTheme('light'), 'dark');
  assert.equal(theme.nextTheme('dark'), 'light');
});

test('pre-hydration theme script prefers saved value then system preference', async () => {
  const theme = await loadThemeModule();

  function execute(stored: string | null, prefersDark: boolean, storageThrows = false) {
    const context = {
      localStorage: {
        getItem() {
          if (storageThrows) throw new Error('storage blocked');
          return stored;
        },
      },
      matchMedia() {
        return { matches: prefersDark };
      },
      document: {
        documentElement: {
          dataset: {} as Record<string, string>,
        },
      },
    };

    vm.runInNewContext(theme.THEME_BOOTSTRAP_SCRIPT, context);
    return context.document.documentElement.dataset.theme;
  }

  assert.equal(execute('light', true), 'light');
  assert.equal(execute('dark', false), 'dark');
  assert.equal(execute('invalid', true), 'dark');
  assert.equal(execute(null, false), 'light');
  assert.equal(execute(null, true, true), 'light');
});
