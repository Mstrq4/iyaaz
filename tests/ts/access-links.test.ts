import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLocalizedAccessUrl } from '../../src/lib/access/links.ts';

const SITE_URL = new URL('https://iyaaz.example/some/base/path');
const CREDENTIAL = 'payload-segment.signature-segment';

test('localized access links use the exact root access path and fragment-only credential', () => {
  for (const locale of ['ar', 'en'] as const) {
    const url = buildLocalizedAccessUrl({ siteUrl: SITE_URL, locale, credential: CREDENTIAL });

    assert.equal(url.origin, SITE_URL.origin);
    assert.equal(url.pathname, `/${locale}/access`);
    assert.equal(url.search, '');
    assert.equal(url.searchParams.has('credential'), false);
    assert.equal(url.hash, `#credential=${CREDENTIAL}`);
  }
});

test('generated access URL does not contain unrelated secret material', () => {
  const secret = '0123456789abcdef0123456789abcdef';
  const url = buildLocalizedAccessUrl({ siteUrl: SITE_URL, locale: 'en', credential: CREDENTIAL });

  assert.equal(url.href.includes(secret), false);
  assert.equal(url.username, '');
  assert.equal(url.password, '');
});

test('access URL builder does not mutate the supplied site URL', () => {
  const before = SITE_URL.href;
  buildLocalizedAccessUrl({ siteUrl: SITE_URL, locale: 'ar', credential: CREDENTIAL });
  assert.equal(SITE_URL.href, before);
});
