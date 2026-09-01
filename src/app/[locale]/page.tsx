import { notFound } from 'next/navigation';
import { isLocale, shellCopy } from '@/lib/i18n';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = shellCopy[locale];

  return (
    <section className="home-hero" aria-labelledby="home-title">
      <p className="eyebrow">IYAAZ · إيعاز</p>
      <h1 id="home-title">{copy.subtitle}</h1>
      <p>{copy.foundation}</p>
    </section>
  );
}
