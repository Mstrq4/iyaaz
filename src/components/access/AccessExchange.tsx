'use client';

import { useEffect, useRef, useState } from 'react';

import type { Locale } from '../../lib/i18n.ts';

interface AccessExchangeProps {
  locale: Locale;
  processingLabel: string;
  failureLabel: string;
}

interface ExchangeResponse {
  ok?: boolean;
  redirect?: string;
}

function clearFragment(): void {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function isSafeRedirect(value: unknown, locale: Locale): value is string {
  if (typeof value !== 'string' || !value.startsWith(`/${locale}`) || value.startsWith('//')) return false;
  const target = new URL(value, window.location.origin);
  return target.origin === window.location.origin && target.hash === '';
}

export function AccessExchange({ locale, processingLabel, failureLabel }: AccessExchangeProps) {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const credential = fragment.get('credential')?.trim() ?? '';
    clearFragment();

    void (async () => {
      if (!credential) {
        await Promise.resolve();
        setFailed(true);
        return;
      }

      try {
        const response = await fetch('/api/access/exchange', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ credential, locale }),
        });
        const payload = await response.json().catch(() => null) as ExchangeResponse | null;
        if (!response.ok || !payload?.ok || !isSafeRedirect(payload.redirect, locale)) {
          setFailed(true);
          return;
        }
        window.location.replace(payload.redirect);
      } catch {
        setFailed(true);
      }
    })();
  }, [locale]);

  return (
    <div className="access-exchange__status" role="status" aria-live="polite">
      {failed ? failureLabel : processingLabel}
    </div>
  );
}
