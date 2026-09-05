import '../../../../styles/library.css';
import '../../../../styles/detail.css';
import '../../../../styles/prompt-builder.css';
import '../../../../styles/workspace.css';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ShortcutDetail } from '../../../../components/library/ShortcutDetail';
import { JsonLd } from '../../../../components/seo/JsonLd';
import { readAccessConfig } from '../../../../lib/access/config.ts';
import { requireShortcutPageAccess } from '../../../../lib/access/server.ts';
import { detailCopy, isLocale, shellCopy } from '../../../../lib/i18n';
import {
  findLibraryRecordById,
  findLocalizedLibraryRecordById,
  loadLibraryRecords,
} from '../../../../lib/library/server';
import { buildPageMetadata, getSiteOrigin, publicRoutePolicy } from '../../../../lib/seo';
import { shortcutJsonLd } from '../../../../lib/seo/structured-data.ts';

interface ShortcutDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

function parseRecordId(value: string): number | undefined {
  if (!/^[1-9]\d*$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : undefined;
}

export async function generateMetadata({ params }: ShortcutDetailPageProps): Promise<Metadata> {
  const { locale, id: rawId } = await params;
  if (!isLocale(locale)) return {};
  const id = parseRecordId(rawId);
  if (!id) return {};

  const [record, englishRecord] = await Promise.all([
    findLocalizedLibraryRecordById(id, locale),
    findLocalizedLibraryRecordById(id, 'en'),
  ]);
  if (!record || !englishRecord) return {};

  const mode = readAccessConfig().mode;
  const description = record.functionText || record.bestUse || record.requiredInputs || (locale === 'ar'
    ? 'تفاصيل اختصار إبداعي من مكتبة إيعاز.'
    : 'Creative shortcut details from the IYAAZ library.');

  return buildPageMetadata({
    locale,
    title: `${record.name} · ${record.shortcut}`,
    description,
    policy: publicRoutePolicy({
      mode,
      locale,
      route: 'shortcut',
      recordId: id,
      englishTranslationStatus: englishRecord.translationStatus === 'translated' ? 'translated' : 'canonical-fallback',
    }),
    siteOrigin: getSiteOrigin(),
  });
}

export default async function ShortcutDetailPage({ params }: ShortcutDetailPageProps) {
  const { locale: rawLocale, id: rawId } = await params;
  if (!isLocale(rawLocale)) notFound();

  const id = parseRecordId(rawId);
  if (!id) notFound();
  const { sharedReadOnly } = await requireShortcutPageAccess(rawLocale, id);

  const records = await loadLibraryRecords();
  const canonicalRecord = findLibraryRecordById(records, id);
  if (!canonicalRecord) notFound();

  const [arRecord, enRecord] = await Promise.all([
    findLocalizedLibraryRecordById(id, 'ar'),
    findLocalizedLibraryRecordById(id, 'en'),
  ]);
  if (!arRecord || !enRecord) notFound();

  const localizedRecord = rawLocale === 'ar' ? arRecord : enRecord;
  const mode = readAccessConfig().mode;
  const policy = publicRoutePolicy({
    mode,
    locale: rawLocale,
    route: 'shortcut',
    recordId: id,
    englishTranslationStatus: enRecord.translationStatus === 'translated' ? 'translated' : 'canonical-fallback',
  });
  const canonicalUrl = new URL(policy.canonicalPath, getSiteOrigin());

  return (
    <>
      {policy.index ? (
        <JsonLd
          data={shortcutJsonLd({
            canonicalUrl,
            locale: rawLocale,
            record: localizedRecord,
            breadcrumbs: [
              { name: shellCopy[rawLocale].home, url: new URL(`/${rawLocale}`, getSiteOrigin()) },
              { name: detailCopy[rawLocale].library, url: new URL(`/${rawLocale}/library`, getSiteOrigin()) },
              { name: localizedRecord.name, url: canonicalUrl },
            ],
          })}
        />
      ) : null}

      <ShortcutDetail
        locale={rawLocale}
        record={localizedRecord}
        canonicalRecord={canonicalRecord}
        localizedRecords={{ ar: arRecord, en: enRecord }}
        sharedReadOnly={sharedReadOnly}
      />
    </>
  );
}
