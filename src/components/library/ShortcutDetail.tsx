import Link from 'next/link';

import { detailCopy, libraryCopy, type Locale } from '../../lib/i18n';
import type { LibraryRecord, LocalizedLibraryRecord } from '../../lib/library/types';
import { parseRequiredInputs } from '../../lib/prompt/schema';
import { PromptBuilder } from '../prompt/PromptBuilder';
import { FavoriteButton } from '../workspace/FavoriteButton';
import { HistoryRecorder } from '../workspace/HistoryRecorder';
import { DetailSection, type DetailField } from './DetailSection';

interface ShortcutDetailProps {
  locale: Locale;
  record: LocalizedLibraryRecord;
  canonicalRecord: LibraryRecord;
  localizedRecords: Record<Locale, LocalizedLibraryRecord>;
}

function libraryFilterHref(locale: Locale, values: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value.trim()) params.set(key, value);
  }
  return `/${locale}/library?${params.toString()}`;
}

export function ShortcutDetail({ locale, record, canonicalRecord, localizedRecords }: ShortcutDetailProps) {
  const copy = detailCopy[locale];
  const recordLanguageProps = record.translationStatus === 'missing'
    ? { lang: 'ar', dir: 'rtl' as const }
    : undefined;

  const field = (key: keyof LocalizedLibraryRecord, label: string): DetailField => ({
    key,
    label,
    value: typeof record[key] === 'string' ? String(record[key]) : '',
    valueProps: recordLanguageProps,
  });

  const overviewFields = [
    field('functionText', copy.functionText),
    field('bestUse', copy.bestUse),
    field('outputs', copy.outputs),
    field('assetType', copy.assetType),
  ];

  const productionFields = [
    field('requiredInputs', copy.requiredInputs),
    field('executionInstructions', copy.executionInstructions),
    field('sizeRatio', copy.sizeRatio),
    field('materialsTech', copy.materialsTech),
    field('lighting', copy.lighting),
    field('installationExecution', copy.installationExecution),
  ];

  const directionFields = [
    field('visualStyle', copy.visualStyle),
    field('brandCompliance', copy.brandCompliance),
    field('combinedShortcuts', copy.combinedShortcuts),
    field('keywords', copy.keywords),
    field('notes', copy.notes),
  ];

  const promptSchema = parseRequiredInputs(canonicalRecord.requiredInputs);

  return (
    <article className="shortcut-detail" data-shortcut-detail={record.id}>
      <HistoryRecorder recordId={record.id} />

      <nav className="shortcut-detail__breadcrumb" aria-label={copy.breadcrumb}>
        <Link href={`/${locale}/library`}>{copy.library}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" dir="ltr">{record.shortcut}</span>
      </nav>

      <header className="shortcut-detail__hero">
        <span className="eyebrow">{copy.recordLabel} #{record.id}</span>
        <code className="shortcut-detail__shortcut" dir="ltr">{record.shortcut}</code>
        <h1 {...recordLanguageProps}>{record.name}</h1>
        <FavoriteButton locale={locale} recordId={record.id} />
        {record.translationStatus === 'missing' && locale === 'en' ? (
          <p className="library-translation-note">{libraryCopy.en.translationNotice}</p>
        ) : null}
      </header>

      <div className="shortcut-detail__layout">
        <div className="shortcut-detail__main" data-detail-main>
          <DetailSection id="overview" title={copy.overview} fields={overviewFields} />
          <DetailSection id="production" title={copy.production} fields={productionFields} />
          <DetailSection id="direction" title={copy.direction} fields={directionFields} />
        </div>

        <aside className="shortcut-detail__rail" data-detail-rail>
          <PromptBuilder
            uiLocale={locale}
            schema={promptSchema}
            records={localizedRecords}
          />

          <div className="shortcut-detail__facts" aria-label={copy.facts}>
            <h2>{copy.facts}</h2>
            <dl>
              <div>
                <dt>{copy.id}</dt>
                <dd>{record.id}</dd>
              </div>
              <div>
                <dt>{copy.shortcut}</dt>
                <dd><code dir="ltr">{record.shortcut}</code></dd>
              </div>
              <div>
                <dt>{copy.type}</dt>
                <dd {...recordLanguageProps}>{record.shortcutType}</dd>
              </div>
              <div>
                <dt>{copy.domain}</dt>
                <dd>
                  <Link
                    data-taxonomy-link="domain"
                    href={libraryFilterHref(locale, { domain: canonicalRecord.mainDomain })}
                    {...recordLanguageProps}
                  >
                    {record.mainDomain}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>{copy.category}</dt>
                <dd>
                  <Link
                    data-taxonomy-link="category"
                    href={libraryFilterHref(locale, {
                      domain: canonicalRecord.mainDomain,
                      category: canonicalRecord.category,
                    })}
                    {...recordLanguageProps}
                  >
                    {record.category}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>{copy.subcategory}</dt>
                <dd>
                  <Link
                    data-taxonomy-link="subcategory"
                    href={libraryFilterHref(locale, {
                      domain: canonicalRecord.mainDomain,
                      category: canonicalRecord.category,
                      subcategory: canonicalRecord.subcategory,
                    })}
                    {...recordLanguageProps}
                  >
                    {record.subcategory}
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </article>
  );
}
