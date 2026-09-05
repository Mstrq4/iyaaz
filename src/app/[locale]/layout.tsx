import '../globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ThemeBootstrap } from '@/components/theme/ThemeBootstrap';
import { directionForLocale, isLocale, SUPPORTED_LOCALES } from '@/lib/i18n';
import { getSiteOrigin } from '@/lib/seo';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    metadataBase: getSiteOrigin(),
    title: {
      default: locale === 'ar' ? 'إيعاز' : 'IYAAZ',
      template: locale === 'ar' ? '%s | إيعاز' : '%s | IYAAZ',
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} dir={directionForLocale(locale)} suppressHydrationWarning>
      <body>
        <ThemeBootstrap />
        <AppShell locale={locale}>{children}</AppShell>
      </body>
    </html>
  );
}
