import type { AccessMode } from '../access/types.ts';
import type { LibraryRecord } from '../library/types.ts';
import { publicRoutePolicy } from './policy.ts';

export interface SitemapEntry {
  url: string;
}

export interface BuildSitemapEntriesOptions {
  mode: AccessMode;
  siteOrigin: URL;
  records: readonly LibraryRecord[];
  translatedEnglishIds: ReadonlySet<number>;
}

const PUBLIC_COLLECTIONS = [
  ['ar', 'home'],
  ['en', 'home'],
  ['ar', 'library'],
  ['en', 'library'],
  ['ar', 'docs'],
  ['en', 'docs'],
  ['ar', 'statistics'],
  ['en', 'statistics'],
] as const;

export function buildSitemapEntries(options: BuildSitemapEntriesOptions): SitemapEntry[] {
  if (options.mode !== 'public') return [];

  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();

  const append = (path: string) => {
    const url = new URL(path, options.siteOrigin).toString();
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({ url });
  };

  for (const [locale, route] of PUBLIC_COLLECTIONS) {
    const policy = publicRoutePolicy({ mode: 'public', locale, route });
    if (policy.index) append(policy.canonicalPath);
  }

  for (const record of options.records) {
    const policy = publicRoutePolicy({
      mode: 'public',
      locale: 'ar',
      route: 'shortcut',
      recordId: record.id,
      englishTranslationStatus: options.translatedEnglishIds.has(record.id) ? 'translated' : 'canonical-fallback',
    });
    if (policy.index) append(policy.canonicalPath);
  }

  for (const record of options.records) {
    if (!options.translatedEnglishIds.has(record.id)) continue;
    const policy = publicRoutePolicy({
      mode: 'public',
      locale: 'en',
      route: 'shortcut',
      recordId: record.id,
      englishTranslationStatus: 'translated',
    });
    if (policy.index) append(policy.canonicalPath);
  }

  return entries;
}
