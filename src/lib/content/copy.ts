import type { Locale } from '../i18n.ts';

export interface WorkflowStepCopy {
  title: string;
  description: string;
}

export interface LandingContentCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  primaryCta: string;
  secondaryCta: string;
  catalogHeading: string;
  catalogDescription: string;
  workflowHeading: string;
  workflowDescription: string;
  workflowSteps: WorkflowStepCopy[];
  privacyHeading: string;
  privacyBody: string;
}

export interface DocumentationSectionCopy {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface DocumentationContentCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  onThisPage: string;
  sections: DocumentationSectionCopy[];
}

export interface StatisticsContentCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  totalsHeading: string;
  records: string;
  domains: string;
  categories: string;
  subcategories: string;
  shortcutTypesHeading: string;
  shortcutTypesDescription: string;
  domainsHeading: string;
  domainsDescription: string;
  typeLabel: string;
  domainLabel: string;
  countLabel: string;
  categoryCountLabel: string;
  categoryBreakdownHeading: string;
}

export interface ContentCopy {
  landing: LandingContentCopy;
  docs: DocumentationContentCopy;
  statistics: StatisticsContentCopy;
}

export const contentCopy: Record<Locale, ContentCopy> = {
  ar: {
    landing: {
      eyebrow: 'IYAAZ · إيعاز',
      heading: 'حوّل الاختصار إلى إيعاز جاهز',
      lead: 'إيعاز مكتبة منظّمة لاختصارات الدعاية والتصميم. ابحث عن الاختصار المناسب، أكمل مدخلاته، ثم أنشئ نصًا حتميًا جاهزًا للنسخ إلى الأداة التي تختارها.',
      primaryCta: 'استكشف المكتبة',
      secondaryCta: 'اقرأ التوثيق',
      catalogHeading: 'كتالوج حقيقي من المصدر المعتمد',
      catalogDescription: 'هذه الأرقام مشتقة مباشرة من Snapshot المكتبة الحالية، وليست مؤشرات استخدام أو أرقامًا تسويقية.',
      workflowHeading: 'من البحث إلى النص في أربع خطوات',
      workflowDescription: 'لا يتصل إيعاز بنموذج ذكاء اصطناعي وقت التشغيل؛ دوره تنظيم الاختصار ومدخلاته وتجهيز النص النهائي.',
      workflowSteps: [
        { title: 'ابحث', description: 'استخدم البحث والفلاتر للوصول إلى الاختصار المناسب من الكتالوج.' },
        { title: 'اضبط', description: 'افتح التفاصيل وأكمل الحقول التي يطلبها الاختصار فقط.' },
        { title: 'أنشئ', description: 'ينشئ Prompt Builder النص النهائي بصورة حتمية اعتمادًا على بيانات الاختصار ومدخلاتك.' },
        { title: 'انسخ', description: 'انسخ النص وأرفق أي صور أو شعارات مطلوبة مباشرة في الأداة المستهدفة.' },
      ],
      privacyHeading: 'مساحة العمل محلية في متصفحك',
      privacyBody: 'المفضلة والسجل وملفات العملاء تبقى في تخزين المتصفح المحلي. مسودات Prompt Builder تبقى في الجلسة. لا تُرفع ملفات العملاء أو نصوصهم إلى خادم إيعاز.',
    },
    docs: {
      eyebrow: 'دليل الاستخدام',
      heading: 'توثيق إيعاز',
      lead: 'مرجع عملي لاستخدام المكتبة وPrompt Builder ومساحة العمل المحلية دون خلط بين بيانات الكتالوج وبياناتك الخاصة.',
      onThisPage: 'أقسام التوثيق',
      sections: [
        {
          id: 'discover',
          title: 'البحث والفلاتر',
          paragraphs: ['صفحة المكتبة تستخدم حالة URL للبحث والفلاتر والترتيب والصفحة، لذلك يمكنك مشاركة رابط البحث نفسه أو الرجوع إليه من سجل المتصفح.'],
          bullets: ['ابحث بالاختصار أو الاسم أو المجال أو وصف الاستخدام.', 'صفِّ حسب المجال ثم الفئة ثم الفئة الفرعية والنوع.', 'يتغير ترتيب النتائج إلى الصلة عند وجود استعلام بحث، ويمكنك اختيار ترتيبات أخرى يدويًا.'],
        },
        {
          id: 'detail',
          title: 'صفحة تفاصيل الاختصار',
          paragraphs: ['تعرض صفحة التفاصيل الحقول العامة غير الفارغة فقط، مثل الوظيفة والمدخلات المطلوبة وتعليمات التنفيذ والمخرجات والخامات والإضاءة والالتزام بالهوية.'],
        },
        {
          id: 'builder',
          title: 'Prompt Builder ولغة المخرجات',
          paragraphs: ['يحوّل Prompt Builder المدخلات المطلوبة إلى حقول مناسبة ثم يجمع النص محليًا وبصورة حتمية. لغة واجهة الموقع ولغة النص النهائي مستقلتان؛ يمكن تصفح الواجهة بالعربية وإنشاء النص بالإنجليزية أو العكس.'],
        },
        {
          id: 'attachments',
          title: 'المرفقات: تذكير فقط، بلا رفع',
          paragraphs: ['إذا احتاج الاختصار صورة أو شعارًا أو مرجعًا بصريًا، يعرض إيعاز تذكيرًا بالمرفق المطلوب. لا يوجد حقل رفع ملفات داخل المنصة؛ أرفق الأصل مباشرة في الأداة التي سترسل إليها النص.'],
        },
        {
          id: 'favorites-history',
          title: 'المفضلة والسجل',
          paragraphs: ['يمكن حفظ الاختصارات في المفضلة ومراجعة سجل الفتحات من هذا المتصفح. التخزين يحتفظ بمعرّفات الاختصارات فقط ثم يحلها مقابل المكتبة الأصلية عند العرض.'],
        },
        {
          id: 'clients',
          title: 'ملفات العملاء',
          paragraphs: ['يمكنك إنشاء ملفات عملاء محلية تحتوي اسم العميل ونبذة النشاط وألوان الهوية والنبرة والقيود والملاحظات، ثم اختيار أحدها داخل Prompt Builder لإضافة سياق متكرر للنص النهائي.'],
        },
        {
          id: 'privacy',
          title: 'الخصوصية والتخزين المحلي',
          paragraphs: ['المفضلة والسجل وملفات العملاء محفوظة في localStorage داخل هذا المتصفح، بينما مسودات Prompt Builder محفوظة في sessionStorage. لا توجد قاعدة بيانات مستخدمين ولا مزامنة سحابية لهذه البيانات في المرحلة الحالية.'],
        },
        {
          id: 'translations',
          title: 'حالة الترجمة الإنجليزية الحالية',
          paragraphs: ['السجل العربي المعتمد هو المصدر canonical للمكتبة. إذا لم تتوفر ترجمة إنجليزية كاملة لسجل ما، يعرض إيعاز المحتوى العربي المعتمد بدل خلط ترجمة جزئية وغير موثوقة.'],
        },
      ],
    },
    statistics: {
      eyebrow: 'بيانات الكتالوج',
      heading: 'إحصاءات المكتبة',
      lead: 'إحصاءات مشتقة وقت العرض من Snapshot المكتبة المنقّح نفسه. لا تتضمن مستخدمين أو نشاطًا أو نموًا أو أي KPI غير موجود في المصدر.',
      totalsHeading: 'الإجماليات',
      records: 'الاختصارات',
      domains: 'المجالات',
      categories: 'الفئات',
      subcategories: 'الفئات الفرعية',
      shortcutTypesHeading: 'توزيع أنواع الاختصارات',
      shortcutTypesDescription: 'مجموع الأنواع يساوي عدد سجلات المكتبة الحالية بالكامل.',
      domainsHeading: 'توزيع المجالات',
      domainsDescription: 'مرتبة حسب عدد السجلات تنازليًا، ثم الاسم العربي عند التعادل.',
      typeLabel: 'النوع',
      domainLabel: 'المجال',
      countLabel: 'عدد السجلات',
      categoryCountLabel: 'عدد الفئات',
      categoryBreakdownHeading: 'تفصيل الفئات داخل كل مجال',
    },
  },
  en: {
    landing: {
      eyebrow: 'IYAAZ · إيعاز',
      heading: 'Turn a shortcut into a copy-ready prompt',
      lead: 'IYAAZ is a structured advertising and design shortcut library. Find the right shortcut, complete its inputs, then generate a deterministic prompt you can copy into the tool of your choice.',
      primaryCta: 'Explore the library',
      secondaryCta: 'Read the documentation',
      catalogHeading: 'A real catalog derived from the approved source',
      catalogDescription: 'These totals come directly from the current library snapshot. They are not usage analytics or marketing claims.',
      workflowHeading: 'From discovery to prompt in four steps',
      workflowDescription: 'IYAAZ does not call an AI model at runtime. It structures the shortcut, your inputs, and the final copy-ready prompt.',
      workflowSteps: [
        { title: 'Find', description: 'Search and filter the catalog until you reach the shortcut that matches the task.' },
        { title: 'Configure', description: 'Open the detail page and complete only the inputs required by that shortcut.' },
        { title: 'Generate', description: 'Prompt Builder assembles a deterministic prompt from the canonical record and your inputs.' },
        { title: 'Copy', description: 'Copy the prompt and attach any required images or logos in the target tool itself.' },
      ],
      privacyHeading: 'Your workspace stays in this browser',
      privacyBody: 'Favorites, history, and client profiles stay in browser-local storage. Prompt Builder drafts stay in the session. IYAAZ does not upload client files or prompt content to its server.',
    },
    docs: {
      eyebrow: 'Product guide',
      heading: 'IYAAZ documentation',
      lead: 'A practical reference for the library, Prompt Builder, and browser-local workspace, with a clear boundary between catalog data and your private working data.',
      onThisPage: 'Documentation sections',
      sections: [
        {
          id: 'discover',
          title: 'Search, filters, and sorting',
          paragraphs: ['The library keeps search, filters, sort, and page state in the URL, so a catalog view can be shared or restored through normal browser navigation.'],
          bullets: ['Search by shortcut, name, domain, or use-case text.', 'Filter by domain, category, subcategory, and shortcut type.', 'Searches default to relevance; explicit sort options remain available.'],
        },
        {
          id: 'detail',
          title: 'Shortcut detail fields',
          paragraphs: ['The detail page renders only non-empty public fields such as purpose, required inputs, execution instructions, outputs, materials, lighting, visual direction, and brand compliance.'],
        },
        {
          id: 'builder',
          title: 'Prompt Builder and output language',
          paragraphs: ['Prompt Builder maps required inputs to appropriate controls and assembles the result locally and deterministically. Interface language and prompt output language are independent, so an Arabic UI can generate an English-framed prompt and vice versa.'],
        },
        {
          id: 'attachments',
          title: 'Attachment reminders, not uploads',
          paragraphs: ['When a shortcut needs an image, logo, or visual reference, IYAAZ shows an attachment reminder. There is no file upload control in the platform; attach the asset directly in the target tool when you use the prompt.'],
        },
        {
          id: 'favorites-history',
          title: 'Favorites and history',
          paragraphs: ['Favorites and opening history are stored in this browser. The workspace keeps shortcut IDs rather than copying the full catalog, then resolves those IDs against the canonical library when displayed.'],
        },
        {
          id: 'clients',
          title: 'Client profiles',
          paragraphs: ['Local client profiles can store a client name, business description, brand colors, tone, constraints, and notes. Select one in Prompt Builder to reuse that context in the generated prompt.'],
        },
        {
          id: 'privacy',
          title: 'Browser-local privacy',
          paragraphs: ['Favorites, history, and client profiles use localStorage in this browser. Prompt Builder drafts use sessionStorage. The current product has no user database or cloud sync for this workspace data.'],
        },
        {
          id: 'translations',
          title: 'Current English translation fallback',
          paragraphs: ['The approved Arabic record is the canonical Arabic source for the catalog. When a complete English translation is unavailable for a record, IYAAZ falls back to that canonical Arabic content rather than silently mixing partial translations.'],
        },
      ],
    },
    statistics: {
      eyebrow: 'Catalog data',
      heading: 'Library statistics',
      lead: 'Statistics derived at render time from the same sanitized library snapshot. They do not include users, activity, growth, or business KPIs that are absent from the source.',
      totalsHeading: 'Catalog totals',
      records: 'Shortcuts',
      domains: 'Domains',
      categories: 'Categories',
      subcategories: 'Subcategories',
      shortcutTypesHeading: 'Shortcut type distribution',
      shortcutTypesDescription: 'The type counts sum to the complete current catalog.',
      domainsHeading: 'Domain distribution',
      domainsDescription: 'Sorted by record count descending, then Arabic source name when counts tie.',
      typeLabel: 'Type',
      domainLabel: 'Domain',
      countLabel: 'Records',
      categoryCountLabel: 'Categories',
      categoryBreakdownHeading: 'Category breakdown by domain',
    },
  },
};
