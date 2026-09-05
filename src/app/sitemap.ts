import type { MetadataRoute } from 'next';

import { readAccessConfig } from '../lib/access/config.ts';
import {
  loadEnglishTranslationOverlay,
  loadLibraryRecords,
} from '../lib/library/server.ts';
import { buildSitemapEntries } from '../lib/seo/sitemap.ts';
import { getSiteOrigin } from '../lib/seo/site.ts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mode = readAccessConfig().mode;
  if (mode !== 'public') return [];

  const [records, englishOverlay] = await Promise.all([
    loadLibraryRecords(),
    loadEnglishTranslationOverlay(),
  ]);
  const translatedEnglishIds = new Set(englishOverlay.map((record) => record.id));

  return buildSitemapEntries({
    mode,
    siteOrigin: getSiteOrigin(),
    records,
    translatedEnglishIds,
  });
}
