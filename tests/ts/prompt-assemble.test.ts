import assert from 'node:assert/strict';
import test from 'node:test';

import { assemblePrompt } from '../../src/lib/prompt/assemble.ts';
import type { LocalizedLibraryRecord } from '../../src/lib/library/types.ts';

type Field = {
  id: string;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  sourceFragment: string;
  value: string;
};

function record(locale: 'ar' | 'en'): LocalizedLibraryRecord {
  return {
    id: 3,
    shortcut: '/ACPStorefrontLuxury',
    name: locale === 'ar' ? 'واجهة متجر فاخرة' : 'Luxury storefront',
    mainDomain: locale === 'ar' ? 'التصميم' : 'Design',
    category: locale === 'ar' ? 'واجهات' : 'Storefronts',
    subcategory: locale === 'ar' ? 'كلادينج' : 'Cladding',
    shortcutType: locale === 'ar' ? 'متخصص' : 'Specialized',
    functionText: locale === 'ar' ? 'إنشاء تصور فاخر للواجهة.' : 'Create a premium storefront concept.',
    requiredInputs: locale === 'ar' ? 'صورة الواجهة، الشعار، النصوص.' : 'Storefront image, logo, copy.',
    executionInstructions: locale === 'ar' ? 'احترم القياسات والفتحات.' : 'Respect dimensions and openings.',
    outputs: locale === 'ar' ? 'تصور واجهة قابل للعرض.' : 'Client-ready storefront concept.',
    sizeRatio: '16:9',
    materialsTech: locale === 'ar' ? 'ألمنيوم مركب' : 'Composite aluminum',
    lighting: locale === 'ar' ? 'إضاءة هادئة' : 'Controlled lighting',
    installationExecution: '',
    visualStyle: locale === 'ar' ? 'فاخر ومحدود التفاصيل' : 'Premium and restrained',
    brandCompliance: locale === 'ar' ? 'احترم ألوان الهوية' : 'Respect brand colors',
    combinedShortcuts: '',
    bestUse: '',
    keywords: '',
    assetType: '',
    notes: '',
    locale,
    translationStatus: locale === 'ar' ? 'canonical' : 'translated',
  };
}

const fields: Field[] = [
  { id: 'store-name', label: 'Store name', kind: 'text', required: true, sourceFragment: 'Store name', value: 'Prime Mobile' },
  { id: 'logo', label: 'Logo', kind: 'text', required: true, sourceFragment: 'Attach logo reference', value: '' },
  { id: 'include-night', label: 'Night view', kind: 'boolean', required: true, sourceFragment: 'Night view yes/no', value: 'yes' },
  { id: 'empty', label: 'Optional empty', kind: 'text', required: false, sourceFragment: 'Optional empty', value: '' },
];

test('assembles deterministic sections in source-field order and omits empty user fields', () => {
  const first = assemblePrompt({ record: record('en'), language: 'en', fields, notes: '' });
  const second = assemblePrompt({ record: record('en'), language: 'en', fields, notes: '' });

  assert.deepEqual(second, first);
  assert.match(first.text, /^Shortcut: \/ACPStorefrontLuxury/m);
  assert.match(first.text, /Intent: Create a premium storefront concept\./);
  assert.match(first.text, /- Store name: Prime Mobile/);
  assert.match(first.text, /- Night view: Yes/);
  assert.doesNotMatch(first.text, /Optional empty/);
  assert.ok(first.text.indexOf('Execution instructions:') < first.text.indexOf('Expected outputs:'));
  assert.match(first.text, /Final quality instruction:/);
});

test('selected language controls prompt framing independently from any UI locale concept', () => {
  const ar = assemblePrompt({ record: record('ar'), language: 'ar', fields, notes: '' });
  const en = assemblePrompt({ record: record('en'), language: 'en', fields, notes: '' });

  assert.match(ar.text, /لغة المخرجات: العربية/);
  assert.match(ar.text, /الاختصار: \/ACPStorefrontLuxury/);
  assert.match(en.text, /Output language: English/);
  assert.match(en.text, /Shortcut: \/ACPStorefrontLuxury/);
});

test('free notes are optional and appear only when non-empty', () => {
  const withoutNotes = assemblePrompt({ record: record('en'), language: 'en', fields, notes: '   ' });
  const withNotes = assemblePrompt({ record: record('en'), language: 'en', fields, notes: 'Keep signage legible from the street.' });

  assert.doesNotMatch(withoutNotes.text, /Additional notes:/);
  assert.match(withNotes.text, /Additional notes:\nKeep signage legible from the street\./);
});

test('asset source fragments become attachment reminders without claiming an upload occurred', () => {
  const result = assemblePrompt({ record: record('en'), language: 'en', fields, notes: '' });

  assert.equal(result.attachmentReminders.length, 1);
  assert.match(result.attachmentReminders[0]!, /logo/i);
  assert.match(result.text, /Attachment reminders:/);
  assert.doesNotMatch(result.text, /uploaded|تم الرفع/i);
});

test('client context is inserted before project inputs and omits empty profile fields', () => {
  const result = assemblePrompt({
    record: record('en'),
    language: 'en',
    fields,
    client: {
      name: 'Prime Mobile',
      businessDescription: 'Smartphones and accessories retailer',
      brandColors: '#000000, #D3B316',
      tone: '',
      constraints: 'No decorative clutter',
      notes: '',
    },
  });

  assert.match(result.text, /Client context:/);
  assert.match(result.text, /- Client: Prime Mobile/);
  assert.match(result.text, /- Business: Smartphones and accessories retailer/);
  assert.match(result.text, /- Brand colors: #000000, #D3B316/);
  assert.match(result.text, /- Constraints: No decorative clutter/);
  assert.doesNotMatch(result.text, /- Tone:/);
  assert.ok(result.text.indexOf('Client context:') < result.text.indexOf('Project inputs:'));
});

test('explicit prompt fields override generic matching client context aliases deterministically', () => {
  const overrideFields: Field[] = [
    ...fields,
    { id: 'palette', label: 'Brand palette', kind: 'text', required: false, sourceFragment: 'brand color', value: 'Blue and white' },
    { id: 'tone', label: 'Tone', kind: 'text', required: false, sourceFragment: 'tone', value: 'Premium' },
  ];
  const result = assemblePrompt({
    record: record('en'),
    language: 'en',
    fields: overrideFields,
    client: {
      name: 'Prime Mobile',
      businessDescription: '',
      brandColors: '#000000, #D3B316',
      tone: 'Friendly',
      constraints: '',
      notes: '',
    },
  });

  assert.match(result.text, /- Client: Prime Mobile/);
  assert.doesNotMatch(result.text, /- Brand colors: #000000, #D3B316/);
  assert.doesNotMatch(result.text, /- Tone: Friendly/);
  assert.match(result.text, /- Brand palette: Blue and white/);
  assert.match(result.text, /- Tone: Premium/);
});

test('Arabic client context uses localized labels and Arabic aliases suppress generic lines', () => {
  const arabicFields: Field[] = [
    { id: 'activity', label: 'نبذة النشاط', kind: 'text', required: false, sourceFragment: 'نبذة عن النشاط', value: 'متجر هواتف ذكية' },
  ];
  const result = assemblePrompt({
    record: record('ar'),
    language: 'ar',
    fields: arabicFields,
    client: {
      name: 'برايم موبايل',
      businessDescription: 'متجر إلكترونيات',
      brandColors: '#000000',
      tone: 'فاخر',
      constraints: '',
      notes: '',
    },
  });

  assert.match(result.text, /سياق العميل:/);
  assert.match(result.text, /- العميل: برايم موبايل/);
  assert.doesNotMatch(result.text, /- نبذة النشاط: متجر إلكترونيات/);
  assert.match(result.text, /- ألوان الهوية: #000000/);
  assert.match(result.text, /- النبرة: فاخر/);
});

test('omitting client preserves existing prompt output exactly', () => {
  const baseline = assemblePrompt({ record: record('en'), language: 'en', fields, notes: '' });
  const explicitUndefined = assemblePrompt({ record: record('en'), language: 'en', fields, notes: '', client: undefined });
  assert.deepEqual(explicitUndefined, baseline);
});
