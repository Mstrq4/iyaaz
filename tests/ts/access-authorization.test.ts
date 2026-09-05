import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizeAccess } from '../../src/lib/access/authorization.ts';
import { ACCESS_COOKIE, accessCookieOptions } from '../../src/lib/access/cookie.ts';
import { signAccessCredential } from '../../src/lib/access/credential.ts';
import type { AccessConfig, AccessCredentialPayload } from '../../src/lib/access/types.ts';

const SECRET = '0123456789abcdef0123456789abcdef';
const NOW = 2_000_000_000;

function config(mode: AccessConfig['mode']): AccessConfig {
  return {
    mode,
    secret: mode === 'public' ? null : SECRET,
    siteUrl: new URL('https://iyaaz.example'),
  };
}

function privateToken(exp = NOW + 3600): string {
  return signAccessCredential({
    v: 1,
    kind: 'private',
    iat: NOW,
    exp,
    scope: 'app',
  }, SECRET);
}

function shareToken(recordId: number, exp = NOW + 3600): string {
  return signAccessCredential({
    v: 1,
    kind: 'share',
    iat: NOW,
    exp,
    scope: 'shortcut',
    recordId,
  }, SECRET);
}

test('public mode allows app, shortcut and api targets without a credential', () => {
  for (const target of [
    { kind: 'app' as const },
    { kind: 'shortcut' as const, recordId: 3 },
    { kind: 'api' as const },
  ]) {
    assert.deepEqual(authorizeAccess({ config: config('public'), token: undefined, target, nowSeconds: NOW }), {
      allowed: true,
      payload: null,
    });
  }
});

test('private mode requires a valid private app credential for all protected targets', () => {
  for (const target of [
    { kind: 'app' as const },
    { kind: 'shortcut' as const, recordId: 3 },
    { kind: 'api' as const },
  ]) {
    const denied = authorizeAccess({ config: config('private'), token: undefined, target, nowSeconds: NOW });
    assert.deepEqual(denied, { allowed: false, status: 401, reason: 'missing' });

    const allowed = authorizeAccess({ config: config('private'), token: privateToken(), target, nowSeconds: NOW });
    assert.equal(allowed.allowed, true);
    if (allowed.allowed) assert.equal(allowed.payload?.kind, 'private');
  }
});

test('private mode rejects invalid, expired and share credentials without throwing', () => {
  assert.deepEqual(
    authorizeAccess({ config: config('private'), token: 'invalid', target: { kind: 'app' }, nowSeconds: NOW }),
    { allowed: false, status: 401, reason: 'invalid' },
  );
  assert.deepEqual(
    authorizeAccess({ config: config('private'), token: privateToken(NOW - 1), target: { kind: 'api' }, nowSeconds: NOW }),
    { allowed: false, status: 401, reason: 'invalid' },
  );
  assert.deepEqual(
    authorizeAccess({ config: config('private'), token: shareToken(3), target: { kind: 'shortcut', recordId: 3 }, nowSeconds: NOW }),
    { allowed: false, status: 401, reason: 'scope' },
  );
});

test('shared mode allows only the exact shortcut carried by a valid share credential', () => {
  const allowed = authorizeAccess({
    config: config('shared'),
    token: shareToken(3),
    target: { kind: 'shortcut', recordId: 3 },
    nowSeconds: NOW,
  });
  assert.equal(allowed.allowed, true);
  if (allowed.allowed) assert.equal(allowed.payload?.recordId, 3);

  assert.deepEqual(
    authorizeAccess({ config: config('shared'), token: shareToken(3), target: { kind: 'shortcut', recordId: 4 }, nowSeconds: NOW }),
    { allowed: false, status: 404, reason: 'record' },
  );
  assert.deepEqual(
    authorizeAccess({ config: config('shared'), token: shareToken(3), target: { kind: 'app' }, nowSeconds: NOW }),
    { allowed: false, status: 404, reason: 'scope' },
  );
  assert.deepEqual(
    authorizeAccess({ config: config('shared'), token: shareToken(3), target: { kind: 'api' }, nowSeconds: NOW }),
    { allowed: false, status: 404, reason: 'scope' },
  );
});

test('shared mode fails closed for missing, invalid and private credentials', () => {
  assert.deepEqual(
    authorizeAccess({ config: config('shared'), token: undefined, target: { kind: 'shortcut', recordId: 3 }, nowSeconds: NOW }),
    { allowed: false, status: 404, reason: 'missing' },
  );
  assert.deepEqual(
    authorizeAccess({ config: config('shared'), token: 'bad', target: { kind: 'shortcut', recordId: 3 }, nowSeconds: NOW }),
    { allowed: false, status: 404, reason: 'invalid' },
  );
  assert.deepEqual(
    authorizeAccess({ config: config('shared'), token: privateToken(), target: { kind: 'shortcut', recordId: 3 }, nowSeconds: NOW }),
    { allowed: false, status: 404, reason: 'scope' },
  );
});

test('access cookie contract is HttpOnly, same-site, origin-wide and bounded by credential expiry', () => {
  const shortPayload: AccessCredentialPayload = {
    v: 1,
    kind: 'private',
    iat: NOW,
    exp: NOW + 900,
    scope: 'app',
  };
  assert.equal(ACCESS_COOKIE, 'iyaaz_access_v1');
  assert.deepEqual(accessCookieOptions(shortPayload, NOW, false), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 900,
  });

  const longPayload: AccessCredentialPayload = { ...shortPayload, exp: NOW + (10 * 24 * 60 * 60) };
  assert.equal(accessCookieOptions(longPayload, NOW, true).maxAge, 7 * 24 * 60 * 60);
  assert.equal(accessCookieOptions(longPayload, NOW, true).secure, true);
});

test('cookie maxAge never becomes negative', () => {
  const payload: AccessCredentialPayload = {
    v: 1,
    kind: 'private',
    iat: NOW - 20,
    exp: NOW - 1,
    scope: 'app',
  };
  assert.equal(accessCookieOptions(payload, NOW, false).maxAge, 0);
});
