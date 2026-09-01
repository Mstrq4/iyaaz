export interface LibraryRecord {
  id: number;
  shortcut: string;
  nameAr: string;
  mainDomain: string;
  category: string;
  subcategory: string;
  shortcutType: string;
  functionText: string;
  requiredInputs: string;
  executionInstructions: string;
  outputs: string;
  sizeRatio: string;
  materialsTech: string;
  lighting: string;
  installationExecution: string;
  visualStyle: string;
  brandCompliance: string;
  combinedShortcuts: string;
  bestUse: string;
  keywords: string;
  assetType: string;
  notes: string;
}

export type LibraryRecordKey = keyof LibraryRecord;

export const PUBLIC_LIBRARY_FIELDS = [
  'id',
  'shortcut',
  'nameAr',
  'mainDomain',
  'category',
  'subcategory',
  'shortcutType',
  'functionText',
  'requiredInputs',
  'executionInstructions',
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
] as const satisfies readonly LibraryRecordKey[];
