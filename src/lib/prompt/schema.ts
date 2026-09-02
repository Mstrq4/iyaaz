export type PromptFieldType = 'text' | 'textarea' | 'select' | 'number' | 'asset-reference';

export interface PromptFieldDefinition {
  id: string;
  label: string;
  type: PromptFieldType;
  required: boolean;
  source: string;
  options?: string[];
}

export interface PromptSchema {
  fields: PromptFieldDefinition[];
  fallback: boolean;
}

const TEXT_HINTS = /^(?:text|short text|string|نص|نص قصير)$/iu;
const TEXTAREA_HINTS = /^(?:textarea|long text|multiline|description|brief|context|نص طويل|متعدد الأسطر|وصف|نبذة|سياق)$/iu;
const NUMBER_HINTS = /^(?:number|numeric|count|quantity|integer|رقم|عدد|كمية)$/iu;
const ASSET_HINTS = /(?:asset|attachment|attached|upload|file|logo|image|reference|brand identity|مرفق|إرفاق|ملف|شعار|صورة|مرجع|هوية)/iu;
const BULLET_PREFIX = /^\s*(?:(?:[-*•–—])\s+|(?:\d+|[٠-٩]+)[.)-]\s*)/u;
const LABEL_SEPARATOR = /\s*[:：]\s*/u;
const EXPLICIT_SELECT = /[\[(]([^\])]+)[\])]/u;

function normalizeSegment(value: string): string {
  return value.replace(BULLET_PREFIX, '').replace(/\s+/gu, ' ').trim();
}

function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return slug || 'field';
}

function uniqueId(base: string, seen: Map<string, number>): string {
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

function parseSelectOptions(value: string): string[] | undefined {
  const match = value.match(EXPLICIT_SELECT);
  if (!match?.[1]) return undefined;

  const separator = match[1].includes('|')
    ? /\s*\|\s*/u
    : /\s*[,،]\s*/u;
  const options = match[1]
    .split(separator)
    .map((option) => option.trim())
    .filter(Boolean);

  if (options.length < 2 || options.some((option) => option.length > 48)) return undefined;
  return [...new Set(options)];
}

function inferExplicitType(label: string, hint: string, source: string): Pick<PromptFieldDefinition, 'type' | 'options'> | undefined {
  const options = parseSelectOptions(hint || source);
  if (options) return { type: 'select', options };

  const normalizedHint = hint.trim();
  if (TEXT_HINTS.test(normalizedHint)) return { type: 'text' };
  if (TEXTAREA_HINTS.test(normalizedHint)) return { type: 'textarea' };
  if (NUMBER_HINTS.test(normalizedHint)) return { type: 'number' };
  if (ASSET_HINTS.test(normalizedHint) || (normalizedHint && ASSET_HINTS.test(label))) {
    return { type: 'asset-reference' };
  }

  return undefined;
}

function fallbackSchema(source: string): PromptSchema {
  return {
    fallback: true,
    fields: [{
      id: 'required-inputs',
      label: 'Required inputs',
      type: 'textarea',
      required: true,
      source,
    }],
  };
}

export function parseRequiredInputs(requiredInputs: string): PromptSchema {
  const source = requiredInputs.trim();
  if (!source) return { fields: [], fallback: false };

  const rawSegments = source
    .split(/\r?\n|[؛;]+/u)
    .map(normalizeSegment)
    .filter(Boolean);

  if (rawSegments.length === 0) return { fields: [], fallback: false };

  const seen = new Map<string, number>();
  const fields: PromptFieldDefinition[] = [];

  for (const segment of rawSegments) {
    const separatorMatch = segment.match(LABEL_SEPARATOR);
    let label = segment;
    let hint = '';

    if (separatorMatch?.index !== undefined) {
      label = segment.slice(0, separatorMatch.index).trim();
      hint = segment.slice(separatorMatch.index + separatorMatch[0].length).trim();
      if (!label || !hint) return fallbackSchema(source);
    }

    const explicit = inferExplicitType(label, hint, segment);
    let typeInfo = explicit;

    if (!typeInfo && rawSegments.length > 1 && !hint && label.length <= 80) {
      typeInfo = ASSET_HINTS.test(label)
        ? { type: 'asset-reference' as const }
        : { type: 'text' as const };
    }

    if (!typeInfo) return fallbackSchema(source);

    const id = uniqueId(slugify(label), seen);
    fields.push({
      id,
      label,
      type: typeInfo.type,
      required: true,
      source: segment,
      ...(typeInfo.options ? { options: typeInfo.options } : {}),
    });
  }

  return { fields, fallback: false };
}
