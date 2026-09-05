# IYAAZ Phase 8 Preview Verification

This release checkpoint exists to trigger and record a Vercel Preview deployment after the `iyaaz` Vercel project was linked to the GitHub repository `Mstrq4/iyaaz`.

## Release boundary

- Source branch: `feat/iyaaz-platform`
- Pull request: #1
- Previous verified application candidate: `00f5b6a5fd0b0c6175dd54c68cf9cdce5a7bfe71`
- This file is documentation-only and intentionally changes no application behavior.
- GitHub CI and Vercel Preview must both be verified against the new commit created by this checkpoint before Phase 8 is closed.
- Merge to `main` and Production deployment remain separate explicit user-approval gates.

## Preview verification checklist

- Vercel deployment target is Preview, not Production.
- Deployment Git ref is `feat/iyaaz-platform`.
- Deployment Git SHA matches the current PR head exactly.
- Arabic and English entry routes respond successfully.
- Library, shortcut detail, documentation, statistics, robots and sitemap surfaces respond as expected in public mode.
- No Preview runtime 5xx/error cluster is present during verification.

The final verified deployment identifiers and evidence are recorded in PR #1 after the checks complete.
