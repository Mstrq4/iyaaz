import type { ReactNode } from 'react';

export interface DetailField {
  key: string;
  label: string;
  value: string;
  valueProps?: {
    lang?: string;
    dir?: 'rtl' | 'ltr' | 'auto';
  };
}

interface DetailSectionProps {
  title: string;
  fields: readonly DetailField[];
  id: string;
  footer?: ReactNode;
}

export function DetailSection({ title, fields, id, footer }: DetailSectionProps) {
  const visibleFields = fields.filter((field) => field.value.trim().length > 0);
  if (visibleFields.length === 0) return null;

  return (
    <section className="detail-section" data-detail-section={id} aria-labelledby={`detail-section-${id}`}>
      <h2 id={`detail-section-${id}`}>{title}</h2>
      <dl className="detail-section__fields">
        {visibleFields.map((field) => (
          <div className="detail-field" data-detail-field={field.key} key={field.key}>
            <dt>{field.label}</dt>
            <dd {...field.valueProps}>{field.value}</dd>
          </div>
        ))}
      </dl>
      {footer}
    </section>
  );
}
