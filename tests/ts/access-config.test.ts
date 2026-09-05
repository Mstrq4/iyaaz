import assert from 'node:assert/strict';
import test from 'node:test';

import { readAccessConfig } from '../../src/lib/access/config.ts';

const VALID_SITE = 'https://iyaaz.example';
const VALID_SECRET = '0123456789abcdef0123456789abcdef';

function env(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    NEXT_PUBLIC_SITE_URL: VALID_SITE,
    ...overrides,
  };
}

test('missing or blank access mode defaults to public with no secret', () => {
  const missing = readAccessConfig(env());
  const blank = readAccessConfig(env({ IYAAZ_ACCESS_MODE: '   ' }));

  assert.equal(missing.mode, 'public');
  assert.equal(blank.mode, 'public');
  assert.equal(missing.secret, null);
  assert.equal(blank.secret, null);
  assert.equal(missing.siteUrl.href, `${VALID_SITE}/`);
});

test('unknown non-empty access mode fails closed', () => {
  assert.throws(
    () => readAccessConfig(env({ IYAAZ_ACCESS_MODE: 'preview' })),
    /IYAAZ_ACCESS_MODE/i,
  );
});

test('private and shared modes reject missing or short secrets', () => {
  for (const mode of ['private', 'shared'] as const) {
    assert.throws(
      () => readAccessConfig(env({ IYAAZ_ACCESS_MODE: mode })),
      /IYAAZ_ACCESS_SECRET/i,
    );
    assert.throws(
      () => readAccessConfig(env({ IYAAZ_ACCESS_MODE: mode, IYAAZ_ACCESS_SECRET: 'too-short' })),
      /IYAAZ_ACCESS_SECRET/i,
    );
  }
});

test('protected modes accept a trimmed 32+ character server secret', () => {
  for (const mode of ['private', 'shared'] as const) {
    const config = readAccessConfig(env({
      IYAAZ_ACCESS_MODE: mode,
      IYAAZ_ACCESS_SECRET: `  ${VALID_SECRET}  `,
    }));

    assert.equal(config.mode, mode);
    assert.equal(config.secret, VALID_SECRET);
    assert.equal(config.siteUrl.origin, VALID_SITE);
  }
});

test('site URL must be an absolute http or https origin', () => {
  for (const value of ['', '/relative', 'ftp://iyaaz.example', 'not a url']) {
    assert.throws(
      () => readAccessConfig(env({ NEXT_PUBLIC_SITE_URL: value })),
      /NEXT_PUBLIC_SITE_URL/i,
    );
  }
});

test('public mode ignores an absent access secret but preserves valid site configuration', () => {
  const config = readAccessConfig(env({ IYAAZ_ACCESS_MODE: 'public', IYAAZ_ACCESS_SECRET: '' }));
  assert.equal(config.mode, 'public');
  assert.equal(config.secret, null);
  assert.equal(config.siteUrl.protocol, 'https:');
});
