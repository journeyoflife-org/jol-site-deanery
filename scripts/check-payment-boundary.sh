#!/usr/bin/env bash
# Payment boundary guard — INV-3 enforcement.
# Fails CI if any PSP SDK import is detected in the codebase.
# Model A (ADR-009): no payment SDK imports in front-end code.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# A literal single quote, obtained without breaking out of the surrounding quoting.
SQ=$(printf '\047')

# Known PSP SDK patterns that must never appear in import/require statements.
#
# The previous patterns were broken independently of the --include glob:
#   - '["@]' is a ONE-character class (a double quote OR an @), so it could
#     never match a real scoped import such as `from "@stripe/stripe-js"`,
#     which has both characters before `stripe`;
#   - '["]' matched double quotes only, so the single-quoted import style this
#     codebase uses was invisible.
# Both quote styles and the optional package scope are now covered.
PATTERNS=(
  "from[[:space:]]+[\"${SQ}]@?stripe"
  "require\([\"${SQ}]@?stripe"
  "from[[:space:]]+[\"${SQ}]@?paypal"
  "require\([\"${SQ}]@?paypal"
  "from[[:space:]]+[\"${SQ}]@?adyen"
  "require\([\"${SQ}]@?adyen"
  "from[[:space:]]+[\"${SQ}]@?square"
  "require\([\"${SQ}]@?square"
  '@stripe/stripe-js'
  '@adyen/adyen-web'
  'import.*paypal.*sdk'
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # Search only source files, not node_modules or build output.
  # NOTE: grep --include uses fnmatch, which does NOT support brace expansion.
  # '--include=*.{ts,tsx,js,jsx}' silently matched zero files, so this INV-3
  # gate always passed regardless of content. One --include per extension.
  MATCHES=$(grep -rn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=.turbo \
    -E "$pattern" \
    src/ 2>/dev/null || true)

  if [ -n "$MATCHES" ]; then
    echo "FAIL: Payment boundary violation detected (INV-3, ADR-009):"
    echo "$MATCHES"
    echo ""
    FOUND=1
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Payment SDK imports are prohibited in spoke repositories (Model A)."
  echo "See ADR-009 and D-052. Payment is handled by the hub backend only."
  exit 1
fi

echo "PASS: no PSP SDK imports detected (INV-3 clean)."
exit 0
