import '../../../styles/library.css';
import '../../../styles/workspace.css';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { LibraryExplorer } from '../../../components/library/LibraryExplorer';
import { readAccessConfig } from '../../../lib/access/config.ts';
import { requireAppPageAccess } from '../../../lib/access/server.ts';
import { isLocale, libraryCopy } from '../../../lib/i18n';
import { buildPageMetadata, getSiteOrigin, publicRoutePolicy } from '../../../lib/seo';

interface LibraryPageProps {
  params: Promise<{ locale: string }>;
}

type LibrarySearchParams = Record<string, string | string[] | undefined>;

function hasNonEmptyQueryState(searchParams: LibrarySearchParams): boolean {
  return Object.values(searchParams).some((value) =>
    Array.isArray(value)
      ? value.some((item) => item.trim().length > 0)
      : typeof value === 'string' && value.trim().length > 0,
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: LibraryPageProps & { searchParams: Promise<LibrarySearchParams> }): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) return {};
  const copy = libraryCopy[locale];
  const mode = readAccessConfig().mode;

  return buildPageMetadata({
    locale,
    title: copy.heading,
    description: copy.description,
    policy: publicRoutePolicy({ mode, locale, route: 'library', hasQueryState: hasNonEmptyQueryState(query) }),
    siteOrigin: getSiteOrigin(),
  });
}

export default async function LibraryPage({ params }: LibraryPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  await requireAppPageAccess(rawLocale);

  const locale = rawLocale;
  const copy = libraryCopy[locale];

  return (
    <section className="library-page" aria-labelledby="library-heading">
      <header className="library-page__intro">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1 id="library-heading">{copy.heading}</h1>
        <p>{copy.description}</p>
      </header>

      <Suspense fallback={<div className="library-status" role="status">{copy.loading}</div>}>
        <LibraryExplorer locale={locale} />
      </Suspense>
    </section>
  );
}
