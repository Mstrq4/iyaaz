'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { detailCopy, type Locale } from '../../../../lib/i18n';

function localeFromPath(pathname: string): Locale {
  return pathname.split('/')[1] === 'en' ? 'en' : 'ar';
}

export default function ShortcutNotFound() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const copy = detailCopy[locale];

  return (
    <section className="shortcut-not-found" aria-labelledby="shortcut-not-found-heading">
      <span className="eyebrow">404</span>
      <h1 id="shortcut-not-found-heading">{copy.notFoundHeading}</h1>
      <p>{copy.notFoundDescription}</p>
      <Link href={`/${locale}/library`}>{copy.backToLibrary}</Link>
    </section>
  );
}
