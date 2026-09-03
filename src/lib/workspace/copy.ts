import type { Locale } from '../i18n';

export interface WorkspaceCopy {
  favorite: string;
  favoritesHeading: string;
  favoritesDescription: string;
  historyHeading: string;
  historyDescription: string;
  searchFavorites: string;
  searchHistory: string;
  sort: string;
  newest: string;
  shortcut: string;
  name: string;
  clearFavorites: string;
  clearHistory: string;
  confirmClearFavorites: string;
  confirmClearHistory: string;
  emptyFavorites: string;
  emptyHistory: string;
  loading: string;
  error: string;
  backToLibrary: string;
  details: string;
}

export const workspaceCopy: Record<Locale, WorkspaceCopy> = {
  ar: {
    favorite: 'المفضلة',
    favoritesHeading: 'المفضلة',
    favoritesDescription: 'اختصاراتك المحفوظة في هذا المتصفح فقط.',
    historyHeading: 'السجل',
    historyDescription: 'آخر الاختصارات التي فتحتها في هذا المتصفح.',
    searchFavorites: 'البحث في المفضلة',
    searchHistory: 'البحث في السجل',
    sort: 'الترتيب',
    newest: 'الأحدث',
    shortcut: 'الاختصار',
    name: 'الاسم',
    clearFavorites: 'مسح المفضلة',
    clearHistory: 'مسح السجل',
    confirmClearFavorites: 'هل تريد مسح جميع الاختصارات المفضلة؟',
    confirmClearHistory: 'هل تريد مسح سجل الاختصارات؟',
    emptyFavorites: 'لا توجد اختصارات مفضلة بعد.',
    emptyHistory: 'لم تفتح أي اختصارات بعد.',
    loading: 'جارٍ تحميل الاختصارات…',
    error: 'تعذر تحميل الاختصارات المحفوظة.',
    backToLibrary: 'العودة إلى المكتبة',
    details: 'التفاصيل',
  },
  en: {
    favorite: 'Favorite',
    favoritesHeading: 'Favorites',
    favoritesDescription: 'Shortcuts saved only in this browser.',
    historyHeading: 'History',
    historyDescription: 'Recently opened shortcuts in this browser.',
    searchFavorites: 'Search favorites',
    searchHistory: 'Search history',
    sort: 'Sort',
    newest: 'Newest',
    shortcut: 'Shortcut',
    name: 'Name',
    clearFavorites: 'Clear favorites',
    clearHistory: 'Clear history',
    confirmClearFavorites: 'Clear all favorite shortcuts?',
    confirmClearHistory: 'Clear shortcut history?',
    emptyFavorites: 'No favorites yet.',
    emptyHistory: 'No shortcuts opened yet.',
    loading: 'Loading shortcuts…',
    error: 'Saved shortcuts could not be loaded.',
    backToLibrary: 'Back to library',
    details: 'Details',
  },
};

export function removeFavoriteLabel(locale: Locale, shortcut: string): string {
  return locale === 'ar'
    ? `إزالة ${shortcut} من المفضلة`
    : `Remove ${shortcut} from favorites`;
}

export function removeHistoryLabel(locale: Locale, shortcut: string): string {
  return locale === 'ar'
    ? `إزالة ${shortcut} من السجل`
    : `Remove ${shortcut} from history`;
}

export function historyOpenCount(locale: Locale, count: number): string {
  return locale === 'ar' ? `${count} مرات فتح` : `${count} opens`;
}
