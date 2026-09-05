import assert from 'node:assert/strict';
import test from 'node:test';

import { signAccessCredential, verifyAccessCredential } from '../../src/lib/access/credential.ts';
import type { AccessCredentialPayload } from '../../src/lib/access/types.ts';

const SECRET = '0123456789abcdef0123456789abcdef';
const OTHER_SECRET = 'fedcba9876543210fedcba9876543210';
const NOW = 2_000_000_000;

const privatePayload: AccessCredentialPayload = {
  v: 1,
  kind: 'private',
  iat: NOW - 10,
  exp: NOW + 3_600,
  scope: 'app',
};

const sharePayload: AccessCredentialPayload = {
  v: 1,
  kind: 'share',
  iat: NOW - 10,
  exp: NOW + 3_600,
  scope: 'shortcut',
  recordId: 3,
};

function resignInvalid(payload: unknown): string {
  return signAccessCredential(payload as AccessCredentialPayload, SECRET);
}

test('private and share credentials round-trip through HMAC verification', () => {
  for (const payload of [privatePayload, sharePayload]) {
    const token = signAccessCredential(payload, SECRET);
    assert.deepEqual(verifyAccessCredential(token, SECRET, NOW), payload);
  }
});

test('payload tampering is rejected because the original signature no longer matches', () => {
  const token = signAccessCredential(sharePayload, SECRET);
  const [payloadSegment, signatureSegment] = token.split('.');
  const decoded = JSON.parse(Buffer.from(payloadSegment!, 'base64url').toString('utf8')) as Record<string, unknown>;
  decoded.recordId = 4;
  const tamperedPayload = Buffer.from(JSON.stringify(decoded), 'utf8').toString('base64url');

  assert.equal(verifyAccessCredential(`${tamperedPayload}.${signatureSegment}`, SECRET, NOW), null);
});

test('signature tampering and a different signing secret are rejected', () => {
  const token = signAccessCredential(privatePayload, SECRET);
  const [payloadSegment, signatureSegment] = token.split('.');
  const changedFirst = signatureSegment![0] === 'A' ? 'B' : 'A';
  const tamperedSignature = `${changedFirst}${signatureSegment!.slice(1)}`;

  assert.equal(verifyAccessCredential(`${payloadSegment}.${tamperedSignature}`, SECRET, NOW), null);
  assert.equal(verifyAccessCredential(token, OTHER_SECRET, NOW), null);
});

test('malformed token, base64 and JSON inputs return null without throwing', () => {
  for (const token of ['', 'abc', 'a.b.c', '@@@@.@@@@', `${Buffer.from('not-json').toString('base64url')}.AAAA`]) {
    assert.doesNotThrow(() => verifyAccessCredential(token, SECRET, NOW));
    assert.equal(verifyAccessCredential(token, SECRET, NOW), null);
  }
});

test('wrong version, expired credentials and credentials issued over 300 seconds in the future are rejected', () => {
  assert.equal(verifyAccessCredential(resignInvalid({ ...privatePayload, v: 2 }), SECRET, NOW), null);
  assert.equal(verifyAccessCredential(resignInvalid({ ...privatePayload, exp: NOW }), SECRET, NOW), null);
  assert.equal(verifyAccessCredential(resignInvalid({ ...privatePayload, iat: NOW + 301 }), SECRET, NOW), null);

  const edge = { ...privatePayload, iat: NOW + 300, exp: NOW + 3_600 };
  assert.deepEqual(verifyAccessCredential(signAccessCredential(edge, SECRET), SECRET, NOW), edge);
});

test('invalid kind/scope/record combinations are rejected', () => {
  const invalidPayloads = [
    { ...privatePayload, scope: 'shortcut' },
    { ...privatePayload, recordId: 3 },
    { ...sharePayload, scope: 'app' },
    { ...sharePayload, recordId: undefined },
    { ...sharePayload, recordId: 0 },
    { ...sharePayload, recordId: -1 },
    { ...sharePayload, recordId: Number.MAX_SAFE_INTEGER + 1 },
    { ...sharePayload, kind: 'private' },
  ];

  for (const payload of invalidPayloads) {
    assert.equal(verifyAccessCredential(resignInvalid(payload), SECRET, NOW), null);
  }
});

test('invalid time fields are rejected before a payload is accepted', () => {
  for (const payload of [
    { ...privatePayload, iat: 1.5 },
    { ...privatePayload, exp: 1.5 },
    { ...privatePayload, exp: privatePayload.iat },
  ]) {
    assert.equal(verifyAccessCredential(resignInvalid(payload), SECRET, NOW), null);
  }
});

test('different signature lengths are rejected before timingSafeEqual and never throw', () => {
  const token = signAccessCredential(privatePayload, SECRET);
  const [payloadSegment] = token.split('.');

  for (const signature of ['A', 'AA', 'AAAA']) {
    assert.doesNotThrow(() => verifyAccessCredential(`${payloadSegment}.${signature}`, SECRET, NOW));
    assert.equal(verifyAccessCredential(`${payloadSegment}.${signature}`, SECRET, NOW), null);
  }
});
