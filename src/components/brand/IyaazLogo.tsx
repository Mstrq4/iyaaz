import Image from 'next/image';

type Variant = 'gradient' | 'dark' | 'light';

export function IyaazMark({ variant = 'gradient', className = '' }: { variant?: Variant; className?: string }) {
  return <Image className={className} src={`/brand/mark-${variant}.svg`} alt="IYAAZ — إيعاز" width={118} height={163} priority />;
}

export function IyaazWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-wordmark" aria-label="إيعاز IYAAZ">
      <strong>إيعاز</strong>
      <span className={compact ? 'sr-only' : ''}>IYAAZ</span>
    </span>
  );
}
