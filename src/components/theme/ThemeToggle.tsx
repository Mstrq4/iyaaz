'use client';

import { useEffect, useState } from 'react';
import { IyaazIcon } from '@/components/icons/IyaazIcon';

export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);
  function toggle() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('iyaaz:theme', next);
    setDark(!dark);
  }
  return (
    <button className="icon-button" type="button" onClick={toggle} aria-label={label} title={label}>
      <IyaazIcon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}
