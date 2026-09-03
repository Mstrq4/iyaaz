import type { Locale } from '../i18n';

export interface PromptBuilderCopy {
  eyebrow: string;
  heading: string;
  description: string;
  outputLanguage: string;
  clientProfile: string;
  noClientProfile: string;
  manageClients: string;
  arabic: string;
  english: string;
  fallbackField: string;
  selectPlaceholder: string;
  booleanYes: string;
  booleanNo: string;
  requiredField: string;
  attachments: string;
  assetReminder: string;
  notes: string;
  notesPlaceholder: string;
  validation: string;
  generate: string;
  output: string;
  copy: string;
  copied: string;
}

export const promptBuilderCopy: Record<Locale, PromptBuilderCopy> = {
  ar: {
    eyebrow: 'أداة إيعاز', heading: 'منشئ الإيعاز', description: 'أكمل مدخلات الاختصار ثم أنشئ نصًا حتميًا جاهزًا للنسخ دون إرسال البيانات إلى أي نموذج خارجي.',
    outputLanguage: 'لغة المخرجات', clientProfile: 'ملف العميل', noClientProfile: 'بدون ملف عميل', manageClients: 'إدارة ملفات العملاء',
    arabic: 'العربية', english: 'English', fallbackField: 'تفاصيل المشروع', selectPlaceholder: 'اختر قيمة', booleanYes: 'نعم', booleanNo: 'لا',
    requiredField: 'هذا الحقل مطلوب.', attachments: 'مرفقات مطلوبة', assetReminder: 'أرفق هذا الأصل عند استخدام النص في الأداة المستهدفة؛ إيعاز لا يرفع الملفات.',
    notes: 'ملاحظات إضافية', notesPlaceholder: 'أضف أي سياق اختياري لا تغطيه الحقول أعلاه.', validation: 'أكمل الحقول المطلوبة قبل إنشاء النص.',
    generate: 'إنشاء النص الكامل', output: 'النص الجاهز', copy: 'نسخ النص', copied: 'تم النسخ',
  },
  en: {
    eyebrow: 'IYAAZ tool', heading: 'Prompt Builder', description: 'Complete the shortcut inputs, then generate a deterministic copy-ready prompt without sending data to an external model.',
    outputLanguage: 'Output language', clientProfile: 'Client profile', noClientProfile: 'No client profile', manageClients: 'Manage client profiles',
    arabic: 'العربية', english: 'English', fallbackField: 'Project details', selectPlaceholder: 'Choose a value', booleanYes: 'Yes', booleanNo: 'No',
    requiredField: 'This field is required.', attachments: 'Required attachments', assetReminder: 'Attach this asset when you use the prompt in the target tool; IYAAZ does not upload files.',
    notes: 'Additional notes', notesPlaceholder: 'Add optional context that is not covered by the fields above.', validation: 'Complete the required fields before generating the prompt.',
    generate: 'Generate full prompt', output: 'Copy-ready prompt', copy: 'Copy prompt', copied: 'Copied',
  },
};
