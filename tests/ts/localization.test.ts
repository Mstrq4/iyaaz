import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const modulePath = path.join(process.cwd(), 'src/lib/library/localization.ts');

const record = {
  id: 3,
  shortcut: '/ACPStorefrontLuxury',
  nameAr: 'واجهة كلادينج فاخرة',
  mainDomain: 'الدعاية والإعلان',
  category: 'واجهات المحلات',
  subcategory: 'واجهات كلادينج',
  shortcutType: 'متخصص',
  functionText: 'تصميم واجهة متجر',
  requiredInputs: 'اسم المتجر؛ الألوان؛ الشعار',
  executionInstructions: 'أنشئ واجهة فاخرة',
  outputs: 'تصميم نهائي',
  sizeRatio: '16:9',
  materialsTech: 'كلادينج',
  lighting: 'إضاءة ليلية',
  installationExecution: 'تنفيذ واقعي',
  visualStyle: 'فاخر',
  brandCompliance: 'التزم بالهوية',
  combinedShortcuts: '/A + /B',
  bestUse: 'المتاجر',
  keywords: 'واجهة، متجر',
  assetType: 'صورة',
  notes: 'ملاحظة',
};

const overlay = {
  id: 3,
  shortcut: '/ACPStorefrontLuxury',
  nameAr: 'Luxury cladding storefront',
  mainDomain: 'Advertising',
  category: 'Storefronts',
  subcategory: 'Cladding storefronts',
  shortcutType: 'Specialized',
  functionText: 'Design a storefront',
  requiredInputs: 'Store name; colors; logo',
  executionInstructions: 'Create a premium storefront',
  outputs: 'Final design',
  materialsTech: 'Cladding',
  lighting: 'Night lighting',
  installationExecution: 'Realistic execution',
  visualStyle: 'Premium',
  brandCompliance: 'Follow the brand identity',
  bestUse: 'Retail stores',
  keywords: 'storefront, retail',
  assetType: 'Image',
  notes: 'Note',
};

async function loadModule() {
  assert.ok(existsSync(modulePath), 'src/lib/library/localization.ts must exist for Phase 5A');
  return import(pathToFileURL(modulePath).href);
}

test('Arabic localization is canonical and exposes a stable display name', async () => {
  const { localizeLibraryRecord } = await loadModule();
  const localized = localizeLibraryRecord(record, overlay, 'ar');
  assert.equal(localized.locale, 'ar');
  assert.equal(localized.translationStatus, 'canonical');
  assert.equal(localized.name, record.nameAr);
  assert.equal(localized.functionText, record.functionText);
  assert.equal(localized.sizeRatio, '16:9');
  assert.equal(localized.combinedShortcuts, '/A + /B');
});

test('complete English overlay localizes translatable fields and preserves structural values', async () => {
  const { localizeLibraryRecord } = await loadModule();
  const localized = localizeLibraryRecord(record, overlay, 'en');
  assert.equal(localized.locale, 'en');
  assert.equal(localized.translationStatus, 'translated');
  assert.equal(localized.name, 'Luxury cladding storefront');
  assert.equal(localized.mainDomain, 'Advertising');
  assert.equal(localized.functionText, 'Design a storefront');
  assert.equal(localized.sizeRatio, '16:9');
  assert.equal(localized.combinedShortcuts, '/A + /B');
  assert.equal(localized.shortcut, '/ACPStorefrontLuxury');
});

test('missing or incomplete English overlay falls back to the whole canonical record without silent language mixing', async () => {
  const { localizeLibraryRecord } = await loadModule();
  const missing = localizeLibraryRecord(record, undefined, 'en');
  const partial = localizeLibraryRecord(record, { ...overlay, functionText: '' }, 'en');

  for (const localized of [missing, partial]) {
    assert.equal(localized.translationStatus, 'missing');
    assert.equal(localized.name, record.nameAr);
    assert.equal(localized.mainDomain, record.mainDomain);
    assert.equal(localized.functionText, record.functionText);
  }
});

test('localization never mutates the canonical source record', async () => {
  const { localizeLibraryRecord } = await loadModule();
  const before = structuredClone(record);
  localizeLibraryRecord(record, overlay, 'en');
  assert.deepEqual(record, before);
});
