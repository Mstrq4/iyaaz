import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import type { Locale } from '../i18n.ts';
import { authorizeAccess } from './authorization.ts';
import { readAccessConfig } from './config.ts';
import { ACCESS_COOKIE } from './cookie.ts';

async function readAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function requireAppPageAccess(locale: Locale): Promise<void> {
  const config = readAccessConfig();
  if (config.mode === 'public') return;

  const decision = authorizeAccess({
    config,
    token: await readAccessToken(),
    target: { kind: 'app' },
  });
  if (decision.allowed) return;

  if (config.mode === 'private') redirect(`/${locale}/access`);
  notFound();
}

export async function requireShortcutPageAccess(
  locale: Locale,
  recordId: number,
): Promise<{ sharedReadOnly: boolean }> {
  const config = readAccessConfig();
  if (config.mode === 'public') return { sharedReadOnly: false };

  const decision = authorizeAccess({
    config,
    token: await readAccessToken(),
    target: { kind: 'shortcut', recordId },
  });
  if (decision.allowed) return { sharedReadOnly: config.mode === 'shared' };

  if (config.mode === 'private') redirect(`/${locale}/access`);
  notFound();
}
