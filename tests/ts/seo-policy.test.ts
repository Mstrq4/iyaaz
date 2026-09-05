import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPageMetadata, getSiteOrigin, publicRoutePolicy } from '../../src/lib/seo/index.ts';

const ORIGIN = new URL('https://iyaaz.example/');

function env(siteUrl: string): NodeJS.ProcessEnv {
  return { NODE_ENV: 'test', NEXT_PUBLIC_SITE_URL: siteUrl };
}

test('site origin is normalized to the public http(s) origin and rejects unsafe values', () => {
  const origin = getSiteOrigin(env('https://iyaaz.example/base/path?q=1#x'));
  assert.equal(origin.href, 'https://iyaaz.example/');

  for (const value of ['', '/relative', 'ftp://iyaaz.example', 'not a url']) {
    assert.throws(
      () => getSiteOrigin(env(value)),
      /NEXT_PUBLIC_SITE_URL/i,
    );
  }
});

test('site origin falls back to the Vercel project production domain when the public variable is absent', () => {
  const origin = getSiteOrigin({
    NODE_ENV: 'test',
    VERCEL_PROJECT_PRODUCTION_URL: 'iyaaz.vercel.app',
  });

  assert.equal(origin.href, 'https://iyaaz.vercel.app/');
});

test('clean public collection routes are indexable, self-canonical and bilingual', () => {
  for (const route of ['home', 'library', 'docs', 'statistics'] as const) {
    for (const locale of ['ar', 'en'] as const) {
      const policy = publicRoutePolicy({ mode: 'public', locale, route });
      const suffix = route === 'home' ? '' : `/${route}`;

      assert.equal(policy.index, true);
      assert.equal(policy.follow, true);
      assert.equal(policy.canonicalPath, `/${locale}${suffix}`);
      assert.deepEqual(policy.alternatePaths, {
        ar: `/ar${suffix}`,
        en: `/en${suffix}`,
      });
    }
  }
});

test('library query states are noindex/follow and canonicalize to clean bilingual routes', () => {
  const policy = publicRoutePolicy({
    mode: 'public',
    locale: 'en',
    route: 'library',
    hasQueryState: true,
  });

  assert.deepEqual(policy, {
    index: false,
    follow: true,
    canonicalPath: '/en/library',
    alternatePaths: { ar: '/ar/library', en: '/en/library' },
  });
});

test('Arabic shortcut is canonical while English alternate is advertised only when truly translated', () => {
  const fallback = publicRoutePolicy({
    mode: 'public',
    locale: 'ar',
    route: 'shortcut',
    recordId: 3,
    englishTranslationStatus: 'canonical-fallback',
  });
  assert.equal(fallback.index, true);
  assert.equal(fallback.canonicalPath, '/ar/library/3');
  assert.deepEqual(fallback.alternatePaths, { ar: '/ar/library/3' });

  const translated = publicRoutePolicy({
    mode: 'public',
    locale: 'ar',
    route: 'shortcut',
    recordId: 3,
    englishTranslationStatus: 'translated',
  });
  assert.deepEqual(translated.alternatePaths, {
    ar: '/ar/library/3',
    en: '/en/library/3',
  });
});

test('translated English shortcut is self-canonical and indexable with AR/EN alternates', () => {
  const policy = publicRoutePolicy({
    mode: 'public',
    locale: 'en',
    route: 'shortcut',
    recordId: 3,
    englishTranslationStatus: 'translated',
  });

  assert.deepEqual(policy, {
    index: true,
    follow: true,
    canonicalPath: '/en/library/3',
    alternatePaths: { ar: '/ar/library/3', en: '/en/library/3' },
  });
});

test('English canonical-Arabic fallback is noindex/follow and canonicalizes to Arabic only', () => {
  const policy = publicRoutePolicy({
    mode: 'public',
    locale: 'en',
    route: 'shortcut',
    recordId: 3,
    englishTranslationStatus: 'canonical-fallback',
  });

  assert.deepEqual(policy, {
    index: false,
    follow: true,
    canonicalPath: '/ar/library/3',
    alternatePaths: { ar: '/ar/library/3' },
  });
});

test('personal/access surfaces and every protected deployment are noindex/nofollow without public alternates', () => {
  const personal = publicRoutePolicy({
    mode: 'public',
    locale: 'ar',
    route: 'personal',
    pathname: '/ar/favorites',
  });
  assert.deepEqual(personal, {
    index: false,
    follow: false,
    canonicalPath: '/ar/favorites',
  });

  const access = publicRoutePolicy({ mode: 'public', locale: 'en', route: 'access' });
  assert.deepEqual(access, {
    index: false,
    follow: false,
    canonicalPath: '/en/access',
  });

  for (const mode of ['private', 'shared'] as const) {
    const protectedPolicy = publicRoutePolicy({ mode, locale: 'en', route: 'library' });
    assert.equal(protectedPolicy.index, false);
    assert.equal(protectedPolicy.follow, false);
    assert.equal(protectedPolicy.canonicalPath, '/en/library');
    assert.equal(protectedPolicy.alternatePaths, undefined);
  }
});

test('shortcut policy rejects invalid record IDs instead of producing malformed discovery URLs', () => {
  for (const recordId of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => publicRoutePolicy({ mode: 'public', locale: 'ar', route: 'shortcut', recordId }),
      /recordId/i,
    );
  }
});

test('metadata projection emits absolute clean canonical/alternate/OG URLs and robots directives', () => {
  const policy = publicRoutePolicy({
    mode: 'public',
    locale: 'en',
    route: 'library',
    hasQueryState: true,
  });
  const metadata = buildPageMetadata({
    locale: 'en',
    title: 'Shortcut Library',
    description: 'Search the IYAAZ catalog.',
    policy,
    siteOrigin: ORIGIN,
  });

  assert.equal(metadata.title, 'Shortcut Library');
  assert.equal(metadata.description, 'Search the IYAAZ catalog.');
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.alternates?.canonical?.toString(), 'https://iyaaz.example/en/library');
  assert.equal(metadata.alternates?.languages?.ar?.toString(), 'https://iyaaz.example/ar/library');
  assert.equal(metadata.alternates?.languages?.en?.toString(), 'https://iyaaz.example/en/library');
  assert.equal(metadata.openGraph?.url?.toString(), 'https://iyaaz.example/en/library');

  const serialized = JSON.stringify(metadata);
  assert.doesNotMatch(serialized, /credential|token|\?/i);
});
