import Link from 'next/link';
import { BrandLink } from '@/components/shell/BrandLink';
import { LocaleSwitch } from '@/components/shell/LocaleSwitch';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { shellCopy, type Locale } from '@/lib/i18n';

export function AppHeader({ locale }: { locale: Locale }) {
  const copy = shellCopy[locale];

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <BrandLink locale={locale} />

        <nav className="app-navigation" aria-label={copy.primaryNavigation}>
          <Link className="app-navigation__link" href={`/${locale}`}>{copy.home}</Link>
        </nav>

        <div className="app-utilities">
          <LocaleSwitch locale={locale} label={copy.switchLanguage} />
          <ThemeToggle label={copy.toggleTheme} />
        </div>
      </div>
    </header>
  );
}
