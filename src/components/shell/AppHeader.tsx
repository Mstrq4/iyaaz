import { AppNavigation } from '@/components/shell/AppNavigation';
import { BrandLink } from '@/components/shell/BrandLink';
import { LocaleSwitch } from '@/components/shell/LocaleSwitch';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { shellCopy, type Locale } from '@/lib/i18n';

export function AppHeader({ locale }: { locale: Locale }) {
  const copy = shellCopy[locale];
  const sharedMode = (process.env.IYAAZ_ACCESS_MODE ?? '').trim() === 'shared';

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <BrandLink locale={locale} />
        {sharedMode ? null : <AppNavigation locale={locale} />}

        <div className="app-utilities">
          <LocaleSwitch locale={locale} label={copy.switchLanguage} />
          <ThemeToggle label={copy.toggleTheme} />
        </div>
      </div>
    </header>
  );
}
