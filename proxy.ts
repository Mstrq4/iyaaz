import { NextResponse, type NextRequest } from 'next/server';

import { readAccessConfig } from './src/lib/access/config.ts';
import { ACCESS_COOKIE } from './src/lib/access/cookie.ts';

function localeForPath(pathname: string): 'ar' | 'en' {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ar';
}

function isAccessSurface(pathname: string): boolean {
  return pathname === '/api/access/exchange' || /^\/(?:ar|en)\/access(?:\/|$)/.test(pathname);
}

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isAccessSurface(pathname)) return NextResponse.next();

  const access = readAccessConfig();
  if (access.mode === 'public') return NextResponse.next();

  // Proxy is only the early missing-cookie boundary. Any present cookie,
  // including an invalid or expired one, must reach the authoritative
  // page/API guard where its HMAC, scope and expiry are verified.
  if (request.cookies.get(ACCESS_COOKIE)?.value) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    const status = access.mode === 'private' ? 401 : 404;
    return NextResponse.json(
      { error: status === 401 ? 'unauthorized' : 'not_found' },
      {
        status,
        headers: { 'Cache-Control': 'no-store, private' },
      },
    );
  }

  if (access.mode === 'private') {
    return NextResponse.redirect(new URL(`/${localeForPath(pathname)}/access`, request.url));
  }

  return new NextResponse(null, {
    status: 404,
    headers: { 'Cache-Control': 'no-store, private' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
