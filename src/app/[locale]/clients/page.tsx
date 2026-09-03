import '../../../styles/workspace.css';
import '../../../styles/client-profiles.css';

import { notFound } from 'next/navigation';

import { ClientProfilesView } from '../../../components/workspace/ClientProfilesView';
import { isLocale } from '../../../lib/i18n';
import { workspaceCopy } from '../../../lib/workspace/copy';

export default async function ClientProfilesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
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
