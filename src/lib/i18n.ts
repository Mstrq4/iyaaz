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

export interface DetailCopy {
  breadcrumb: string;
  library: string;
  recordLabel: string;
  overview: string;
  production: string;
  direction: string;
  facts: string;
  id: string;
  shortcut: string;
  type: string;
  domain: string;
  category: string;
  subcategory: string;
  functionText: string;
  requiredInputs: string;
  executionInstructions: string;
  outputs: string;
  sizeRatio: string;
  materialsTech: string;
  lighting: string;
  installationExecution: string;
  visualStyle: string;
  brandCompliance: string;
  combinedShortcuts: string;
  bestUse: string;
  keywords: string;
  assetType: string;
  notes: string;
  notFoundHeading: string;
  notFoundDescription: string;
  backToLibrary: string;
}

export const detailCopy: Record<Locale, DetailCopy> = {
  ar: {
    breadcrumb: 'مسار الاختصار',
    library: 'المكتبة',
    recordLabel: 'اختصار',
    overview: 'نظرة عامة',
    production: 'متطلبات التنفيذ',
    direction: 'التوجيه الإبداعي',
    facts: 'بيانات الاختصار',
    id: 'المعرّف',
    shortcut: 'الاختصار',
    type: 'النوع',
    domain: 'المجال',
    category: 'الفئة',
    subcategory: 'الفئة الفرعية',
    functionText: 'الوظيفة',
    requiredInputs: 'المدخلات المطلوبة',
    executionInstructions: 'تعليمات التنفيذ',
    outputs: 'المخرجات',
    sizeRatio: 'المقاس والنسبة',
    materialsTech: 'الخامات والتقنية',
    lighting: 'الإضاءة',
    installationExecution: 'التركيب والتنفيذ',
    visualStyle: 'الأسلوب البصري',
    brandCompliance: 'الالتزام بالهوية',
    combinedShortcuts: 'الاختصارات المدمجة',
    bestUse: 'أفضل استخدام',
    keywords: 'الكلمات المفتاحية',
    assetType: 'نوع الأصل',
    notes: 'ملاحظات',
    notFoundHeading: 'الاختصار غير موجود',
    notFoundDescription: 'تعذر العثور على الاختصار المطلوب في مكتبة إيعاز.',
    backToLibrary: 'العودة إلى المكتبة',
  },
  en: {
    breadcrumb: 'Shortcut breadcrumb',
    library: 'Library',
    recordLabel: 'Shortcut',
    overview: 'Overview',
    production: 'Production requirements',
    direction: 'Creative direction',
    facts: 'Shortcut facts',
    id: 'ID',
    shortcut: 'Shortcut',
    type: 'Type',
    domain: 'Domain',
    category: 'Category',
    subcategory: 'Subcategory',
    functionText: 'Function',
    requiredInputs: 'Required inputs',
    executionInstructions: 'Execution instructions',
    outputs: 'Outputs',
    sizeRatio: 'Size and ratio',
    materialsTech: 'Materials and technology',
    lighting: 'Lighting',
    installationExecution: 'Installation and execution',
    visualStyle: 'Visual style',
    brandCompliance: 'Brand compliance',
    combinedShortcuts: 'Combined shortcuts',
    bestUse: 'Best use',
    keywords: 'Keywords',
    assetType: 'Asset type',
    notes: 'Notes',
    notFoundHeading: 'Shortcut not found',
    notFoundDescription: 'The requested shortcut could not be found in the IYAAZ library.',
    backToLibrary: 'Back to library',
  },
};

export { promptBuilderCopy, type PromptBuilderCopy } from './prompt/copy';
