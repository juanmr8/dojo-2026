# Scroll-driven animations

State mapped to scroll position, not to time. The eye judges the
mapping and the two edges (entering, leaving), so the piece must be
enterable and leavable at any speed. Read before wiring `mode="scroll"`.

## What to expose

- Range: where the animation starts and ends relative to the stage
  (`start`, `end` offsets in viewport fractions), and the pin duration
  if it pins.
- Mapping: the from/to of each driven property (y, scale, opacity,
  blur, clip), and the scrub smoothing (0 = locked to the finger,
  0.5–1.5 s = lag).
- Booleans: `scrub` vs `once` (follow the scroll, or play through once
  when the stage enters), direction reversal, a layer on/off.
- The Tuner's own `spacer` slider (0–4 viewport heights) is the room
  above and below; leave it to the panel.

## How to build it

- The Tuner's children are the stage; make the trigger element the
  outermost element you render, so the panel's progress readout and the
  piece's trigger agree.
- GSAP: one `ScrollTrigger` per piece built from `values`, killed in the
  effect cleanup. Motion: `useScroll({ target })` with `useTransform`
  ranges read from `values`.
- No `register` call: the scroll is the scrubber. Auto-scroll is the
  playback.
- Leave the first paint honest: with spacer 0 the stage is in view on
  load and must look right before any scroll.

## How to judge

- Enter and leave from both directions at three speeds: a slow drag, a
  flick, and Auto-scroll at its default. Nothing may pop at the edges
  of the range.
- Scrub smoothing is felt on the flick, not on the drag; judge it there.
- Compare `scrub` and `once` with the toggle before committing to the
  mapping. Many scroll pieces want `once`.
- Watch the progress readout: if the interesting part happens between
  0.45 and 0.55, the range is too short.
- As with load: one value per pass, Copy values at each candidate, drop
  the sliders you never moved.

## This piece

Scroll mode, but the scroll is infinite (Lenis `infinite: true`) and
the page is exactly one lap, so the Tuner's spacers and progress
readout matter less than the lap itself. Every value is in
`app/controls.ts`; the maths is in `lens/lens.ts`.

- The line: the scroll drives the sweep, left to right; `lapLength`
  is the scroll of one sweep. At the right end the rewind plays on its
  own clock, not the scroll's: `returnDuration` (seconds) and
  `returnEase` (how it takes off and lands). Every tile it crosses
  blooms and settles on the way. `phase` is where the line stands at
  the top of the page.
- The turns: `overshoot` runs the line past each edge before the
  rewind. At 0 the rewind starts the moment the line touches the right
  edge; above `zoneWidth / 2` the strip lies flat first, a held beat.
- The lens: `zoneWidth` (its width) and `coreShare` (the sharp core's
  share of it). Outside the zone every tile is exactly at rest.
- The amounts, first in the panel: `liftY` (strip heights, the main
  move), `driftX` (viewport widths, the most the wildest tile drifts
  sideways) and `scale` (a tile's size with the line on it; 1 = off),
  with `scaleAll` (every tile, or only the scattered scalers).
- The character: `mess` blends every tile from orderly (0: the same
  move scaled by distance, lift by weight, a push away from the line)
  to its own personality (1). `seed` reshuffles who plays which part:
  about a third of the tiles hold still sideways, a few wander far
  either way, a fifth stay on the strip, a few swell big. The parts are
  dealt in `lens/model.ts` (`CAST`); a tile's part can be hand-set in
  `lens/overrides.ts`, which wins per component. Everything stays
  inside the lens's envelope, so outside the zone and at the turns the
  strip still rests exactly. Tune the three amounts at mess 0 first,
  then raise mess and step through seeds.
- One tile alone: click it (or its row in the Tree or Timeline, or
  step with ‹ › atop the Scroll tab) and tune its `dx`, `dy`, `ds` and `z`,
  each starting at its seeded value. `dx` is in `driftX` units, so it
  moves nothing while `driftX` is 0; `dy` and `ds` likewise ride
  `liftY` and `scale`, and count fully only at `mess` 1. Settle the seed
  first: moved tiles keep their values through a reseed. Copy for
  Claude returns them under `items`, baked into `lens/overrides.ts`.
- The strip: `stripThickness`, and `scrollLerp` for the scrub's feel.
  The tile count (`TILE_COUNT`) and which tiles scale (`SCALER_GAPS`)
  are data in `lens/strip.ts`, not sliders.

Turn both spacers off (the two buttons beside "Timeline"): this page
loops forever, so it must be exactly one lap tall, and spacers add two
screens, which puts a jump in the loop and moves the line while the
strip is off screen. The panel's Scroll tab and Timeline scrubs don't
drive this piece (its motion is Lenis into Motion values, which tweakit
only reads); tune it with the Tune sliders.

Judge the rewind from a slow drag into the right edge (it should
fire on its own and ripple the strip back, readable), then from a
flick (a lap's end mid-rewind restarts it from where the line is);
then scroll up past the left edge and check it races the other way.
