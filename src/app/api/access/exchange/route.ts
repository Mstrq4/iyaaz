import { NextResponse } from 'next/server';

import { verifyAccessCredential } from '../../../../lib/access/credential.ts';
import { ACCESS_COOKIE, accessCookieOptions } from '../../../../lib/access/cookie.ts';
import { isLocale } from '../../../../lib/i18n.ts';

const MIN_ACCESS_SECRET_LENGTH = 32;

function noStoreJson(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'cache-control': 'no-store, private' },
  });
}

function exchangeSecret(): string | null {
  const secret = (process.env.IYAAZ_ACCESS_SECRET ?? '').trim();
  return secret.length >= MIN_ACCESS_SECRET_LENGTH ? secret : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ ok: false }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return noStoreJson({ ok: false }, 400);
  }

  const candidate = body as Record<string, unknown>;
  const credential = typeof candidate.credential === 'string' ? candidate.credential.trim() : '';
  const locale = typeof candidate.locale === 'string' ? candidate.locale : '';
  if (!credential || !isLocale(locale)) return noStoreJson({ ok: false }, 400);

  const secret = exchangeSecret();
  if (!secret) return noStoreJson({ ok: false }, 401);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = verifyAccessCredential(credential, secret, nowSeconds);
  if (!payload) return noStoreJson({ ok: false }, 401);

  const redirect = payload.kind === 'private'
    ? `/${locale}`
    : `/${locale}/library/${payload.recordId}`;

  const response = NextResponse.json(
    { ok: true, redirect },
    { headers: { 'cache-control': 'no-store, private' } },
  );
  const requestUrl = new URL(request.url);
  response.cookies.set(
    ACCESS_COOKIE,
    credential,
    accessCookieOptions(payload, nowSeconds, requestUrl.protocol === 'https:'),
  );
  return response;
}
