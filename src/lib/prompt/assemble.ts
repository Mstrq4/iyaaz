import type { LocalizedLibraryRecord } from '../library/types';
import type { PromptFieldDescriptor } from './schema';

export type PromptLanguage = 'ar' | 'en';

export interface PromptFieldValue extends PromptFieldDescriptor {
  value: string;
}

export interface PromptClientContext {
  name: string;
  businessDescription: string;
  brandColors: string;
  tone: string;
  constraints: string;
  notes: string;
}

export interface AssemblePromptOptions {
  record: LocalizedLibraryRecord;
  language: PromptLanguage;
  fields: readonly PromptFieldValue[];
  notes?: string;
  client?: PromptClientContext;
}

export interface AssembledPrompt {
  text: string;
  attachmentReminders: string[];
}

const ATTACHMENT_REQUIREMENT = /(?:\b(?:logo|image|photo|reference\s+(?:image|file|asset)|attachment|brand\s+mark)\b|شعار|صورة|صوره|مرجع\s+(?:صورة|صوره|ملف)|مرفق)/iu;

const copy = {
  ar: {
    shortcut: 'الاختصار',
    intent: 'الهدف',
    clientContext: 'سياق العميل',
    clientLabels: {
      name: 'العميل',
      businessDescription: 'نبذة النشاط',
      brandColors: 'ألوان الهوية',
      tone: 'النبرة',
      constraints: 'القيود',
      notes: 'ملاحظات العميل',
    },
    inputs: 'مدخلات المشروع',
    execution: 'تعليمات التنفيذ',
    outputs: 'المخرجات المتوقعة',
    constraints: 'القيود والتوجيهات',
    notes: 'ملاحظات إضافية',
    outputLanguage: 'لغة المخرجات',
    languageName: 'العربية',
    finalQuality: 'تعليمات الجودة النهائية',
    finalQualityText: 'حافظ على الاتساق بين جميع المدخلات والقيود، ولا تغيّر الحقائق أو الأبعاد أو متطلبات الهوية التي قدمها المستخدم.',
    attachments: 'تذكيرات المرفقات',
    yes: 'نعم',
    no: 'لا',
    constraintLabels: {
      sizeRatio: 'المقاس والنسبة',
      materialsTech: 'الخامات والتقنية',
      lighting: 'الإضاءة',
      installationExecution: 'التركيب والتنفيذ',
      visualStyle: 'الأسلوب البصري',
      brandCompliance: 'الالتزام بالهوية',
    },
  },
  en: {
    shortcut: 'Shortcut',
    intent: 'Intent',
    clientContext: 'Client context',
    clientLabels: {
      name: 'Client',
      businessDescription: 'Business',
      brandColors: 'Brand colors',
      tone: 'Tone',
      constraints: 'Constraints',
      notes: 'Client notes',
    },
    inputs: 'Project inputs',
    execution: 'Execution instructions',
    outputs: 'Expected outputs',
    constraints: 'Constraints and direction',
    notes: 'Additional notes',
    outputLanguage: 'Output language',
    languageName: 'English',
    finalQuality: 'Final quality instruction',
    finalQualityText: 'Keep all inputs and constraints internally consistent, and do not alter user-provided facts, dimensions, or brand requirements.',
    attachments: 'Attachment reminders',
    yes: 'Yes',
    no: 'No',
    constraintLabels: {
      sizeRatio: 'Size and ratio',
      materialsTech: 'Materials and technology',
      lighting: 'Lighting',
      installationExecution: 'Installation and execution',
      visualStyle: 'Visual style',
      brandCompliance: 'Brand compliance',
    },
  },
} as const;

const CONSTRAINT_FIELDS = [
  'sizeRatio',
  'materialsTech',
  'lighting',
  'installationExecution',
  'visualStyle',
  'brandCompliance',
] as const satisfies readonly (keyof LocalizedLibraryRecord)[];

const CLIENT_OVERRIDE_ALIASES = {
  businessDescription: ['business', 'activity', 'نشاط', 'نبذة'],
  brandColors: ['brand color', 'brand palette', 'ألوان الهوية', 'الوان الهوية'],
  tone: ['tone', 'نبرة'],
  constraints: ['constraint', 'قيود'],
} as const satisfies Record<Exclude<keyof PromptClientContext, 'name' | 'notes'>, readonly string[]>;

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAliasText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, '')
    .replace(/\u0640/gu, '')
    .replace(/[\s_-]+/gu, ' ')
    .trim();
}

function fieldOverridesClientValue(
  fields: readonly PromptFieldValue[],
  aliases: readonly string[],
): boolean {
  const normalizedAliases = aliases.map(normalizeAliasText);
  return fields.some((field) => {
    if (!field.value.trim() || isAttachmentRequirement(field.sourceFragment)) return false;
    const searchable = normalizeAliasText(`${field.label} ${field.sourceFragment}`);
    return normalizedAliases.some((alias) => searchable.includes(alias));
  });
}

function clientContextLines(
  client: PromptClientContext | undefined,
  language: PromptLanguage,
  fields: readonly PromptFieldValue[],
): string[] {
  if (!client) return [];
  const labels = copy[language].clientLabels;
  const lines: string[] = [];

  const name = clean(client.name);
  if (name) lines.push(`- ${labels.name}: ${name}`);

  const businessDescription = clean(client.businessDescription);
  if (businessDescription && !fieldOverridesClientValue(fields, CLIENT_OVERRIDE_ALIASES.businessDescription)) {
    lines.push(`- ${labels.businessDescription}: ${businessDescription}`);
  }

  const brandColors = clean(client.brandColors);
  if (brandColors && !fieldOverridesClientValue(fields, CLIENT_OVERRIDE_ALIASES.brandColors)) {
    lines.push(`- ${labels.brandColors}: ${brandColors}`);
  }

  const tone = clean(client.tone);
  if (tone && !fieldOverridesClientValue(fields, CLIENT_OVERRIDE_ALIASES.tone)) {
    lines.push(`- ${labels.tone}: ${tone}`);
  }

  const constraints = clean(client.constraints);
  if (constraints && !fieldOverridesClientValue(fields, CLIENT_OVERRIDE_ALIASES.constraints)) {
    lines.push(`- ${labels.constraints}: ${constraints}`);
  }

  const clientNotes = clean(client.notes);
  if (clientNotes) lines.push(`- ${labels.notes}: ${clientNotes}`);

  return lines;
}

function normalizeBoolean(value: string, language: PromptLanguage): string {
  const normalized = value.trim().toLocaleLowerCase('en-US');
  if (['yes', 'true', '1', 'نعم'].includes(normalized)) return copy[language].yes;
  if (['no', 'false', '0', 'لا'].includes(normalized)) return copy[language].no;
  return value.trim();
}

export function isAttachmentRequirement(sourceFragment: string): boolean {
  return ATTACHMENT_REQUIREMENT.test(sourceFragment);
}

function attachmentReminder(field: PromptFieldDescriptor, language: PromptLanguage): string {
  return language === 'ar'
    ? `أرفق «${field.label}» في أداة الذكاء الاصطناعي المستهدفة قبل إرسال هذا النص.`
    : `Attach “${field.label}” in your target AI tool before sending this prompt.`;
}

export function assemblePrompt({ record, language, fields, notes = '', client }: AssemblePromptOptions): AssembledPrompt {
  const labels = copy[language];
  const lines: string[] = [
    `${labels.shortcut}: ${record.shortcut}`,
    `${labels.intent}: ${clean(record.functionText) || clean(record.name)}`,
  ];

  const clientLines = clientContextLines(client, language, fields);
  if (clientLines.length > 0) {
    lines.push('', `${labels.clientContext}:`, ...clientLines);
  }

  const inputLines = fields
    .filter((field) => !isAttachmentRequirement(field.sourceFragment))
    .map((field) => ({
      field,
      value: field.kind === 'boolean'
        ? normalizeBoolean(field.value, language)
        : field.value.trim(),
    }))
    .filter(({ value }) => value)
    .map(({ field, value }) => `- ${field.label}: ${value}`);

  if (inputLines.length > 0) {
    lines.push('', `${labels.inputs}:`, ...inputLines);
  }

  const execution = clean(record.executionInstructions);
  if (execution) lines.push('', `${labels.execution}:`, execution);

  const outputs = clean(record.outputs);
  if (outputs) lines.push('', `${labels.outputs}:`, outputs);

  const constraintLines = CONSTRAINT_FIELDS
    .map((field) => ({ field, value: clean(record[field]) }))
    .filter(({ value }) => value)
    .map(({ field, value }) => `- ${labels.constraintLabels[field]}: ${value}`);
  if (constraintLines.length > 0) {
    lines.push('', `${labels.constraints}:`, ...constraintLines);
  }

  const normalizedNotes = notes.trim();
  if (normalizedNotes) lines.push('', `${labels.notes}:`, normalizedNotes);

  lines.push('', `${labels.outputLanguage}: ${labels.languageName}`);
  lines.push('', `${labels.finalQuality}:`, labels.finalQualityText);

  const attachmentReminders = fields
    .filter((field) => isAttachmentRequirement(field.sourceFragment))
    .map((field) => attachmentReminder(field, language));

  if (attachmentReminders.length > 0) {
    lines.push('', `${labels.attachments}:`, ...attachmentReminders.map((reminder) => `- ${reminder}`));
  }

  return {
    text: lines.join('\n').trim(),
    attachmentReminders,
  };
}
