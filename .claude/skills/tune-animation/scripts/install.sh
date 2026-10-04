#!/usr/bin/env bash
set -euo pipefail

# Usage: install.sh <slug> <load|scroll>
# Copies the tuner into apps/<slug>/app/_tuner/tuner.tsx and the nature's
# guidance into apps/<slug>/docs/tuning.md (never overwrites either — a
# piece may have tweaked its own), then prints the wiring snippet.

SLUG="${1:?usage: install.sh <slug> <load|scroll>}"
NATURE="${2:?usage: install.sh <slug> <load|scroll>}"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SKILL="$ROOT/.claude/skills/tune-animation"
APP="$ROOT/apps/$SLUG"
[ -d "$APP/app" ] || { echo "apps/$SLUG/app not found"; exit 1; }
[ -f "$SKILL/natures/$NATURE.md" ] || { echo "no natures/$NATURE.md (have: $(ls "$SKILL/natures" | sed 's/.md//' | tr '\n' ' '))"; exit 1; }

GUIDE="$APP/docs/tuning.md"
if [ -f "$GUIDE" ]; then
  echo "guidance already in place: $GUIDE"
else
  mkdir -p "$APP/docs"
  cp "$SKILL/natures/$NATURE.md" "$GUIDE"
  echo "guidance: $GUIDE (from natures/$NATURE.md)"
fi

DEST="$APP/app/_tuner/tuner.tsx"
if [ -f "$DEST" ]; then
  echo "already installed: $DEST (delete it to reinstall from the template)"
else
  mkdir -p "$(dirname "$DEST")"
  cp "$SKILL/templates/tuner.tsx" "$DEST"
  echo "installed: $DEST"
fi

sed "s/NATURE/$NATURE/" <<'EOT'

Wire it (app/page.tsx is a server component; put this in a client file):

  "use client";
  import { Tuner, fromGsap } from "./_tuner/tuner";

  const CONTROLS = {
    duration: { value: 0.8, min: 0.1, max: 3, step: 0.05 },
    stagger:  { value: 0.04, min: 0, max: 0.3, step: 0.005 },
    blur:     { value: 12, min: 0, max: 40, step: 1 },
    fromBelow: true,
  };

  <Tuner mode="NATURE" controls={CONTROLS}>
    {(v, api) => <Piece values={v} register={api.register} />}
  </Tuner>

Inside Piece, build the timeline from `values` and hand it over:
  useEffect(() => { const tl = gsap.timeline(...); register(fromGsap(tl)); return () => tl.kill(); }, [values]);
EOT
