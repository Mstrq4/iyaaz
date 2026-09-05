import { getSiteOrigin } from '../seo/site.ts';
import type { AccessConfig, AccessMode } from './types.ts';

const ACCESS_MODES = new Set<AccessMode>(['public', 'private', 'shared']);
const MIN_ACCESS_SECRET_LENGTH = 32;

function parseMode(raw: string | undefined): AccessMode {
  const value = (raw ?? '').trim();
  if (!value) return 'public';
  if (!ACCESS_MODES.has(value as AccessMode)) {
    throw new Error('IYAAZ_ACCESS_MODE must be public, private, or shared');
  }
  return value as AccessMode;
}

export function readAccessConfig(env: NodeJS.ProcessEnv = process.env): AccessConfig {
  const mode = parseMode(env.IYAAZ_ACCESS_MODE);
  const siteUrl = getSiteOrigin(env);

  if (mode === 'public') {
    return { mode, secret: null, siteUrl };
  }

  const secret = (env.IYAAZ_ACCESS_SECRET ?? '').trim();
  if (secret.length < MIN_ACCESS_SECRET_LENGTH) {
    throw new Error(`IYAAZ_ACCESS_SECRET must contain at least ${MIN_ACCESS_SECRET_LENGTH} characters`);
  }

  return { mode, secret, siteUrl };
}
