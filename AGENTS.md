# IYAAZ Repository Instructions

- Arabic and English are first-class. Never introduce physical directional CSS properties; use logical properties and run `npm run test:rtl`.
- Never commit the private source workbook or source/reference URLs. Browser/server runtime data comes from `data/library.sanitized.json.gz`.
- No database and no direct AI-model integration.
- No file/image upload controls in the prompt builder; attachments are manual guidance only.
- Keep prompt, client, favorite and history data in browser storage only.
- Primary product icons are the custom IYAAZ SVG family under `public/icons`/`src/components/icons`.
- Merge and production deploy remain explicit approval gates.
