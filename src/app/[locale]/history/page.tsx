import '../../../styles/workspace.css';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HistoryView } from '../../../components/workspace/HistoryView';
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
    title: copy.historyHeading,
    description: copy.historyDescription,
    policy: publicRoutePolicy({ mode, locale, route: 'personal', pathname: `/${locale}/history` }),
    siteOrigin: getSiteOrigin(),
  });
}

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  await requireAppPageAccess(rawLocale);
  const copy = workspaceCopy[rawLocale];

  return (
    <section className="workspace-page" aria-labelledby="history-heading">
      <header className="workspace-page__intro">
        <span className="eyebrow">IYAAZ</span>
        <h1 id="history-heading">{copy.historyHeading}</h1>
        <p>{copy.historyDescription}</p>
      </header>
      <HistoryView locale={rawLocale} />
    </section>
  );
}
