export const SUPPORTED_LOCALES = ['ar', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type Direction = 'rtl' | 'ltr';

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function directionForLocale(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function alternateLocale(locale: Locale): Locale {
  return locale === 'ar' ? 'en' : 'ar';
}

export const shellCopy: Record<Locale, {
  title: string;
  subtitle: string;
  foundation: string;
  library: string;
  home: string;
  primaryNavigation: string;
  switchLanguage: string;
  toggleTheme: string;
  skipToContent: string;
  footerTagline: string;
}> = {
  ar: {
    title: 'إيعاز',
    subtitle: 'مكتبة اختصارات الدعاية والتصميم',
    foundation: 'يتم بناء المكتبة الآن على أساس ثنائي اللغة ومتجاوب بالكامل.',
    library: 'المكتبة',
    home: 'الرئيسية',
    primaryNavigation: 'التنقل الرئيسي',
    switchLanguage: 'English',
    toggleTheme: 'تبديل المظهر',
    skipToContent: 'انتقل إلى المحتوى',
    footerTagline: 'مكتبة ثنائية اللغة لاختصارات الدعاية والتصميم.',
  },
  en: {
    title: 'IYAAZ',
    subtitle: 'Creative Prompts Library',
    foundation: 'The library is being built on a fully bilingual and responsive foundation.',
    library: 'Library',
    home: 'Home',
    primaryNavigation: 'Primary navigation',
    switchLanguage: 'العربية',
    toggleTheme: 'Toggle theme',
    skipToContent: 'Skip to content',
    footerTagline: 'A bilingual library for creative advertising and design shortcuts.',
  },
};
