---
description: "Create SVG graphics, icons, illustrations, animations, and data visualizations. Also optimize, animate, or restyle existing SVG code."
---

# SVG Foundry — Professional SVG Creation & Optimization

This vendored Phase 4 copy is intentionally scoped to IYAAZ identity and icon work. The user-provided upstream archive remains the authoritative source for the complete knowledge base.

## IYAAZ operating rules

1. Clarify task/output requirements from the approved project specification before editing SVG.
2. Always use a responsive `viewBox`; do not add root fixed `width`/`height` unless explicitly required.
3. Prefer correct geometry before gradients, opacity, masks, blur, or filters.
4. Use semantic IDs and reusable `<defs>` for gradients, masks, clips, and filters.
5. Keep filters restrained for small-size performance and crisp edges.
6. Provide `<title>` and `<desc>` for meaningful brand assets; decorative application icons are hidden by the React boundary.
7. Do not embed raster images or data URLs in IYAAZ brand SVGs.
8. Functional icons use `currentColor` and a coherent stroke/fill language.
9. Preserve semantic RTL direction: only genuinely directional symbols mirror.
10. Validate SVG XML and responsive behavior before delivery.

## Relevant upstream knowledge used in Phase 4

The implementation follows the upstream SVG Foundry guidance for path construction, responsive coordinate systems, gradients, clipping/masking, filters, web accessibility, and performance. See `UPSTREAM.md` for provenance of the complete supplied archive.
