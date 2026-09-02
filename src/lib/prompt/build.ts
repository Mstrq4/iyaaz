import type { LocalizedLibraryRecord } from '../library/types';
import type { PromptFieldDefinition } from './schema';

export type PromptOutputLanguage = 'ar' | 'en';
export type PromptTone = '' | 'professional' | 'concise' | 'expressive';

export interface BuildPromptOptions {
  record: LocalizedLibraryRecord;
  fields: readonly PromptFieldDefinition[];
  values: Readonly<Record<string, string>>;
  outputLanguage: PromptOutputLanguage;
  tone: PromptTone;
}

const CONSTRAINT_FIELDS = [
  'outputs',
  'sizeRatio',
  'materialsTech',
  'lighting',
  'installationExecution',
  'visualStyle',
  'brandCompliance',
  'combinedShortcuts',
  'bestUse',
  'keywords',
  'assetType',
  'notes',
] as const satisfies readonly (keyof LocalizedLibraryRecord)[];

const labels = {
  ar: {
    shortcut: 'الاختصار',
    intent: 'الهدف',
    inputs: 'المدخلات',
    execution: 'تعليمات التنفيذ',
    constraints: 'المخرجات والقيود',
    outputLanguage: 'لغة المخرجات',
    languageName: 'العربية',
    tone: 'النبرة',
    attachments: 'تذكيرات المرفقات',
    constraintLabels: {
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
    },
    tones: {
      professional: 'احترافية',
      concise: 'موجزة',
      expressive: 'تعبيرية',
    },
  },
  en: {
    shortcut: 'Shortcut',
    intent: 'Intent',
    inputs: 'Inputs',
    execution: 'Execution instructions',
    constraints: 'Outputs and constraints',
    outputLanguage: 'Output language',
    languageName: 'English',
    tone: 'Tone',
    attachments: 'Attachment reminders',
    constraintLabels: {
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
    },
    tones: {
      professional: 'Professional',
      concise: 'Concise',
      expressive: 'Expressive',
    },
  },
} as const;

function nonEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildPrompt(options: BuildPromptOptions): string {
  const { record, fields, values, outputLanguage, tone } = options;
  const copy = labels[outputLanguage];
  const lines: string[] = [
    `${copy.shortcut}: ${record.shortcut}`,
    `${copy.intent}: ${nonEmpty(record.functionText) || nonEmpty(record.name)}`,
    '',
    `${copy.inputs}:`,
  ];

  for (const field of fields) {
    if (field.type === 'asset-reference') continue;
    const value = nonEmpty(values[field.id]);
    if (value) lines.push(`- ${field.label}: ${value}`);
  }

  const execution = nonEmpty(record.executionInstructions);
  if (execution) {
    lines.push('', `${copy.execution}:`, execution);
  }

  const constraints = CONSTRAINT_FIELDS
    .map((field) => ({ field, value: nonEmpty(record[field]) }))
    .filter(({ value }) => value);
  if (constraints.length > 0) {
    lines.push('', `${copy.constraints}:`);
    for (const { field, value } of constraints) {
      lines.push(`- ${copy.constraintLabels[field]}: ${value}`);
    }
  }

  lines.push('', `${copy.outputLanguage}: ${copy.languageName}`);

  if (tone) {
    lines.push(`${copy.tone}: ${copy.tones[tone]}`);
  }

  const assetFields = fields.filter((field) => field.type === 'asset-reference');
  if (assetFields.length > 0) {
    lines.push('', `${copy.attachments}:`);
    for (const field of assetFields) lines.push(`- ${field.label}`);
  }

  return lines.join('\n').trim();
}
