#!/usr/bin/env bash
set -euo pipefail

# Usage: install.sh <slug>
# Copies the tuner into apps/<slug>/app/_tuner/tuner.tsx (never overwrites
# an existing copy — a piece may have tweaked its own) and prints the
# wiring snippet.

SLUG="${1:?usage: install.sh <slug>}"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
APP="$ROOT/apps/$SLUG"
[ -d "$APP/app" ] || { echo "apps/$SLUG/app not found"; exit 1; }

DEST="$APP/app/_tuner/tuner.tsx"
if [ -f "$DEST" ]; then
  echo "already installed: $DEST (delete it to reinstall from the template)"
else
  mkdir -p "$(dirname "$DEST")"
  cp "$ROOT/.claude/skills/tune-animation/templates/tuner.tsx" "$DEST"
  echo "installed: $DEST"
fi

cat <<'EOT'

Wire it (app/page.tsx is a server component; put this in a client file):

  "use client";
  import { Tuner, fromGsap } from "./_tuner/tuner";

  const CONTROLS = {
    duration: { value: 0.8, min: 0.1, max: 3, step: 0.05 },
    stagger:  { value: 0.04, min: 0, max: 0.3, step: 0.005 },
    blur:     { value: 12, min: 0, max: 40, step: 1 },
    fromBelow: true,
  };

  <Tuner mode="load" controls={CONTROLS}>
    {(v, api) => <Piece values={v} register={api.register} />}
  </Tuner>

Inside Piece, build the timeline from `values` and hand it over:
  useEffect(() => { const tl = gsap.timeline(...); register(fromGsap(tl)); return () => tl.kill(); }, [values]);
EOT
