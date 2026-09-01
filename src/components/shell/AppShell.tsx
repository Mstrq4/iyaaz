import type { ReactNode } from 'react';
import { AppHeader } from '@/components/shell/AppHeader';
import { shellCopy, type Locale } from '@/lib/i18n';

export function AppShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const copy = shellCopy[locale];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{copy.skipToContent}</a>
      <AppHeader locale={locale} />

      <main id="main-content" className="app-main">
        {children}
      </main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <p>{copy.footerTagline}</p>
          <span className="app-footer__brand" aria-hidden="true">IYAAZ · إيعاز</span>
        </div>
      </footer>
    </div>
  );
}
