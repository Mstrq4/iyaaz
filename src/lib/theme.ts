export type Theme = 'light' | 'dark';

export function normalizeTheme(value: string | undefined): Theme {
  return value === 'dark' ? 'dark' : 'light';
}

export function nextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
