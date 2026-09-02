import type { Locale } from '../i18n';

export interface PromptBuilderCopy {
  eyebrow: string;
  heading: string;
  description: string;
  outputLanguage: string;
  arabic: string;
  english: string;
  tone: string;
  toneNone: string;
  toneProfessional: string;
  toneConcise: string;
  toneExpressive: string;
  fallbackField: string;
  selectPlaceholder: string;
  requiredField: string;
  attachments: string;
  assetReminder: string;
  validation: string;
  generate: string;
  output: string;
  copy: string;
  copied: string;
}

export const promptBuilderCopy: Record<Locale, PromptBuilderCopy> = {
  ar: {
    eyebrow: 'أداة إيعاز',
    heading: 'منشئ الإيعاز',
    description: 'أكمل مدخلات الاختصار ثم أنشئ نصًا حتميًا جاهزًا للنسخ دون إرسال البيانات إلى أي نموذج خارجي.',
    outputLanguage: 'لغة المخرجات',
    arabic: 'العربية',
    english: 'English',
    tone: 'النبرة والأسلوب',
    toneNone: 'بدون نبرة إضافية',
    toneProfessional: 'احترافية',
    toneConcise: 'موجزة',
    toneExpressive: 'تعبيرية',
    fallbackField: 'المدخلات المطلوبة',
    selectPlaceholder: 'اختر قيمة',
    requiredField: 'هذا الحقل مطلوب.',
    attachments: 'مرفقات مطلوبة',
    assetReminder: 'أرفق هذا الأصل عند استخدام النص في الأداة المستهدفة؛ إيعاز لا يرفع الملفات.',
    validation: 'أكمل الحقول المطلوبة قبل إنشاء النص.',
    generate: 'إنشاء النص الكامل',
    output: 'النص الجاهز',
    copy: 'نسخ النص',
    copied: 'تم النسخ',
  },
  en: {
    eyebrow: 'IYAAZ tool',
    heading: 'Prompt Builder',
    description: 'Complete the shortcut inputs, then generate a deterministic copy-ready prompt without sending data to an external model.',
    outputLanguage: 'Output language',
    arabic: 'العربية',
    english: 'English',
    tone: 'Tone and style',
    toneNone: 'No additional tone',
    toneProfessional: 'Professional',
    toneConcise: 'Concise',
    toneExpressive: 'Expressive',
    fallbackField: 'Required inputs',
    selectPlaceholder: 'Choose a value',
    requiredField: 'This field is required.',
    attachments: 'Required attachments',
    assetReminder: 'Attach this asset when you use the prompt in the target tool; IYAAZ does not upload files.',
    validation: 'Complete the required fields before generating the prompt.',
    generate: 'Generate full prompt',
    output: 'Copy-ready prompt',
    copy: 'Copy prompt',
    copied: 'Copied',
  },
};
