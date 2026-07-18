#!/usr/bin/env bash
set -euo pipefail

mapfile -t chunks < <(find scripts -maxdepth 1 -type f -name 'community-patch-*.b64' -print | sort)
if [[ ${#chunks[@]} -lt 12 ]]; then
  echo "Expected all community patch chunks, found ${#chunks[@]}" >&2
  exit 1
fi

cat "${chunks[@]}" | tr -d '\r\n' | base64 -d | gzip -d | git apply --index --whitespace=error-all
