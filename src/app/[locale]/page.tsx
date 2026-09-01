import Link from 'next/link';
import { notFound } from 'next/navigation';
import { alternateLocale, isLocale, shellCopy } from '@/lib/i18n';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = shellCopy[locale];
  const otherLocale = alternateLocale(locale);

  return (
    <main className="foundation-shell">
      <header className="foundation-nav" aria-label={copy.title}>
        <Link className="brand-link" href={`/${locale}`}>{copy.title}</Link>
        <nav className="foundation-actions" aria-label={copy.library}>
          <span className="foundation-link">{copy.library}</span>
          <Link className="language-link" href={`/${otherLocale}`} hrefLang={otherLocale}>{copy.switchLanguage}</Link>
        </nav>
      </header>
      <section className="foundation-hero" aria-labelledby="foundation-title">
        <p className="eyebrow">IYAAZ · إيعاز</p>
        <h1 id="foundation-title">{copy.subtitle}</h1>
        <p>{copy.foundation}</p>
      </section>
    </main>
  );
}
