# Coding standards

The baseline for every piece. Reviews and the vault's cycle audit check
code against this file; each piece sees it as `docs/coding-standards.md`
(a symlink, so there is one copy). Add a rule only when a piece taught
it or when Juan decided it; strike one the same way.

## Shape of a piece

- `app/page.tsx` stays a server component and renders one client
  component from a kebab-case file next to it (`app/blur-text.tsx`).
  Animation code never runs on the server.
- One piece, one idea, one component tree. A second idea is a second
  piece.
- A piece starts from a foundation when one fits the brief
  (`foundations/README.md`, installed as `apps/<slug>/<name>/`,
  imported as `@/<name>`). The piece's own files never go inside the
  installed copy, and the copy never drifts from its source: a fix
  lands in `foundations/<name>/` first, then is reinstalled.
- Every animated value lives in one object at the top of the file
  (`CONTROLS` when the Tuner is wired, `MOTION` otherwise). No number
  inside a tween that is not named there. Comments on the object say
  what the eye should feel, not what the number is.

## Motion code

- One timeline per piece (GSAP) or one `animate` sequence (Motion);
  every tween belongs to it. The effect that creates it returns a
  cleanup that kills it, ScrollTriggers included.
- Start state is set by the tween (`fromTo`), never by CSS, so the
  server render shows the finished state and a replay is deterministic.
- Animate `transform`, `opacity`, `filter` and `clip-path` only. Layout
  properties (width, height, top, left, margin) are off limits.
- `will-change` only on the elements that move, and only for the
  properties that move.
- Ease is a named family plus a power (`power3.out`, `expo.inOut`). A
  custom curve needs a comment saying what it is for.
- `prefers-reduced-motion: reduce` jumps to the end state. Every piece,
  no exceptions.
- DOM access goes through refs scoped to the component's root
  (`ref.current.querySelectorAll`, or `gsap.context`). Never
  `document.querySelector`.

## TypeScript and React

- No `any`, no `as` casts to silence the compiler. Values exposed to the
  Tuner are typed `Values<typeof CONTROLS>`.
- Handlers are `handleX`; `onX` is the prop that receives them.
- Hooks hold logic, components render. A piece that grows a hook names
  it `use-<thing>.ts`.
- Guard clauses at the top, happy path at the bottom. Derive, never
  store, what can be computed.
- Every `catch` logs before it recovers.

## Styling

- Tailwind for layout and type; motion lives in JS, not in Tailwind
  transition classes, unless the piece is explicitly a CSS-only piece.
- Class lists in groups: layout, spacing, colour, shape, states.

## Presets and options objects

A preset is a composed component (root + driver + effect) that a
project copies as one file. Piece 02's `presets/blur-title.tsx` is the
reference. Rules that keep it copyable:

- The tuned values live in one exported constant at the top of the
  file (`BLUR_TITLE`), typed with the preset's options type. No number
  below it; the JSX only reads the constant.
- The component takes `options?: Partial<Options>`. Top-level keys
  replace, nested timing (`transition`) merges. Say so in the header
  comment.
- Modes are a discriminated union on `type` (`load | in-view | scrub`)
  so one mode's options cannot leak into another. Dispatch once, in a
  `drive()` helper, never with `if` chains in JSX.
- The preset adds no behaviour. Everything it needs is a prop of the
  layer beneath it (root, driver, effect); the preset is a vocabulary
  plus defaults.
- For an agent: asked to change how a preset feels, edit the constant.
  Asked for a new flavour, add a union member and a `drive()` case.
  Asked for a new value, add it to the layer that owns it first, then
  surface it in the constant.
