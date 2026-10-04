---
name: tune-animation
description: Wire a piece's animation to the dev-only Tuner panel so Juan can tune it by eye — load mode (replay, loop, scrub timeline) or scroll mode (spacers above and below, auto-scroll), with a slider or toggle per exposed value and Copy values to bake back. Use when Juan says "tune this", "add the tuner", "expose the values", or when a piece's motion needs fine-tuning rather than a first guess.
---

# Tune animation

The taste tool: the agent writes the animation against a small controls
object, the panel renders one control per value plus the mode's
transport, Juan tunes by eye, then the tuned values are baked into the
source. Template and this file are the single source; a piece's copy is
free to drift.

## 1. Install

    bash .claude/skills/tune-animation/scripts/install.sh <slug>

Copies `templates/tuner.tsx` to `apps/<slug>/app/_tuner/tuner.tsx` and
prints the wiring snippet. Self-contained: React only, no dependency,
inline styles, hidden in production unless the URL carries `?tune`.

## 2. Pick the mode

- `load` — on-load / entrance choreography. Replay remounts the
  children; Loop replays on completion (or every N ms when nothing is
  registered); `register(fromGsap(tl))` or `register(fromMotion(ctrl))`
  turns the bar into a scrubber with Play/Pause.
- `scroll` — scroll-driven work. The children sit between two spacers
  (default 2 viewport heights each, slider 0–4) so the animation can be
  entered and left; To start aligns the stage; Auto-scroll ping-pongs at
  a chosen speed. Progress readout = stage through the viewport, 0–1.

## 3. Expose the values

Every number the eye might want to move goes in `controls`: durations,
delays, stagger, distances, blur, easing power. Booleans become
toggles: direction, variant, on/off of a layer. Build the animation from
`values`, re-create it when they change (`[values, api.replayKey]`).
Rule of the repo: never ship the first value that works.

## 4. Bake

When Juan is done: Copy values → paste the numbers as the defaults in
the source, delete the controls that didn't earn a slider, keep
`_tuner/` in the piece (it's dev-only and the `to-lab` capture never
shows it). A Tuner left in production shows only with `?tune`.

## Growing the tool

New mode or transport (hover, pointer, timeline markers…) → edit
`templates/tuner.tsx` here, keep it one file, update the mode list
above. Existing pieces keep their copy unless re-installed.
