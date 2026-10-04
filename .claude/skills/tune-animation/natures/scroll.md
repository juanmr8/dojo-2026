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
