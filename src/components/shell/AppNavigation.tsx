'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { IyaazIcon } from '@/components/icons/IyaazIcon';
import { shellCopy, type Locale } from '@/lib/i18n';

export function AppNavigation({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const copy = shellCopy[locale];
  const items = [
    { label: copy.home, href: `/${locale}` },
    { label: copy.library, href: `/${locale}/library` },
    { label: copy.favorites, href: `/${locale}/favorites` },
    { label: copy.history, href: `/${locale}/history` },
    { label: copy.clients, href: `/${locale}/clients` },
    { label: copy.docs, href: `/${locale}/docs` },
    { label: copy.statistics, href: `/${locale}/statistics` },
  ] as const;

  const isActive = (href: string) => href === `/${locale}`
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="app-navigation" aria-label={copy.primaryNavigation}>
      <button
        type="button"
        className="app-navigation__menu-button icon-button"
        aria-label={open ? copy.closeNavigation : copy.openNavigation}
        aria-expanded={open}
        aria-controls="app-primary-navigation-list"
        onClick={() => setOpen((current) => !current)}
      >
        <IyaazIcon name={open ? 'close' : 'menu'} />
      </button>

      <ul
        id="app-primary-navigation-list"
        className="app-navigation__list"
        data-open={open ? 'true' : 'false'}
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              className="app-navigation__link"
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
