import '../../../styles/workspace.css';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FavoritesView } from '../../../components/workspace/FavoritesView';
import { readAccessConfig } from '../../../lib/access/config.ts';
import { requireAppPageAccess } from '../../../lib/access/server.ts';
import { isLocale } from '../../../lib/i18n';
import { buildPageMetadata, getSiteOrigin, publicRoutePolicy } from '../../../lib/seo';
import { workspaceCopy } from '../../../lib/workspace/copy';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = workspaceCopy[locale];
  const mode = readAccessConfig().mode;

  return buildPageMetadata({
    locale,
    title: copy.favoritesHeading,
    description: copy.favoritesDescription,
    policy: publicRoutePolicy({ mode, locale, route: 'personal', pathname: `/${locale}/favorites` }),
    siteOrigin: getSiteOrigin(),
  });
}

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  await requireAppPageAccess(rawLocale);
  const copy = workspaceCopy[rawLocale];

  return (
    <section className="workspace-page" aria-labelledby="favorites-heading">
      <header className="workspace-page__intro">
        <span className="eyebrow">IYAAZ</span>
        <h1 id="favorites-heading">{copy.favoritesHeading}</h1>
        <p>{copy.favoritesDescription}</p>
      </header>
      <FavoritesView locale={rawLocale} />
    </section>
  );
}
