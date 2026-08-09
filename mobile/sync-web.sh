#!/usr/bin/env bash
# apps/<app>/ 의 웹 소스를 각 Capacitor 프로젝트의 www/ 로 복사한다.
# (www/ 는 .gitignore 되어 있으므로 로컬/CI 빌드 전에 항상 실행)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

declare -A MAP=(
  [cozy-collector]=cozy-collector
  [sleepy-koala]=sleepy-koala
  [smile-coach]=smile-coach
)

for mobile_dir in "${!MAP[@]}"; do
  src="$ROOT/apps/${MAP[$mobile_dir]}"
  dst="$ROOT/mobile/$mobile_dir/www"
  mkdir -p "$dst"
  cp -f "$src/index.html" "$dst/index.html"
  echo "synced: apps/${MAP[$mobile_dir]}  ->  mobile/$mobile_dir/www"
done
