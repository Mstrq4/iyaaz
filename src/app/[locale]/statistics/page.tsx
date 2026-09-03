import '../../../styles/content-pages.css';

import { notFound } from 'next/navigation';

import { CatalogStats } from '../../../components/content/CatalogStats';
import { contentCopy } from '../../../lib/content/copy.ts';
import { buildCatalogStatistics } from '../../../lib/content/statistics.ts';
import { isLocale } from '../../../lib/i18n';
import { getLibraryTaxonomy } from '../../../lib/library/server.ts';

export default async function StatisticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = contentCopy[locale].statistics;
  const statistics = buildCatalogStatistics(await getLibraryTaxonomy());

  return (
    <article className="content-page content-page--statistics" aria-labelledby="statistics-title">
      <header className="content-hero content-hero--compact">
        <div className="content-hero__copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="statistics-title">{copy.heading}</h1>
          <p className="content-lead">{copy.lead}</p>
        </div>
      </header>

      <section className="content-section" aria-labelledby="catalog-totals-heading">
        <header className="content-section-heading">
          <h2 id="catalog-totals-heading">{copy.totalsHeading}</h2>
        </header>
        <CatalogStats locale={locale} statistics={statistics} variant="full" />
      </section>
    </article>
  );
}
