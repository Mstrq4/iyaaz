import '../../../styles/library.css';
import '../../../styles/workspace.css';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { LibraryExplorer } from '../../../components/library/LibraryExplorer';
import { JsonLd } from '../../../components/seo/JsonLd';
import { readAccessConfig } from '../../../lib/access/config.ts';
import { requireAppPageAccess } from '../../../lib/access/server.ts';
import { isLocale, libraryCopy } from '../../../lib/i18n';
import { buildPageMetadata, getSiteOrigin, publicRoutePolicy } from '../../../lib/seo';
import { collectionJsonLd } from '../../../lib/seo/structured-data.ts';

interface LibraryPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<LibrarySearchParams>;
}

type LibrarySearchParams = Record<string, string | string[] | undefined>;

function hasNonEmptyQueryState(searchParams: LibrarySearchParams): boolean {
  return Object.values(searchParams).some((value) =>
    Array.isArray(value)
      ? value.some((item) => item.trim().length > 0)
      : typeof value === 'string' && value.trim().length > 0,
  );
}

export async function generateMetadata({ params, searchParams }: LibraryPageProps): Promise<Metadata> {
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

export default async function LibraryPage({ params, searchParams }: LibraryPageProps) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(rawLocale)) notFound();
  await requireAppPageAccess(rawLocale);

  const locale = rawLocale;
  const copy = libraryCopy[locale];
  const mode = readAccessConfig().mode;
  const policy = publicRoutePolicy({
    mode,
    locale,
    route: 'library',
    hasQueryState: hasNonEmptyQueryState(query),
  });

  return (
    <>
      {policy.index ? (
        <JsonLd
          data={collectionJsonLd({
            canonicalUrl: new URL(policy.canonicalPath, getSiteOrigin()),
            locale,
            name: copy.heading,
            description: copy.description,
          })}
        />
      ) : null}

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
    </>
  );
}
