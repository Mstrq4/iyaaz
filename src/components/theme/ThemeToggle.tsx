'use client';

import { IyaazIcon } from '@/components/icons/IyaazIcon';
import { nextTheme, parseTheme, resolveTheme, THEME_STORAGE_KEY } from '@/lib/theme';

function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeToggle({ label }: { label: string }) {
  function toggle() {
    const root = document.documentElement;
    const current = parseTheme(root.dataset.theme) ?? resolveTheme(null, prefersDarkMode());
    const next = nextTheme(current);

    root.dataset.theme = next;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Theme switching remains usable when storage is unavailable.
    }
  }

  return (
    <button className="icon-button theme-toggle" type="button" onClick={toggle} aria-label={label} title={label}>
      <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
        <IyaazIcon name="sun" />
      </span>
      <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
        <IyaazIcon name="moon" />
      </span>
    </button>
  );
}
