export function buildLocalizedAccessUrl(options: {
  siteUrl: URL;
  locale: 'ar' | 'en';
  credential: string;
}): URL {
  const url = new URL(`/${options.locale}/access`, options.siteUrl);
  url.search = '';
  url.hash = `credential=${options.credential}`;
  return url;
}
