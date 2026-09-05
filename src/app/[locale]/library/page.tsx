import '../../../styles/library.css';
import '../../../styles/workspace.css';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { LibraryExplorer } from '../../../components/library/LibraryExplorer';
import { requireAppPageAccess } from '../../../lib/access/server.ts';
import { isLocale, libraryCopy } from '../../../lib/i18n';

interface LibraryPageProps {
  params: Promise<{ locale: string }>;
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
