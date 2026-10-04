#!/usr/bin/env bash
set -euo pipefail

# Usage: install.sh <slug> <foundation> [--force]
# Copies foundations/<foundation>/ into apps/<slug>/<foundation>/, tests
# included. The app root, not app/, so `@/<foundation>` resolves with the
# default alias. Never overwrites unless --force: a piece's copy may
# carry work that has not been lifted back yet (diff first, see SKILL.md).

SLUG="${1:?usage: install.sh <slug> <foundation> [--force]}"
NAME="${2:?usage: install.sh <slug> <foundation> [--force]}"
FORCE="${3:-}"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SRC="$ROOT/foundations/$NAME"
APP="$ROOT/apps/$SLUG"
DEST="$APP/$NAME"

[ -d "$APP/app" ] || { echo "apps/$SLUG/app not found"; exit 1; }
[ -d "$SRC" ] || { echo "no foundations/$NAME (have: $(ls -d "$ROOT"/foundations/*/ | xargs -n1 basename | tr '\n' ' '))"; exit 1; }

if [ -d "$DEST" ] && [ "$FORCE" != "--force" ]; then
  echo "already installed: apps/$SLUG/$NAME"
  echo "diff against the source before replacing it:"
  echo "  diff -r -x INSTALL.md foundations/$NAME apps/$SLUG/$NAME"
  echo "then re-run with --force to take the source copy."
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"
rm -f "$DEST/INSTALL.md"
echo "installed: apps/$SLUG/$NAME (from foundations/$NAME)"

if [ -f "$SRC/INSTALL.md" ]; then
  echo
  cat "$SRC/INSTALL.md"
fi
