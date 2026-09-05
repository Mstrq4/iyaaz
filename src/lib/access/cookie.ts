import type { AccessCredentialPayload } from './types.ts';

export const ACCESS_COOKIE = 'iyaaz_access_v1';
const MAX_COOKIE_AGE_SECONDS = 7 * 24 * 60 * 60;

export function accessCookieOptions(
  payload: AccessCredentialPayload,
  nowSeconds: number,
  production: boolean,
): {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number;
} {
  const remaining = Math.max(0, payload.exp - nowSeconds);
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: production,
    path: '/',
    maxAge: Math.min(remaining, MAX_COOKIE_AGE_SECONDS),
  };
}
