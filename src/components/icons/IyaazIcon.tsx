import type { SVGProps } from 'react';
import { isDirectionalIcon, type IyaazIconName } from '@/lib/icons';

export type { IyaazIconName } from '@/lib/icons';

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IyaazIconName;
  label?: string;
}

export function IyaazIcon({ name, label, className = '', ...props }: Props) {
  const classes = ['iyaaz-icon', isDirectionalIcon(name) ? 'is-directional' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      viewBox="0 0 24 24"
      className={classes}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      {...props}
    >
      {label ? <title>{label}</title> : null}
      <use href={`/icons/iyaaz-icons.svg#${name}`} />
    </svg>
  );
}
