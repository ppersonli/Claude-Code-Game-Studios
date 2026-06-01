#!/bin/bash
# Verify all CG packages are submission-ready
# Checks: index.html exists, CG SDK present, JS < 5MB, no missing refs

CG_DIR="/Users/liyuxuan/Desktop/cc-games/cg-submit"
GAMES="boba-drop boba-clicker boba-runner boba-sort boba-tycoon bubble-shooter bubble-tea bubble-tea-idle bubble-tea-lab bubble-tea-merge color-chaos idle-coffee-shop jelly-pop meme-match sweet-sort waffle-wobble"

printf "%-20s %5s %4s %4s %6s %s\n" "GAME" "HTML" "CG" "Poki" "JS" "STATUS"
printf "%-20s %5s %4s %4s %6s %s\n" "----" "----" "--" "----" "--" "------"

for game in $GAMES; do
  dir="$CG_DIR/$game"
  html_ok="✗"
  cg_ok="✗"
  poki_ok="✗"
  js_size="-"
  status="FAIL"
  errors=""

  # Check index.html exists
  if [ ! -f "$dir/index.html" ]; then
    errors="no index.html"
    printf "%-20s %5s %4s %4s %6s %s\n" "$game" "$html_ok" "$cg_ok" "$poki_ok" "$js_size" "$errors"
    continue
  fi
  html_ok="✓"

  # Check CG SDK
  if grep -q "crazygames-sdk-v3.js" "$dir/index.html"; then
    cg_ok="✓"
  else
    errors="no CG SDK"
  fi

  # Check Poki SDK
  if grep -q "poki-sdk.js" "$dir/index.html"; then
    poki_ok="✓"
  else
    errors="${errors:+$errors, }no Poki SDK"
  fi

  # Check JS bundle size
  js_files=$(find "$dir/assets" -name "*.js" -type f 2>/dev/null)
  js_total=0
  for js in $js_files; do
    js_size_bytes=$(wc -c < "$js")
    js_total=$((js_total + js_size_bytes))
  done
  js_mb=$(echo "scale=2; $js_total / 1048576" | bc)
  js_size="${js_mb}M"

  if [ "$js_total" -gt 5242880 ]; then
    errors="${errors:+$errors, }JS > 5MB"
  fi

  # Check user-select in body
  if ! grep -q "user-select" "$dir/index.html"; then
    errors="${errors:+$errors, }no user-select"
  fi

  if [ -z "$errors" ]; then
    status="✓ READY"
  else
    status="$errors"
  fi

  printf "%-20s %5s %4s %4s %6s %s\n" "$game" "$html_ok" "$cg_ok" "$poki_ok" "$js_size" "$status"
done
