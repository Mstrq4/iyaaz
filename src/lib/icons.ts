export const IYAAZ_ICON_NAMES = [
  'search', 'copy', 'check', 'filter', 'sort', 'library', 'category', 'master',
  'prompt', 'favorite', 'history', 'clients', 'statistics', 'docs', 'theme',
  'language', 'menu', 'close', 'chevron', 'arrow', 'info', 'warning', 'privacy',
  'trash', 'export', 'external', 'clear', 'sun', 'moon', 'home', 'grid', 'list',
] as const;

export type IyaazIconName = (typeof IYAAZ_ICON_NAMES)[number];

const DIRECTIONAL_ICONS = new Set<IyaazIconName>(['chevron', 'arrow']);

export function isDirectionalIcon(name: IyaazIconName): boolean {
  return DIRECTIONAL_ICONS.has(name);
}
