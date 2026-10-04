# Load animations

Entrance choreography that runs once on mount. Time-driven: the eye
judges the whole run, so replay is the loop and the scrubber is the
microscope. Read before wiring `mode="load"`.

## What to expose

- Timing: total duration, per-element duration, delay before start,
  stagger. Stagger is the control that moves most; give it a fine step.
- Start state: the distances the elements travel from (y, x, scale,
  blur, rotation). One slider each, in px or units the CSS uses.
- Ease: a family fixed in code (`power`, `expo`, `back`) and a power
  slider 1–4; sliders need numbers, never free-text ease strings.
- Booleans: direction (from below / above), order (forward, reverse,
  centre-out as two toggles), whether a secondary layer plays at all.
- Don't expose: colours, copy, layout. The panel is for motion.

## How to build it

- One GSAP timeline (or one Motion `animate` sequence) per piece, every
  tween on it, nothing orphaned. Register it with `fromGsap` /
  `fromMotion` so Play, Pause and the scrub bar drive it.
- Build from `values` inside an effect keyed on `[values, register]`;
  the Tuner's remount handles replay, the effect handles re-tuning.
- Set the start state in the tween (`fromTo`), not in CSS, so a replay
  is deterministic and the server render shows the final state.
- Respect `prefers-reduced-motion`: skip to the end state when set.

## How to judge

- Watch it at 1x, Loop on, at least ten runs before touching a value.
- Scrub the last 20%: most of the feel lives in the settle. Then the
  first 20%: that is what the viewer notices first.
- Total felt length for text: under ~1.2 s to the last word; stagger ×
  count is the number to watch, not duration.
- Change one value per replay. When two settings compete, note both with
  Copy values before deciding.
- A value whose slider you never moved after the first pass is not a
  control, it is a constant: drop it at bake.
