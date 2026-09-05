import '../../../styles/workspace.css';

import { notFound } from 'next/navigation';

import { FavoritesView } from '../../../components/workspace/FavoritesView';
import { requireAppPageAccess } from '../../../lib/access/server.ts';
import { isLocale } from '../../../lib/i18n';
import { workspaceCopy } from '../../../lib/workspace/copy';

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
