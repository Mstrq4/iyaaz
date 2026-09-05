'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { alternateLocale, type Locale } from '@/lib/i18n';

function alternateLocalePath(pathname: string, locale: Locale, targetLocale: Locale): string {
  const localeRoot = `/${locale}`;

  if (pathname === localeRoot) return `/${targetLocale}`;
  if (pathname.startsWith(`${localeRoot}/`)) {
    return `/${targetLocale}${pathname.slice(localeRoot.length)}`;
  }

  return `/${targetLocale}`;
}

export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const targetLocale = alternateLocale(locale);
  const href = alternateLocalePath(pathname, locale, targetLocale);

  return (
    <Link className="language-switcher" href={href} hrefLang={targetLocale} lang={targetLocale}>
      {label}
    </Link>
  );
}
