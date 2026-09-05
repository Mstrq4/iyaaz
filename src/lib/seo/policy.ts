import type { AccessMode } from '../access/types.ts';

export interface IndexPolicy {
  index: boolean;
  follow: boolean;
  canonicalPath: string;
  alternatePaths?: Partial<Record<'ar' | 'en', string>>;
}

export type PublicSeoRoute = 'home' | 'library' | 'docs' | 'statistics' | 'shortcut' | 'personal' | 'access';

export interface PublicRoutePolicyOptions {
  mode: AccessMode;
  locale: 'ar' | 'en';
  route: PublicSeoRoute;
  recordId?: number;
  hasQueryState?: boolean;
  englishTranslationStatus?: 'translated' | 'canonical-fallback';
  pathname?: string;
}

function localizedPath(locale: 'ar' | 'en', route: Exclude<PublicSeoRoute, 'shortcut' | 'personal'>): string {
  if (route === 'home') return `/${locale}`;
  return `/${locale}/${route}`;
}

function validateRecordId(recordId: number | undefined): number {
  if (!Number.isSafeInteger(recordId) || Number(recordId) < 1) {
    throw new Error('recordId must be a positive safe integer');
  }
  return Number(recordId);
}

function personalPath(locale: 'ar' | 'en', pathname: string | undefined): string {
  if (!pathname || !pathname.startsWith(`/${locale}/`) || pathname.includes('?') || pathname.includes('#')) {
    throw new Error('personal pathname must be a clean localized path');
  }
  return pathname;
}

function routeCanonicalPath(options: PublicRoutePolicyOptions): string {
  if (options.route === 'shortcut') {
    return `/${options.locale}/library/${validateRecordId(options.recordId)}`;
  }
  if (options.route === 'personal') return personalPath(options.locale, options.pathname);
  return localizedPath(options.locale, options.route);
}

function bilingualPaths(route: 'home' | 'library' | 'docs' | 'statistics'): Record<'ar' | 'en', string> {
  return {
    ar: localizedPath('ar', route),
    en: localizedPath('en', route),
  };
}

export function publicRoutePolicy(options: PublicRoutePolicyOptions): IndexPolicy {
  const canonicalPath = routeCanonicalPath(options);

  if (options.mode !== 'public') {
    return { index: false, follow: false, canonicalPath };
  }

  if (options.route === 'personal' || options.route === 'access') {
    return { index: false, follow: false, canonicalPath };
  }

  if (options.route === 'shortcut') {
    const recordId = validateRecordId(options.recordId);
    const arPath = `/ar/library/${recordId}`;
    const enPath = `/en/library/${recordId}`;
    const englishTranslated = options.englishTranslationStatus === 'translated';

    if (options.locale === 'en' && !englishTranslated) {
      return {
        index: false,
        follow: true,
        canonicalPath: arPath,
        alternatePaths: { ar: arPath },
      };
    }

    return {
      index: true,
      follow: true,
      canonicalPath: options.locale === 'ar' ? arPath : enPath,
      alternatePaths: englishTranslated ? { ar: arPath, en: enPath } : { ar: arPath },
    };
  }

  const alternatePaths = bilingualPaths(options.route);
  return {
    index: options.route === 'library' && options.hasQueryState ? false : true,
    follow: true,
    canonicalPath,
    alternatePaths,
  };
}
