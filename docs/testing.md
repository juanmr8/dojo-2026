# Testing browser effects

How to test a piece so it can be tuned and refactored without fear.
Written after piece 02 (blur text), when the first test suite went in.
Revise as pieces reveal more.

## The principle

Split every effect into two halves and test them differently:

1. **The contract** — what the DOM must look like and promise, with or
   without the animation: text present on the server, semantics, ARIA,
   fallbacks, which nodes an effect gets. Deterministic, fast, unit
   tested in jsdom. This is where regressions hide when you refactor.
2. **The motion** — what it looks like over time. Not unit tested.
   Verified by eye with the Tuner, and pinned with screenshots only
   when a piece is done.

If a test needs real layout, real paint or real timing, it is not a
jsdom test. Move it to the browser column below.

## Per family

| Family                                                 | Contract tests (Vitest + jsdom + Testing Library)                                                                                                                                                                                                                                                                                    | Browser checks (Playwright or by hand)                                                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Text** (split, reveal, mask, scramble)               | Pure tokenizer: words, graphemes, hyphens, emoji, accents, whitespace, round-trip. Server HTML: text once, real element, sr-only copy, `aria-hidden` on units, pending mark. Effects receive targets in order.                                                                                                                       | VoiceOver reads one sentence. Reduced motion → static. JS off → static. Lines re-measure on resize. Find-in-page, copy, translate.                                                |
| **Image** (reveal, parallax, hover distortion)         | `<img>` present in server HTML with `alt`, `width`, `height`; `priority` only above the fold; wrapper does not change the image's accessible name; decorative images have empty alt.                                                                                                                                                 | No layout shift (CLS 0 in Lighthouse). Reduced motion. `loading=lazy` below the fold. The image is visible if JS fails.                                                           |
| **Canvas / 2D**                                        | The draw function is pure: given state, assert the calls on a mocked context, or snapshot a small off-screen bitmap with `node-canvas`. Resize math: DPR scaling, aspect ratio, bounds.                                                                                                                                              | Pixel snapshot at fixed DPR and size. Frame budget via `performance.now()` in a Playwright page. Canvas has `role="img"` and `aria-label`, or is `aria-hidden` next to real text. |
| **WebGL / R3F / shaders**                              | Everything outside the GPU: uniforms derived from props, geometry builders, easing, the component tree with `@react-three/test-renderer`. Shader strings compile in a headless GL (`gl` package) or in a Playwright page.                                                                                                            | Screenshot at fixed seed and time. GPU time via `EXT_disjoint_timer_query`. Context loss restores. Fallback DOM when WebGL is unavailable.                                        |
| **Scroll-driven** (GSAP ScrollTrigger, Motion scroll)  | Progress maths as pure functions: scroll offset → progress → values. The DOM contract as for text or image. Drivers: `vi.mock('gsap/ScrollTrigger')` with a fake `create` that records the vars, then fire `onEnter`/`onLeaveBack` by hand and assert on the timeline (`paused`, `reversed`, `parent`). Piece 02 `drivers.test.tsx`. | Scrub at 0, 0.5, 1 by setting `scrollY` in Playwright and screenshotting. Reduced motion. No scroll hijack on touch.                                                              |
| **React state / interaction** (hover, cursor, toggles) | Testing Library with `userEvent`: keyboard reaches everything a mouse does, focus is visible, state transitions are right.                                                                                                                                                                                                           | Pointer precision by hand. Touch devices.                                                                                                                                         |
| **Audio-reactive**                                     | Analyser → values as a pure function fed with synthetic FFT arrays.                                                                                                                                                                                                                                                                  | Microphone permission flow. Visual by ear.                                                                                                                                        |

## Tooling, in order of reach

- **Vitest + jsdom + Testing Library** in the app. Contract tests. Run
  on every change. Piece 02 is the reference setup:
  `apps/02-blur-text/vitest.config.mts`.
- **`renderToString`** from `react-dom/server` inside those tests, to
  assert the server HTML itself, not the hydrated DOM. This is the SEO
  test and the no-JS test in one.
- **`@testing-library/jest-dom`** matchers: `toHaveAccessibleName` is the
  single most useful one for text effects.
- **axe** (`vitest-axe`) for a cheap ARIA pass once a piece has more
  than one landmark. Not needed for a single heading.
- **Playwright** when a piece ships to the portfolio: the media queries
  (`prefers-reduced-motion`, `scripting`), screenshots at fixed
  viewport and DPR, scroll positions, and `page.emulateMedia`.
  Not for the dojo's one-hour pieces.
- **Lighthouse** on the deployed demo for CLS, LCP and the a11y audit,
  as part of `to-lab`.

## Rules that came out of piece 02

- Test the server string, not only the mounted DOM. jsdom runs layout
  effects before `render` returns, so "initial" state is already gone.
- Keep splitting, tokenising and maths in pure files with no React
  import. They get the most cases and the fastest tests.
- A test that stubs `document.fonts`, `ResizeObserver` or `matchMedia`
  is testing the stub. Guard those APIs in the component instead and
  test the behaviour when they are absent.
- Name the test after the promise, not the function: "server HTML is
  pending and carries the text", not "renders correctly".
- A child's layout effect runs before its parent's ref is attached.
  Anything that needs the root element waits for the root's `ready`
  flag, and the test for it is the one that fails when you forget.
