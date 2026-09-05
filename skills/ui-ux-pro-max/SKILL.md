---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web interfaces, design systems, accessibility, interaction, responsive layout, typography, color, icons, and stack-specific implementation."
---

# UI/UX Pro Max — IYAAZ project entrypoint

This repository copy is pinned to the upstream UI/UX Pro Max project recorded in `UPSTREAM.md`. It is used as an engineering/design aid and is not a runtime dependency.

## Priority rules for IYAAZ

1. Accessibility first: readable contrast, visible keyboard focus, semantic markup, and accessible names for icon-only controls.
2. Touch and interaction: controls must remain comfortably operable on mobile; do not rely on hover alone.
3. Performance: reserve layout space, avoid unnecessary filters/animation, and keep SVG assets lightweight.
4. Style consistency: use the approved IYAAZ identity board; SVG icons only, never emoji product icons.
5. Responsive layout: mobile-first, no horizontal scrolling, and no fixed-width page composition.
6. Typography/color: semantic tokens in components; do not scatter raw color values through UI code.
7. Motion: subtle and meaningful; respect `prefers-reduced-motion`.
8. Navigation: predictable, compact, and bilingual.

## IYAAZ design-system constraints

- Product type: searchable creative-prompt/library tool.
- Direction: Data-dense + Drill-down + Editorial + Selective Glassmorphism.
- Brand anchors: Deep Amethyst `#3E1848`, Whisper Lavender `#E7E6F5`.
- Avoid generic AI purple-gradient backgrounds, oversized rounded cards, excessive centered content, and decorative clutter.
- Arabic RTL and English LTR are first-class.
- Only semantically directional icons mirror in RTL.
- Use the current Next.js stack and repository quality gates.

The complete upstream skill contains searchable local datasets and scripts. This project entrypoint preserves the rules applied during IYAAZ implementation; see `UPSTREAM.md` for the exact pinned source.
