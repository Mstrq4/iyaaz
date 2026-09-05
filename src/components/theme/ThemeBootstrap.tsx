import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';

export function ThemeBootstrap() {
  return (
    <script
      id="iyaaz-theme-bootstrap"
      dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
    />
  );
}
