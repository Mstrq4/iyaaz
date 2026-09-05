import type { LocalizedLibraryRecord } from '../library/types.ts';

const JSON_LD_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/gu, (character) => JSON_LD_ESCAPES[character] ?? character);
}

export function websiteJsonLd(options: { siteOrigin: URL; locale: 'ar' | 'en'; name: string }): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: options.name,
    url: new URL(`/${options.locale}`, options.siteOrigin).toString(),
    inLanguage: options.locale,
  };
}

export function collectionJsonLd(options: {
  canonicalUrl: URL;
  locale: 'ar' | 'en';
  name: string;
  description: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: options.canonicalUrl.toString(),
    inLanguage: options.locale,
  };
}

export function shortcutJsonLd(options: {
  canonicalUrl: URL;
  locale: 'ar' | 'en';
  record: LocalizedLibraryRecord;
  breadcrumbs: readonly { name: string; url: URL }[];
}): readonly object[] {
  const work: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: options.record.name,
    alternateName: options.record.shortcut,
    description: options.record.functionText,
    url: options.canonicalUrl.toString(),
    inLanguage: options.locale,
    identifier: String(options.record.id),
    keywords: options.record.keywords,
  };

  if (!options.record.keywords.trim()) delete work.keywords;

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: options.breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url.toString(),
    })),
  };

  return [work, breadcrumbList];
}
