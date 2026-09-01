import Link from 'next/link';
import { IyaazMark, IyaazWordmark } from '@/components/brand/IyaazLogo';
import type { Locale } from '@/lib/i18n';

export function BrandLink({ locale }: { locale: Locale }) {
  return (
    <Link className="app-brand" href={`/${locale}`} aria-label="IYAAZ — إيعاز">
      <IyaazMark className="app-brand__mark" />
      <IyaazWordmark />
    </Link>
  );
}
