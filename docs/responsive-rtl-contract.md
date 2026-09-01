# Responsive and Bidirectional UI Contract

Every user-facing component must work in Arabic RTL and English LTR from narrow mobile through large desktop.

## Required widths

Verification includes at minimum 360px, 375px, 768px, 1024px, and 1440px viewports.

## Bidirectional layout

Use CSS logical properties and Tailwind logical utilities. Do not use physical left/right spacing or positioning for layout. Directional icons flip only when their meaning depends on reading direction.

## Responsive behavior

Dense desktop layouts must adapt structurally on mobile. Filters, navigation, result rows, prompt forms, statistics, documentation, dialogs, and local workspace views must avoid accidental horizontal overflow and preserve 44px minimum touch targets where interactive.

## Themes

Both Light and Dark themes must preserve contrast for solid, transparent, blurred, and glass surfaces, including custom SVG icons and the IYAAZ identity.
