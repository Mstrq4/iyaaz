import type { SVGProps } from 'react';

export type IyaazIconName =
  | 'search' | 'copy' | 'check' | 'filter' | 'sort' | 'library' | 'category' | 'master'
  | 'prompt' | 'favorite' | 'history' | 'clients' | 'statistics' | 'docs' | 'theme'
  | 'language' | 'menu' | 'close' | 'chevron' | 'arrow' | 'info' | 'warning'
  | 'privacy' | 'trash' | 'export' | 'external' | 'clear' | 'sun' | 'moon' | 'home' | 'grid' | 'list';

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IyaazIconName;
  label?: string;
  directional?: boolean;
}

export function IyaazIcon({ name, label, directional = false, className = '', ...props }: Props) {
  const classes = ['iyaaz-icon', directional ? 'is-directional' : '', className].filter(Boolean).join(' ');
  return (
    <svg viewBox="0 0 24 24" className={classes} role={label ? 'img' : undefined} aria-hidden={label ? undefined : true} aria-label={label} {...props}>
      {label ? <title>{label}</title> : null}
      <use href={`/icons/iyaaz-icons.svg#${name}`} />
    </svg>
  );
}
