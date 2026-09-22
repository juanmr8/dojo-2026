#!/usr/bin/env bash
set -euo pipefail

# Usage: capture.sh <slug> <url> [loop.mp4] [--from-video]
# Writes $DEV_PROJECTS/jmr_v2/public/lab/<slug>/image.png (+ video.mp4).
# --from-video: take image.png from the loop's middle frame instead of
# a headless-Chrome screenshot (motion-only pieces).

if [ $# -lt 2 ]; then
  echo "Usage: $0 <slug> <url> [loop.mp4] [--from-video]"
  exit 1
fi
: "${DEV_PROJECTS:?DEV_PROJECTS is not set — add: export DEV_PROJECTS=\"\$HOME/dev/2. Projects\" (Mac Studio) or your laptop root}"

SLUG="$1"; URL="$2"; LOOP="${3:-}"; MODE="${4:-}"
OUT="${DEV_PROJECTS}/jmr_v2/public/lab/${SLUG}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT"

if [ -n "$LOOP" ] && [ "$LOOP" != "--from-video" ]; then
  cp "$LOOP" "$OUT/video.mp4"
  echo "loop → $OUT/video.mp4"
fi
[ "$LOOP" = "--from-video" ] && MODE="--from-video"

if [ "$MODE" = "--from-video" ]; then
  [ -f "$OUT/video.mp4" ] || { echo "No video.mp4 to take a frame from."; exit 1; }
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/video.mp4")
  MID=$(awk "BEGIN{print $DUR/2}")
  ffmpeg -y -v error -ss "$MID" -i "$OUT/video.mp4" -frames:v 1 "$OUT/image.png"
else
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1600,1000 --virtual-time-budget=4000 \
    --screenshot="$OUT/image.png" "$URL" 2>/dev/null
fi
echo "image → $OUT/image.png"
