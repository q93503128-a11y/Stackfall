#!/usr/bin/env bash
set -euo pipefail
rm -rf test-results/visual-pass14
rm -f .github/workflows/visual-qa-pass14-temp.yml
rm -f scripts/visual-qa-pass14-temp.mjs
rm -f .github/workflows/visual-fix-pass14-temp.yml
rm -f scripts/visual-fix-pass14-temp.py
rm -f .github/workflows/cleanup-pass14-temp.yml
