# Testing strategy

- Unit/logic tests prove deterministic search, normalization, prompt schema, access signing, and related pure behavior.
- Python tests validate workbook ingestion and SVG/data contracts.
- Component/DOM checks cover rendered interactive behavior where suitable.
- Playwright browser E2E proves critical deployed-style user flows, RTL/LTR, responsive behavior, theme persistence, search, prompt generation, copy interaction, and the no-upload boundary.

Source inspection alone is not accepted as proof of interactive UI behavior.
