---
name: tune-animation
description: Wire a piece's animation to the dev-only Tuner panel so Juan can tune it by eye — load mode (replay, loop, scrub timeline) or scroll mode (spacers above and below, auto-scroll), with a slider or toggle per exposed value and Copy values to bake back. Use when Juan says "tune this", "add the tuner", "expose the values", or when a piece's motion needs fine-tuning rather than a first guess.
---

# Tune animation

The taste tool. Tuning is not deterministic, so the rules live per
animation nature: the agent reads the nature's file, exposes the
values it names, wires the panel, Juan tunes by eye, the tuned values
are baked back. Template, this file and `natures/` are the single
source; a piece's copy of the panel is free to drift.

## 1. Name the nature, read its file

- Entrance, on mount, time-driven → `natures/load.md`
- Driven by scroll position → `natures/scroll.md`
- Anything else (hover, pointer, state change) → no file yet: wire
  `load` mode as the nearest fit, note the gap in `docs/RECORD.md`.

Read the file before writing a line of animation code. It says what
to expose, how to build so the panel can drive it, and how to judge.

## 2. Install

    bash .claude/skills/tune-animation/scripts/install.sh <slug>

Copies `templates/tuner.tsx` to `apps/<slug>/app/_tuner/tuner.tsx` and
prints the wiring snippet. Self-contained: React only, no dependency,
inline styles, hidden in production unless the URL carries `?tune`.

## 3. Wire

    <Tuner mode="load" | "scroll" controls={CONTROLS}>
      {(values, api) => <Piece values={values} register={api.register} />}
    </Tuner>

`controls`: every number the nature file says to expose, as
`{ value, min, max, step }`; every boolean as `true | false`. Type the
piece's props with `Values<typeof CONTROLS>` from the template. Build
the animation from `values`, re-create it when they change. Keep the
page a server component and put the Tuner in a client file.

Rule of the repo, restated once: never ship the first value that
works.

## 4. Bake

When Juan says done: Copy values → paste the numbers as the defaults
in `CONTROLS`, delete the controls the nature file would call
constants (never moved), keep `_tuner/` in the piece. The `to-lab`
capture never shows the panel; production shows it only with `?tune`.

## Growing the tool

- A new nature (hover, pointer, timeline markers…) → a new
  `natures/<name>.md` with the same three sections, a line in step 1,
  and whatever the template needs to drive it (one file, keep it so).
- A rule learned while tuning a piece → the nature file, not the
  piece. Existing pieces keep their panel copy unless re-installed.
