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

export interface LibraryCopy {
  eyebrow: string;
  heading: string;
  description: string;
  search: string;
  searchPlaceholder: string;
  filters: string;
  domain: string;
  allDomains: string;
  category: string;
  allCategories: string;
  subcategory: string;
  allSubcategories: string;
  type: string;
  allTypes: string;
  sort: string;
  sortRelevance: string;
  sortOldest: string;
  sortNewest: string;
  sortShortcut: string;
  sortName: string;
  results: string;
  records: string;
  loading: string;
  updating: string;
  error: string;
  retry: string;
  noResults: string;
  clearSearch: string;
  details: string;
  copyShortcut: string;
  copied: string;
  previous: string;
  next: string;
  page: string;
  of: string;
  pagination: string;
  translationNotice: string;
}

export const libraryCopy: Record<Locale, LibraryCopy> = {
  ar: {
    eyebrow: 'دليل إيعاز',
    heading: 'مكتبة الاختصارات',
    description: 'ابحث في آلاف الاختصارات المنظّمة، ثم صفِّ النتائج حسب المجال والفئة والنوع دون فقدان حالة بحثك.',
    search: 'ابحث في المكتبة',
    searchPlaceholder: 'اكتب اسم الاختصار أو المجال أو وصف الاستخدام',
    filters: 'فلاتر المكتبة',
    domain: 'المجال',
    allDomains: 'كل المجالات',
    category: 'الفئة',
    allCategories: 'كل الفئات',
    subcategory: 'الفئة الفرعية',
    allSubcategories: 'كل الفئات الفرعية',
    type: 'النوع',
    allTypes: 'كل الأنواع',
    sort: 'الترتيب',
    sortRelevance: 'الأكثر صلة',
    sortOldest: 'الأقدم أولًا',
    sortNewest: 'الأحدث أولًا',
    sortShortcut: 'الاختصار أبجديًا',
    sortName: 'الاسم أبجديًا',
    results: 'النتائج',
    records: 'اختصار',
    loading: 'جارٍ تحميل المكتبة…',
    updating: 'جارٍ تحديث النتائج…',
    error: 'تعذر تحميل بيانات المكتبة.',
    retry: 'إعادة المحاولة',
    noResults: 'لا توجد نتائج مطابقة لهذه المعايير.',
    clearSearch: 'مسح البحث',
    details: 'التفاصيل',
    copyShortcut: 'نسخ الاختصار',
    copied: 'تم النسخ',
    previous: 'السابق',
    next: 'التالي',
    page: 'صفحة',
    of: 'من',
    pagination: 'التنقل بين صفحات المكتبة',
    translationNotice: '',
  },
  en: {
    eyebrow: 'IYAAZ directory',
    heading: 'Shortcut Library',
    description: 'Search thousands of structured shortcuts, then narrow the catalog by domain, category and type while keeping the entire view URL-driven.',
    search: 'Search the library',
    searchPlaceholder: 'Search shortcut, domain or use case',
    filters: 'Library filters',
    domain: 'Domain',
    allDomains: 'All domains',
    category: 'Category',
    allCategories: 'All categories',
    subcategory: 'Subcategory',
    allSubcategories: 'All subcategories',
    type: 'Type',
    allTypes: 'All types',
    sort: 'Sort',
    sortRelevance: 'Most relevant',
    sortOldest: 'Oldest first',
    sortNewest: 'Newest first',
    sortShortcut: 'Shortcut A–Z',
    sortName: 'Name A–Z',
    results: 'Results',
    records: 'shortcuts',
    loading: 'Loading library…',
    updating: 'Updating results…',
    error: 'The library data could not be loaded.',
    retry: 'Retry',
    noResults: 'No shortcuts match these criteria.',
    clearSearch: 'Clear search',
    details: 'Details',
    copyShortcut: 'Copy shortcut',
    copied: 'Copied',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    pagination: 'Library pagination',
    translationNotice: 'English catalog translations are not available in this snapshot yet. Canonical Arabic source content is shown where needed.',
  },
};
