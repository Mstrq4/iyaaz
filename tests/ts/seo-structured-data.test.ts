import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectionJsonLd,
  safeJsonLd,
  shortcutJsonLd,
  websiteJsonLd,
} from '../../src/lib/seo/structured-data.ts';
import type { LocalizedLibraryRecord } from '../../src/lib/library/types.ts';

function record(): LocalizedLibraryRecord {
  return {
    id: 3,
    shortcut: '/ACPStorefrontLuxury',
    name: 'واجهة متجر فاخرة',
    mainDomain: 'التصميم',
    category: 'واجهات',
    subcategory: 'كلادينج',
    shortcutType: 'متخصص',
    functionText: 'إنشاء تصور فاخر للواجهة.',
    requiredInputs: 'صورة الواجهة، الشعار، النصوص.',
    executionInstructions: 'احترم القياسات والفتحات.',
    outputs: 'تصور واجهة قابل للعرض.',
    sizeRatio: '16:9',
    materialsTech: 'ألمنيوم مركب',
    lighting: 'إضاءة هادئة',
    installationExecution: '',
    visualStyle: 'فاخر ومحدود التفاصيل',
    brandCompliance: 'احترم ألوان الهوية',
    combinedShortcuts: '',
    bestUse: 'واجهات متاجر الهواتف',
    keywords: 'واجهة، متجر، كلادينج',
    assetType: 'تصور بصري',
    notes: '',
    locale: 'ar',
    translationStatus: 'canonical',
  };
}

test('safeJsonLd escapes script-breakout characters while preserving valid JSON data', () => {
  const serialized = safeJsonLd({ text: '</script><script>alert(1)</script> & \u2028 \u2029' });

  assert.doesNotMatch(serialized, /<\/script>|<script>|&|\u2028|\u2029/u);
  const parsed = JSON.parse(serialized);
  assert.equal(parsed.text, '</script><script>alert(1)</script> & \u2028 \u2029');
});

test('home and library structured data use canonical URLs and truthful schema types', () => {
  const siteOrigin = new URL('https://iyaaz.example');
  const website = websiteJsonLd({ siteOrigin, locale: 'ar', name: 'إيعاز' }) as Record<string, unknown>;
  const collection = collectionJsonLd({
    canonicalUrl: new URL('/ar/library', siteOrigin),
    locale: 'ar',
    name: 'مكتبة الاختصارات',
    description: 'مكتبة منظمة لاختصارات التصميم والدعاية.',
  }) as Record<string, unknown>;

  assert.equal(website['@type'], 'WebSite');
  assert.equal(website.url, 'https://iyaaz.example/ar');
  assert.equal(website.inLanguage, 'ar');
  assert.equal(collection['@type'], 'CollectionPage');
  assert.equal(collection.url, 'https://iyaaz.example/ar/library');
  assert.equal(collection.inLanguage, 'ar');
});

test('shortcut structured data emits CreativeWork plus BreadcrumbList and only sanitized public record values', () => {
  const canonicalUrl = new URL('https://iyaaz.example/ar/library/3');
  const values = shortcutJsonLd({
    canonicalUrl,
    locale: 'ar',
    record: record(),
    breadcrumbs: [
      { name: 'الرئيسية', url: new URL('https://iyaaz.example/ar') },
      { name: 'المكتبة', url: new URL('https://iyaaz.example/ar/library') },
      { name: 'واجهة متجر فاخرة', url: canonicalUrl },
    ],
  });

  assert.equal(values.length, 2);
  const [work, crumbs] = values as readonly Record<string, unknown>[];
  assert.equal(work['@type'], 'CreativeWork');
  assert.equal(work.url, canonicalUrl.toString());
  assert.equal(work.inLanguage, 'ar');
  assert.equal(crumbs['@type'], 'BreadcrumbList');

  const serialized = safeJsonLd(values);
  assert.doesNotMatch(serialized, /sourceUrl|referenceUrl|المصدر|المرجع|credential=|token=/i);
  assert.match(serialized, /ACPStorefrontLuxury/);
});
