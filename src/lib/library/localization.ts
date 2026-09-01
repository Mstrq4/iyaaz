import {
  TRANSLATABLE_LIBRARY_FIELDS,
  type LibraryLocale,
  type LibraryRecord,
  type LocalizedLibraryRecord,
  type TranslationOverlayRecord,
} from './types.ts';

function canonicalFallback(record: LibraryRecord, locale: LibraryLocale): LocalizedLibraryRecord {
  const { nameAr, ...rest } = record;
  return {
    ...rest,
    name: nameAr,
    locale,
    translationStatus: locale === 'ar' ? 'canonical' : 'missing',
  };
}

export function hasCompleteEnglishTranslation(
  record: LibraryRecord,
  overlay: TranslationOverlayRecord | undefined,
): overlay is TranslationOverlayRecord {
  if (!overlay || overlay.id !== record.id || overlay.shortcut !== record.shortcut) return false;

  return TRANSLATABLE_LIBRARY_FIELDS.every((field) => {
    const source = record[field].trim();
    if (!source) return true;
    const translated = overlay[field];
    return typeof translated === 'string' && translated.trim().length > 0;
  });
}

export function localizeLibraryRecord(
  record: LibraryRecord,
  overlay: TranslationOverlayRecord | undefined,
  locale: LibraryLocale,
): LocalizedLibraryRecord {
  if (locale === 'ar') return canonicalFallback(record, 'ar');
  if (!hasCompleteEnglishTranslation(record, overlay)) return canonicalFallback(record, 'en');

  const { nameAr: _canonicalName, ...structural } = record;
  const localized: LocalizedLibraryRecord = {
    ...structural,
    name: String(overlay.nameAr),
    locale: 'en',
    translationStatus: 'translated',
  };

  for (const field of TRANSLATABLE_LIBRARY_FIELDS) {
    if (field === 'nameAr') continue;
    const source = record[field];
    if (!source.trim()) continue;
    const translated = overlay[field];
    if (typeof translated === 'string') localized[field] = translated;
  }

  return localized;
}
