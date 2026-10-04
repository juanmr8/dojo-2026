# Record

Continual-improvement journal, harvested into the vault. An entry earns
its place when it would change how the next piece is built: a
frustration with the setup, a tool that got in the way, a way of tuning
motion that worked. Not a status log.

## Entries

### 2026-10-04 — piece 02, blur text

- The first component was piece-shaped: text constant inside, Tuner
  imported directly, `<main>` rendered by the component. Grilling it
  into a long-term component took longer than the effect itself. Next
  piece: decide "demo or primitive" in the first five minutes.
- React Compiler lint rules reject `createElement` with a ref and
  setState inside a layout effect. The second is the legitimate
  measure-then-render pattern (lines); scoped disable with the reason.
- jsdom has no `document.fonts`, so "initial" state is gone before
  `render` returns. `renderToString` is the right tool for server-HTML
  assertions. Recorded in `docs/testing.md`.
- Chrome windows driven by the extension can be throttled to one frame
  a second; verify motion in the foreground window, verify contracts
  in tests.

### 2026-10-04 — piece 02, drivers and preset

- The `active` boolean I first sketched for "in view" could not drive
  a scrub. Designing the contract with two consumers (InView, Scrub)
  before writing either gave `attach(timeline)`, which both fit.
  Rule: a context contract needs two consumers before it is a contract.
- A child's layout effect runs before the parent's ref is attached.
  The drivers silently created nothing until they waited for the
  root's `ready`. The jsdom test caught it; the browser would have too,
  later and louder.
- Scroll mode has no scrub bar, so the motion was tuned in load mode
  first and the trigger in scroll mode after. Two sessions, two modes;
  that order worked.
- TypeSplit became the first foundation (`foundations/typesplit`) the
  same day it was written: root, drivers and the reference effect in
  one installable folder, the preset left in the piece. Installing at
  the app root (not under `app/`) is what makes `@/typesplit` resolve
  with the default alias; the first attempt under `app/` did not.
