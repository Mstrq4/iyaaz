import assert from 'node:assert/strict';
import test from 'node:test';

import { parseRequiredInputs } from '../../src/lib/prompt/schema.ts';

type Descriptor = {
  id: string;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  sourceFragment: string;
};

function descriptors(source: string): Descriptor[] {
  return parseRequiredInputs(source) as unknown as Descriptor[];
}

test('parses bullets, numbered items and semicolon requirements in stable source order', () => {
  const fields = descriptors([
    '- Project name',
    '2. Creative brief',
    'Target audience; Delivery constraints',
  ].join('\n'));

  assert.deepEqual(fields.map(({ label, kind }) => ({ label, kind })), [
    { label: 'Project name', kind: 'text' },
    { label: 'Creative brief', kind: 'text' },
    { label: 'Target audience', kind: 'text' },
    { label: 'Delivery constraints', kind: 'text' },
  ]);
  assert.ok(fields.every((field) => field.required));
});

test('recognizes explicit source options as select and explicit yes/no requirements as boolean', () => {
  const fields = descriptors([
    'Tone: [Formal | Casual | Premium]',
    'Include logo? yes/no',
    'هل توجد هوية بصرية؟ نعم/لا',
  ].join('\n'));

  assert.deepEqual(fields.map(({ label, kind }) => ({ label, kind })), [
    { label: 'Tone', kind: 'select' },
    { label: 'Include logo?', kind: 'boolean' },
    { label: 'هل توجد هوية بصرية؟', kind: 'boolean' },
  ]);
  assert.deepEqual(fields[0]?.options, ['Formal', 'Casual', 'Premium']);
});

test('uses textarea only when context is explicitly long or a fragment is long enough to need it', () => {
  const fields = descriptors([
    'Project name: text',
    'Creative brief: textarea',
    `Production context: ${'Detailed operational context '.repeat(7).trim()}`,
  ].join('\n'));

  assert.deepEqual(fields.map(({ label, kind }) => ({ label, kind })), [
    { label: 'Project name', kind: 'text' },
    { label: 'Creative brief', kind: 'textarea' },
    { label: 'Production context', kind: 'textarea' },
  ]);
});

test('parses canonical record 3 comma list conservatively without inventing upload fields', () => {
  const source = 'صورة الواجهة، العرض والارتفاع، عدد ومقاسات الفتحات، مواقع الأبواب والنوافذ، الشعار، النصوص، ألوان الهوية، نوع النشاط، قيود الموقع.';
  const fields = descriptors(source);

  assert.equal(fields.length, 9);
  assert.deepEqual(fields.map((field) => field.label), [
    'صورة الواجهة',
    'العرض والارتفاع',
    'عدد ومقاسات الفتحات',
    'مواقع الأبواب والنوافذ',
    'الشعار',
    'النصوص',
    'ألوان الهوية',
    'نوع النشاط',
    'قيود الموقع',
  ]);
  assert.ok(fields.every((field) => field.kind === 'text'));
});

test('falls back to a single project_details textarea when structured meaning is ambiguous', () => {
  const source = 'قدّم كل المعلومات المناسبة للمشروع بحسب السياق، مع أي تفاصيل تراها مهمة للتنفيذ.';
  const fields = descriptors(source);

  assert.deepEqual(fields, [{
    id: 'project_details',
    label: 'Project details',
    kind: 'textarea',
    required: true,
    sourceFragment: source,
  }]);
});

test('empty required-input text produces an empty descriptor list', () => {
  assert.deepEqual(descriptors('   '), []);
});

test('duplicate labels receive deterministic unique ids while preserving order', () => {
  const fields = descriptors('Reference: text\nReference: text\nReference: text');
  assert.deepEqual(fields.map((field) => field.id), ['reference', 'reference-2', 'reference-3']);
});
