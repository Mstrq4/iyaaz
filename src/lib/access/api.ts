import { authorizeAccess } from './authorization.ts';
import { readAccessConfig } from './config.ts';
import { ACCESS_COOKIE } from './cookie.ts';

function rawAccessMode(): string {
  return (process.env.IYAAZ_ACCESS_MODE ?? '').trim();
}

function cookieValue(request: Request | undefined, name: string): string | undefined {
  const header = request?.headers.get('cookie');
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value || undefined;
  }
  return undefined;
}

export async function requireReadApiAccess(
  request?: Request,
  target?: { recordId?: number },
): Promise<Response | null> {
  const mode = rawAccessMode();
  if (!mode || mode === 'public') return null;

  const config = readAccessConfig();
  const recordId = target?.recordId;
  const decision = authorizeAccess({
    config,
    token: cookieValue(request, ACCESS_COOKIE),
    target: recordId === undefined ? { kind: 'api' } : { kind: 'shortcut', recordId },
  });
  if (decision.allowed) return null;

  return Response.json(
    { error: decision.status === 404 ? 'not_found' : 'unauthorized' },
    {
      status: decision.status,
      headers: { 'Cache-Control': 'no-store, private' },
    },
  );
}
