#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
python3 scripts/serve_preview.py
