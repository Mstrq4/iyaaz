const SITE_URL_ERROR = 'NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL';

export function getSiteOrigin(env: NodeJS.ProcessEnv = process.env): URL {
  const configured = (env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  const vercelProductionDomain = (env.VERCEL_PROJECT_PRODUCTION_URL ?? '').trim();
  const raw = configured || (vercelProductionDomain ? `https://${vercelProductionDomain}` : '');
  if (!raw) throw new Error(SITE_URL_ERROR);

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(SITE_URL_ERROR);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(SITE_URL_ERROR);
  }

  return new URL(`${parsed.origin}/`);
}
