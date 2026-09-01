'use client';

import { IyaazIcon } from '@/components/icons/IyaazIcon';
import { nextTheme, normalizeTheme } from '@/lib/theme';

export function ThemeToggle({ label }: { label: string }) {
  function toggle() {
    const current = normalizeTheme(document.documentElement.dataset.theme);
    const next = nextTheme(current);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('iyaaz:theme', next);
  }

  return (
    <button className="icon-button" type="button" onClick={toggle} aria-label={label} title={label}>
      <IyaazIcon name="theme" />
    </button>
  );
}
