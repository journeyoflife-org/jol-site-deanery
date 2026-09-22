#!/usr/bin/env bash
# Secret detection guard.
# Fails CI if potential secrets are found in source code.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# A literal single quote, obtained without breaking out of the surrounding
# quoting. The previous patterns used '\x27', which grep -E does not interpret
# as an escape: inside a bracket expression it matched the characters
# \ x 2 7, so single-quoted secrets were never detected.
SQ=$(printf '\047')

# Patterns that indicate potential secrets
PATTERNS=(
  # API keys and tokens
  "API_KEY[[:space:]]*=[[:space:]]*[\"${SQ}][^\"${SQ}]+"
  "SECRET_KEY[[:space:]]*=[[:space:]]*[\"${SQ}][^\"${SQ}]+"
  "PRIVATE_KEY[[:space:]]*=[[:space:]]*[\"${SQ}][^\"${SQ}]+"
  "ACCESS_TOKEN[[:space:]]*=[[:space:]]*[\"${SQ}][^\"${SQ}]+"
  # AWS credentials
  'AKIA[0-9A-Z]{16}'
  # Generic high-entropy strings (base64-like, 40+ chars)
  "password[[:space:]]*=[[:space:]]*[\"${SQ}][^\"${SQ}]{20,}"
  # Private key blocks
  '-----BEGIN.*PRIVATE KEY-----'
  # Database connection strings with credentials
  'postgresql://[^:]+:[^@]+@'
  'mysql://[^:]+:[^@]+@'
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # NOTE: grep --include uses fnmatch, which does NOT support brace expansion.
  # '--include=*.{ts,tsx,js,jsx,json,yaml,yml}' silently matched zero files, so
  # the source scan below never ran and this gate always passed. One --include
  # per extension. (The secrets/encrypted check further down did still run.)
  MATCHES=$(grep -rn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
    --include='*.json' --include='*.yaml' --include='*.yml' \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=.turbo \
    --exclude-dir=secrets \
    --exclude='.env.example' \
    -E "$pattern" \
    src/ 2>/dev/null || true)

  if [ -n "$MATCHES" ]; then
    echo "FAIL: Potential secret detected in source code:"
    echo "$MATCHES"
    echo ""
    FOUND=1
  fi
done

# Also check for unencrypted secret files
if find secrets/encrypted -name '*.yaml' ! -name '.gitkeep' 2>/dev/null | grep -q .; then
  UNENCRYPTED=$(find secrets/encrypted -name '*.yaml' ! -name '.gitkeep' -exec sh -c '
    if ! head -1 "$1" | grep -q "^\[ANSIBLE_VAULT\|^\s*sops:"; then
      echo "$1"
    fi
  ' _ {} \;)

  if [ -n "$UNENCRYPTED" ]; then
    echo "FAIL: Unencrypted YAML found in secrets/encrypted/:"
    echo "$UNENCRYPTED"
    echo ""
    FOUND=1
  fi
fi

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Secrets must never be committed in plaintext."
  echo "Use SOPS/age encryption for all secrets at rest."
  echo "See secrets/README.md for the workflow."
  exit 1
fi

echo "PASS: no plaintext secrets detected."
exit 0
