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
