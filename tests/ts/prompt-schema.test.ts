import assert from 'node:assert/strict';
import test from 'node:test';

import { parseRequiredInputs } from '../../src/lib/prompt/schema.ts';

test('parses explicit structured required inputs into deterministic field types and stable ids', () => {
  const schema = parseRequiredInputs([
    'Project name: text',
    'Creative brief: textarea',
    'Quantity: number',
    'Tone: [Formal | Casual | Premium]',
    'Brand logo: asset',
  ].join('\n'));

  assert.equal(schema.fallback, false);
  assert.deepEqual(schema.fields.map(({ id, type, required }) => ({ id, type, required })), [
    { id: 'project-name', type: 'text', required: true },
    { id: 'creative-brief', type: 'textarea', required: true },
    { id: 'quantity', type: 'number', required: true },
    { id: 'tone', type: 'select', required: true },
    { id: 'brand-logo', type: 'asset-reference', required: true },
  ]);
  assert.deepEqual(schema.fields[3]?.options, ['Formal', 'Casual', 'Premium']);
});

test('recognizes clear Arabic field hints without changing source labels', () => {
  const schema = parseRequiredInputs([
    'اسم المشروع: نص',
    'وصف المشروع: نص طويل',
    'عدد النسخ: رقم',
    'الأسلوب: [رسمي | ودود]',
    'الشعار: مرفق',
  ].join('؛ '));

  assert.equal(schema.fallback, false);
  assert.deepEqual(schema.fields.map(({ label, type }) => ({ label, type })), [
    { label: 'اسم المشروع', type: 'text' },
    { label: 'وصف المشروع', type: 'textarea' },
    { label: 'عدد النسخ', type: 'number' },
    { label: 'الأسلوب', type: 'select' },
    { label: 'الشعار', type: 'asset-reference' },
  ]);
});

test('falls back to one textarea when structured meaning is ambiguous instead of guessing fields', () => {
  const source = 'قدّم كل المعلومات المناسبة للمشروع بحسب السياق، مع أي تفاصيل تراها مهمة للتنفيذ.';
  const schema = parseRequiredInputs(source);

  assert.equal(schema.fallback, true);
  assert.equal(schema.fields.length, 1);
  assert.equal(schema.fields[0]?.type, 'textarea');
  assert.equal(schema.fields[0]?.source, source);
  assert.equal(schema.fields[0]?.required, true);
});

test('empty required-input text produces an empty deterministic schema', () => {
  assert.deepEqual(parseRequiredInputs('   '), { fields: [], fallback: false });
});

test('duplicate labels receive deterministic unique ids while preserving order', () => {
  const schema = parseRequiredInputs('Reference: text\nReference: text\nReference: text');
  assert.deepEqual(schema.fields.map((field) => field.id), ['reference', 'reference-2', 'reference-3']);
});
