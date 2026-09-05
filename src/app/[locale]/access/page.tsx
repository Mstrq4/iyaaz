import '../../../styles/content-pages.css';

import { notFound } from 'next/navigation';

import { AccessExchange } from '../../../components/access/AccessExchange.tsx';
import { accessCopy } from '../../../lib/access/copy.ts';
import { isLocale } from '../../../lib/i18n.ts';

export default async function AccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = accessCopy[locale];

  return (
    <article className="content-page" aria-labelledby="access-title">
      <header className="content-hero content-hero--compact">
        <div className="content-hero__copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="access-title">{copy.heading}</h1>
          <p className="content-lead">{copy.description}</p>
          <AccessExchange
            locale={locale}
            processingLabel={copy.processing}
            failureLabel={copy.failure}
          />
        </div>
      </header>
    </article>
  );
}
