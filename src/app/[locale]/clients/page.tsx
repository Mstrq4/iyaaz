import '../../../styles/workspace.css';
import '../../../styles/client-profiles.css';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ClientProfilesView } from '../../../components/workspace/ClientProfilesView';
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
    title: copy.clientsHeading,
    description: copy.clientsDescription,
    policy: publicRoutePolicy({ mode, locale, route: 'personal', pathname: `/${locale}/clients` }),
    siteOrigin: getSiteOrigin(),
  });
}

export default async function ClientProfilesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  await requireAppPageAccess(rawLocale);
  const copy = workspaceCopy[rawLocale];

  return (
    <section className="workspace-page" aria-labelledby="clients-heading">
      <header className="workspace-page__intro">
        <span className="eyebrow">IYAAZ</span>
        <h1 id="clients-heading">{copy.clientsHeading}</h1>
        <p>{copy.clientsDescription}</p>
      </header>
      <ClientProfilesView locale={rawLocale} />
    </section>
  );
}
