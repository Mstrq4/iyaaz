import { createHmac, timingSafeEqual } from 'node:crypto';

import type { AccessCredentialPayload } from './types.ts';

const CURRENT_VERSION = 1;
const MAX_FUTURE_IAT_SKEW_SECONDS = 300;
const BASE64URL_SEGMENT = /^[A-Za-z0-9_-]+$/;

function signatureFor(payloadSegment: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payloadSegment).digest();
}

function isSafeTimestamp(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function normalizePayload(value: unknown, nowSeconds: number): AccessCredentialPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;

  if (candidate.v !== CURRENT_VERSION) return null;
  if (candidate.kind !== 'private' && candidate.kind !== 'share') return null;
  if (candidate.scope !== 'app' && candidate.scope !== 'shortcut') return null;
  if (!isSafeTimestamp(candidate.iat) || !isSafeTimestamp(candidate.exp)) return null;
  if (candidate.exp <= candidate.iat || candidate.exp <= nowSeconds) return null;
  if (candidate.iat > nowSeconds + MAX_FUTURE_IAT_SKEW_SECONDS) return null;

  if (candidate.kind === 'private') {
    if (candidate.scope !== 'app' || candidate.recordId !== undefined) return null;
    return {
      v: 1,
      kind: 'private',
      iat: candidate.iat,
      exp: candidate.exp,
      scope: 'app',
    };
  }

  if (
    candidate.scope !== 'shortcut' ||
    !Number.isSafeInteger(candidate.recordId) ||
    Number(candidate.recordId) < 1
  ) {
    return null;
  }

  return {
    v: 1,
    kind: 'share',
    iat: candidate.iat,
    exp: candidate.exp,
    scope: 'shortcut',
    recordId: Number(candidate.recordId),
  };
}

export function signAccessCredential(payload: AccessCredentialPayload, secret: string): string {
  const payloadSegment = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signatureSegment = signatureFor(payloadSegment, secret).toString('base64url');
  return `${payloadSegment}.${signatureSegment}`;
}

export function verifyAccessCredential(
  token: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): AccessCredentialPayload | null {
  try {
    const segments = token.split('.');
    if (segments.length !== 2) return null;

    const [payloadSegment, signatureSegment] = segments;
    if (!payloadSegment || !signatureSegment) return null;
    if (!BASE64URL_SEGMENT.test(payloadSegment) || !BASE64URL_SEGMENT.test(signatureSegment)) return null;

    const suppliedSignature = Buffer.from(signatureSegment, 'base64url');
    const expectedSignature = signatureFor(payloadSegment, secret);
    if (suppliedSignature.length !== expectedSignature.length) return null;
    if (!timingSafeEqual(suppliedSignature, expectedSignature)) return null;

    const payloadText = Buffer.from(payloadSegment, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(payloadText);
    return normalizePayload(parsed, nowSeconds);
  } catch {
    return null;
  }
}
