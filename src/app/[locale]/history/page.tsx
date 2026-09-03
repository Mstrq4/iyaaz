import '../../../styles/workspace.css';

import { notFound } from 'next/navigation';

import { HistoryView } from '../../../components/workspace/HistoryView';
import { isLocale } from '../../../lib/i18n';
import { workspaceCopy } from '../../../lib/workspace/copy';

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
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
