import Link from 'next/link';
import type { ReactNode } from 'react';
import { IyaazMark, IyaazWordmark } from '@/components/brand/IyaazLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageSwitcher } from '@/components/shell/LanguageSwitcher';
import { shellCopy, type Locale } from '@/lib/i18n';

export function AppShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const copy = shellCopy[locale];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{copy.skipToContent}</a>

      <header className="app-header">
        <div className="app-header__inner">
          <Link className="app-brand" href={`/${locale}`} aria-label="IYAAZ — إيعاز">
            <IyaazMark className="app-brand__mark" />
            <IyaazWordmark />
          </Link>

          <nav className="app-navigation" aria-label={copy.primaryNavigation}>
            <Link className="app-navigation__link" href={`/${locale}`}>{copy.home}</Link>
          </nav>

          <div className="app-utilities">
            <LanguageSwitcher locale={locale} label={copy.switchLanguage} />
            <ThemeToggle label={copy.toggleTheme} />
          </div>
        </div>
      </header>

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
