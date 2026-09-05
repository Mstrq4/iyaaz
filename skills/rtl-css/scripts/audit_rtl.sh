#!/usr/bin/env bash
set -euo pipefail

roots=(src)
pattern='(^|[[:space:];{])(left|right)[[:space:]]*:|(^|[[:space:];{])(margin|padding|border)-(left|right)[[:space:]]*:'

if grep -RInE --include='*.css' --include='*.scss' --include='*.tsx' --include='*.ts' "$pattern" "${roots[@]}"; then
  echo 'RTL audit failed: physical directional properties found.' >&2
  exit 1
fi

echo 'RTL audit PASS: logical directional properties only.'
