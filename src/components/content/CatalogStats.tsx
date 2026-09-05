import { contentCopy } from '../../lib/content/copy.ts';
import type { CatalogStatistics } from '../../lib/content/statistics.ts';
import type { Locale } from '../../lib/i18n.ts';

interface CatalogStatsProps {
  locale: Locale;
  statistics: CatalogStatistics;
  variant?: 'summary' | 'full';
}

const numberFormatter = new Intl.NumberFormat('en-US');

function formatCount(value: number): string {
  return numberFormatter.format(value);
}

export function CatalogStats({ locale, statistics, variant = 'summary' }: CatalogStatsProps) {
  const copy = contentCopy[locale].statistics;
  const totalItems = [
    { label: copy.records, value: statistics.totals.records },
    { label: copy.domains, value: statistics.totals.domains },
    { label: copy.categories, value: statistics.totals.categories },
    { label: copy.subcategories, value: statistics.totals.subcategories },
  ];

  return (
    <div className={`catalog-stats catalog-stats--${variant}`} data-catalog-statistics>
      <dl className="catalog-stats__totals" aria-label={copy.totalsHeading}>
        {totalItems.map((item) => (
          <div className="catalog-stats__total" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{formatCount(item.value)}</dd>
          </div>
        ))}
      </dl>

      {variant === 'full' ? (
        <>
          <section className="catalog-stats__section" aria-labelledby="shortcut-type-statistics">
            <header className="content-section-heading">
              <h2 id="shortcut-type-statistics">{copy.shortcutTypesHeading}</h2>
              <p>{copy.shortcutTypesDescription}</p>
            </header>
            <div className="content-table-wrap">
              <table className="content-table">
                <thead>
                  <tr>
                    <th scope="col">{copy.typeLabel}</th>
                    <th scope="col">{copy.countLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.shortcutTypes.map((item) => (
                    <tr key={item.name}>
                      <th scope="row">{item.name}</th>
                      <td>{formatCount(item.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="catalog-stats__section" aria-labelledby="domain-statistics">
            <header className="content-section-heading">
              <h2 id="domain-statistics">{copy.domainsHeading}</h2>
              <p>{copy.domainsDescription}</p>
            </header>
            <div className="content-table-wrap">
              <table className="content-table">
                <thead>
                  <tr>
                    <th scope="col">{copy.domainLabel}</th>
                    <th scope="col">{copy.countLabel}</th>
                    <th scope="col">{copy.categoryCountLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.domains.map((domain) => (
                    <tr key={domain.name} data-domain-row>
                      <th scope="row">{domain.name}</th>
                      <td>{formatCount(domain.count)}</td>
                      <td>{formatCount(domain.categories.length)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="catalog-stats__section" aria-labelledby="category-statistics">
            <header className="content-section-heading">
              <h2 id="category-statistics">{copy.categoryBreakdownHeading}</h2>
            </header>
            <div className="catalog-stats__domains">
              {statistics.domains.map((domain, index) => {
                const headingId = `catalog-domain-${index + 1}`;
                return (
                  <section className="catalog-stats__domain" key={domain.name} aria-labelledby={headingId}>
                    <h3 id={headingId}>{domain.name}</h3>
                    <ul>
                      {domain.categories.map((category) => (
                        <li key={category.name}>
                          <span>{category.name}</span>
                          <strong>{formatCount(category.count)}</strong>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
