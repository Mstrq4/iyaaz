import '../../styles/content-pages.css';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CatalogStats } from '../../components/content/CatalogStats';
import { requireAppPageAccess } from '../../lib/access/server.ts';
import { contentCopy } from '../../lib/content/copy.ts';
import { buildCatalogStatistics } from '../../lib/content/statistics.ts';
import { isLocale } from '../../lib/i18n';
import { getLibraryTaxonomy } from '../../lib/library/server.ts';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAppPageAccess(locale);

  const copy = contentCopy[locale].landing;
  const statistics = buildCatalogStatistics(await getLibraryTaxonomy());

  return (
    <div className="content-page content-page--landing">
      <header className="content-hero" aria-labelledby="home-title">
        <div className="content-hero__copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="home-title">{copy.heading}</h1>
          <p className="content-lead">{copy.lead}</p>
          <div className="content-actions">
            <Link className="content-action content-action--primary" href={`/${locale}/library`}>
              {copy.primaryCta}
            </Link>
            <Link className="content-action" href={`/${locale}/docs`}>
              {copy.secondaryCta}
            </Link>
          </div>
        </div>
      </header>

      <section className="content-section" aria-labelledby="catalog-heading">
        <header className="content-section-heading">
          <h2 id="catalog-heading">{copy.catalogHeading}</h2>
          <p>{copy.catalogDescription}</p>
        </header>
        <CatalogStats locale={locale} statistics={statistics} />
      </section>

      <section className="content-section" aria-labelledby="workflow-heading">
        <header className="content-section-heading">
          <h2 id="workflow-heading">{copy.workflowHeading}</h2>
          <p>{copy.workflowDescription}</p>
        </header>
        <ol className="content-workflow">
          {copy.workflowSteps.map((step, index) => (
            <li key={step.title} data-workflow-step>
              <span className="content-workflow__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="content-note" aria-labelledby="privacy-heading">
        <p className="eyebrow">IYAAZ LOCAL</p>
        <h2 id="privacy-heading">{copy.privacyHeading}</h2>
        <p>{copy.privacyBody}</p>
      </section>
    </div>
  );
}
