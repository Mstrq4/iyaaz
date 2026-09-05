export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'iyaaz:theme';

export const THEME_BOOTSTRAP_SCRIPT = `try {
  const stored = localStorage.getItem('iyaaz:theme');
  const valid = stored === 'light' || stored === 'dark' ? stored : null;
  const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = valid || system;
} catch {
  document.documentElement.dataset.theme = 'light';
}`;

export function parseTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

export function resolveTheme(stored: unknown, prefersDark: boolean): Theme {
  return parseTheme(stored) ?? (prefersDark ? 'dark' : 'light');
}

export function nextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
