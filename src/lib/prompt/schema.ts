export type PromptFieldKind = 'text' | 'textarea' | 'select' | 'boolean';

export interface PromptFieldDescriptor {
  id: string;
  label: string;
  kind: PromptFieldKind;
  required: boolean;
  options?: string[];
  sourceFragment: string;
}

const BULLET_PREFIX = /^\s*(?:(?:[-*•–—])\s+|(?:\d+|[٠-٩]+)[.)-]\s*)/u;
const LABEL_SEPARATOR = /\s*[:：]\s*/u;
const COMMA_SEPARATOR = /\s*[,،]\s*/u;
const TRAILING_LIST_PUNCTUATION = /[.。]+$/u;
const TEXT_HINTS = /^(?:text|short text|string|single line|نص|نص قصير|سطر واحد)$/iu;
const TEXTAREA_HINTS = /^(?:textarea|long text|multiline|description|brief|context|نص طويل|متعدد الأسطر|وصف|نبذة|سياق)$/iu;
const BOOLEAN_MARKER = /(?:\b(?:yes\s*\/\s*no|true\s*\/\s*false)\b|نعم\s*\/\s*لا)/iu;
const EXPLICIT_OPTIONS = /[\[(]([^\])]+)[\])]/u;
const NARRATIVE_PUNCTUATION = /[.!؟?]/u;

function normalizeFragment(value: string): string {
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

function parseExplicitOptions(value: string): string[] | undefined {
  const match = value.match(EXPLICIT_OPTIONS);
  if (!match?.[1]) return undefined;

  const separator = match[1].includes('|') ? /\s*\|\s*/u : COMMA_SEPARATOR;
  const options = match[1]
    .split(separator)
    .map((option) => option.trim())
    .filter(Boolean);

  if (options.length < 2 || options.some((option) => option.length > 48)) return undefined;
  return [...new Set(options)];
}

function splitConservativeCommaList(source: string): string[] | undefined {
  if (!COMMA_SEPARATOR.test(source)) return undefined;

  const parts = source
    .split(COMMA_SEPARATOR)
    .map((part, index, values) => {
      const normalized = normalizeFragment(part);
      return index === values.length - 1
        ? normalized.replace(TRAILING_LIST_PUNCTUATION, '').trim()
        : normalized;
    })
    .filter(Boolean);

  if (parts.length < 3 || parts.length > 20) return undefined;
  if (parts.some((part) => part.length > 80)) return undefined;
  if (parts.some((part) => NARRATIVE_PUNCTUATION.test(part))) return undefined;
  if (parts.some((part) => LABEL_SEPARATOR.test(part))) return undefined;
  return parts;
}

function fallbackDescriptor(source: string): PromptFieldDescriptor[] {
  return [{
    id: 'project_details',
    label: 'Project details',
    kind: 'textarea',
    required: true,
    sourceFragment: source,
  }];
}

function stripBooleanMarker(value: string): string {
  return value.replace(BOOLEAN_MARKER, '').replace(/\s+/gu, ' ').trim();
}

function inferKind(label: string, hint: string, sourceFragment: string): Pick<PromptFieldDescriptor, 'kind' | 'options'> {
  const options = parseExplicitOptions(hint || sourceFragment);
  if (options) return { kind: 'select', options };

  if (BOOLEAN_MARKER.test(sourceFragment)) return { kind: 'boolean' };

  const normalizedHint = hint.trim();
  if (TEXTAREA_HINTS.test(normalizedHint)) return { kind: 'textarea' };
  if (TEXT_HINTS.test(normalizedHint)) return { kind: 'text' };

  if (normalizedHint.length > 96 || label.length > 80 || sourceFragment.length > 140) {
    return { kind: 'textarea' };
  }

  return { kind: 'text' };
}

function looksAmbiguousNarrative(source: string): boolean {
  const words = source.split(/\s+/u).filter(Boolean);
  return source.length > 80 && words.length >= 8 && NARRATIVE_PUNCTUATION.test(source);
}

export function parseRequiredInputs(requiredInputs: string): PromptFieldDescriptor[] {
  const source = requiredInputs.trim();
  if (!source) return [];

  let fragments = source
    .split(/\r?\n|[؛;]+/u)
    .map(normalizeFragment)
    .filter(Boolean);

  if (fragments.length === 1) {
    fragments = splitConservativeCommaList(fragments[0]!) ?? fragments;
  }

  if (fragments.length === 1 && looksAmbiguousNarrative(fragments[0]!)) {
    return fallbackDescriptor(source);
  }

  const seen = new Map<string, number>();
  const fields: PromptFieldDescriptor[] = [];

  for (const fragment of fragments) {
    const separator = fragment.match(LABEL_SEPARATOR);
    let label = fragment;
    let hint = '';

    if (separator?.index !== undefined) {
      label = fragment.slice(0, separator.index).trim();
      hint = fragment.slice(separator.index + separator[0].length).trim();
      if (!label || !hint) return fallbackDescriptor(source);
    }

    if (BOOLEAN_MARKER.test(fragment)) {
      label = stripBooleanMarker(label === fragment ? fragment : label);
    }

    const inferred = inferKind(label, hint, fragment);
    const id = uniqueId(slugify(label), seen);
    fields.push({
      id,
      label,
      kind: inferred.kind,
      required: true,
      sourceFragment: fragment,
      ...(inferred.options ? { options: inferred.options } : {}),
    });
  }

  return fields;
}
