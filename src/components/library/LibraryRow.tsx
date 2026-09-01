'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import type { Locale, LibraryCopy } from '../../lib/i18n';
import type { LibraryRecord } from '../../lib/library/types';
import { IyaazIcon } from '../icons/IyaazIcon';

interface LibraryRowProps {
  locale: Locale;
  copy: LibraryCopy;
  record: LibraryRecord;
}

function fallbackCopy(value: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

export function LibraryRow({ locale, copy, record }: LibraryRowProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const summary = record.functionText || record.bestUse || record.notes;
  const canonicalTextProps = locale === 'en' ? { lang: 'ar', dir: 'rtl' as const } : {};

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleCopy = async () => {
    let didCopy = false;
    try {
      await navigator.clipboard.writeText(record.shortcut);
      didCopy = true;
    } catch {
      didCopy = fallbackCopy(record.shortcut);
    }

    if (!didCopy) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 1000);
  };

  return (
    <article className="library-row" data-record-id={record.id}>
      <div className="library-row__content">
        <code className="library-row__shortcut" dir="ltr">{record.shortcut}</code>
        <h2 className="library-row__title" {...canonicalTextProps}>{record.nameAr}</h2>
        {summary ? <p className="library-row__summary" {...canonicalTextProps}>{summary}</p> : null}

        <div className="library-row__meta" {...canonicalTextProps}>
          <span>{record.mainDomain}</span>
          <span>{record.category}</span>
          <span>{record.shortcutType}</span>
        </div>
      </div>

      <div className="library-row__actions">
        <button
          type="button"
          className="library-row__copy"
          aria-label={copied ? copy.copied : copy.copyShortcut}
          title={copied ? copy.copied : copy.copyShortcut}
          onClick={handleCopy}
        >
          <IyaazIcon name={copied ? 'check' : 'copy'} />
        </button>

        <Link className="library-row__details" href={`/${locale}/library/${record.id}`}>
          <span>{copy.details}</span>
          <IyaazIcon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
