#!/usr/bin/env bash
# Fails when the hooks and $ calls that `claude plugin validate` reports
# differ from the list between the surface markers in SECURITY.md.
set -euo pipefail
cd "$(dirname "$0")/../.."

report=$(mktemp)
trap 'rm -f "$report"' EXIT

claude plugin validate . | tee "$report"

actual=$(awk '
  $1 == "❯" && ($3 == "hooks:" || $3 == "calls:") {
    kind = ($3 == "hooks:") ? "hook" : "call"
    line = $0
    sub(/^.*(hooks|calls): /, "", line)
    n = split(line, items, /, /)
    for (i = 1; i <= n; i++) {
      sub(/ \(via [^)]*\)$/, "", items[i])
      print kind "  " items[i]
    }
  }' "$report" | sort -u)

expected=$(awk '
  /<!-- surface:end -->/ { inside = 0 }
  inside && !/^```/ && NF { print }
  /<!-- surface:start -->/ { inside = 1 }' SECURITY.md | sort -u)

if [ -z "$actual" ]; then
  echo "No hooks or calls found in the validate report; its format may have changed." >&2
  exit 1
fi

if [ "$actual" != "$expected" ]; then
  echo >&2
  echo "The mod's hooks and calls differ from SECURITY.md (- listed there, + in the code):" >&2
  diff <(printf '%s\n' "$expected") <(printf '%s\n' "$actual") | grep '^[<>]' | sed 's/^</-/; s/^>/+/' >&2
  exit 1
fi

echo
echo "Hooks and calls match SECURITY.md."
