import type { Metadata } from 'next';

import type { IndexPolicy } from './policy.ts';

function absolute(siteOrigin: URL, path: string): URL {
  if (!path.startsWith('/') || path.includes('?') || path.includes('#')) {
    throw new Error('SEO paths must be clean root-relative paths');
  }
  return new URL(path, siteOrigin);
}

export function buildPageMetadata(options: {
  locale: 'ar' | 'en';
  title: string;
  description: string;
  policy: IndexPolicy;
  siteOrigin: URL;
}): Metadata {
  const canonical = absolute(options.siteOrigin, options.policy.canonicalPath);
  const languages = options.policy.alternatePaths
    ? Object.fromEntries(
        Object.entries(options.policy.alternatePaths).map(([locale, path]) => [
          locale,
          absolute(options.siteOrigin, path),
        ]),
      )
    : undefined;

  return {
    title: options.title,
    description: options.description,
    robots: {
      index: options.policy.index,
      follow: options.policy.follow,
    },
    alternates: {
      canonical,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      type: 'website',
      title: options.title,
      description: options.description,
      url: canonical,
      locale: options.locale === 'ar' ? 'ar_YE' : 'en_US',
    },
  };
}
