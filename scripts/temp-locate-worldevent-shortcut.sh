#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' '=== shortcut / keyboard references ==='
grep -RInE --exclude-dir=.git --exclude='src/build-info.js' '(keydown|keyup|Digit1|Numpad1|keycap|shortcut|worldEventCards|world-event-card|choiceKey|keyboard)' src scripts index.html styles.css feature-pack.css || true
