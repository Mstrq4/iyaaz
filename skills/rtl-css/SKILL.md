# RTL CSS repository skill

IYAAZ treats Arabic RTL and English LTR as equal layout targets.

Rules:
- Prefer CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`, `border-inline`, `inline-size`, `block-size`).
- Do not use physical `left`/`right` layout properties in product CSS.
- Directional icons may flip only when their semantics depend on reading direction.
- Test narrow mobile and desktop layouts in both `dir=rtl` and `dir=ltr`.
- Run `bash skills/rtl-css/scripts/audit_rtl.sh` before committing.
