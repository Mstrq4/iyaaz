import type { Locale } from '../i18n.ts';

export interface AccessCopy {
  eyebrow: string;
  heading: string;
  description: string;
  processing: string;
  failure: string;
}

export const accessCopy: Record<Locale, AccessCopy> = {
  ar: {
    eyebrow: 'الوصول الآمن',
    heading: 'جارٍ التحقق من رابط الوصول',
    description: 'يتم التحقق من بيانات الرابط محليًا ثم تبادلها مع خادم إيعاز عبر اتصال آمن.',
    processing: 'جارٍ التحقق…',
    failure: 'الرابط غير صالح أو منتهي الصلاحية',
  },
  en: {
    eyebrow: 'Secure access',
    heading: 'Verifying access link',
    description: 'The link credential is read locally, then exchanged with IYAAZ through a same-origin request.',
    processing: 'Verifying…',
    failure: 'This access link is invalid or expired',
  },
};
