import '../../../../styles/library.css';
import '../../../../styles/detail.css';
import '../../../../styles/prompt-builder.css';
import '../../../../styles/workspace.css';

import { notFound } from 'next/navigation';

import { ShortcutDetail } from '../../../../components/library/ShortcutDetail';
import { requireShortcutPageAccess } from '../../../../lib/access/server.ts';
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

  return (
    <ShortcutDetail
      locale={rawLocale}
      record={localizedRecord}
      canonicalRecord={canonicalRecord}
      localizedRecords={{ ar: arRecord, en: enRecord }}
      sharedReadOnly={sharedReadOnly}
    />
  );
}
