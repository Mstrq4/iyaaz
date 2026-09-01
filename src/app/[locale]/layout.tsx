import '../globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ThemeBootstrap } from '@/components/theme/ThemeBootstrap';
import { directionForLocale, isLocale, SUPPORTED_LOCALES } from '@/lib/i18n';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: locale === 'ar' ? 'إيعاز | مكتبة اختصارات الدعاية والتصميم' : 'IYAAZ | Creative Prompts Library',
    description: locale === 'ar'
      ? 'مكتبة ثنائية اللغة لاكتشاف اختصارات الدعاية والتصميم وتجهيز النصوص الجاهزة للنسخ.'
      : 'A bilingual library for discovering creative shortcuts and preparing copy-ready prompts.',
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} dir={directionForLocale(locale)} suppressHydrationWarning>
      <body>
        <ThemeBootstrap />
        {children}
      </body>
    </html>
  );
}
