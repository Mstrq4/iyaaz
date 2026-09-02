import '../../../../styles/library.css';
import '../../../../styles/detail.css';

import { notFound } from 'next/navigation';

import { ShortcutDetail } from '../../../../components/library/ShortcutDetail';
import { isLocale } from '../../../../lib/i18n';
import {
  findLibraryRecordById,
  findLocalizedLibraryRecordById,
  loadLibraryRecords,
} from '../../../../lib/library/server';

interface ShortcutDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

function parseRecordId(value: string): number | undefined {
  if (!/^[1-9]\d*$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : undefined;
}

export default async function ShortcutDetailPage({ params }: ShortcutDetailPageProps) {
  const { locale: rawLocale, id: rawId } = await params;
  if (!isLocale(rawLocale)) notFound();

  const id = parseRecordId(rawId);
  if (!id) notFound();

  const records = await loadLibraryRecords();
  const canonicalRecord = findLibraryRecordById(records, id);
  if (!canonicalRecord) notFound();

  const localizedRecord = await findLocalizedLibraryRecordById(id, rawLocale);
  if (!localizedRecord) notFound();

  return (
    <ShortcutDetail
      locale={rawLocale}
      record={localizedRecord}
      canonicalRecord={canonicalRecord}
    />
  );
}
