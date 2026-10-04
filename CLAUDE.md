# Dojo 2026

> Lean index. Depth lives in `.claude/skills/` — load the skill when the
> situation matches; don't improvise a different approach.

## What this is

Juan's creative-development practice, one piece at a time. Each piece
is an independent Next.js app under `apps/<NN-slug>/`, built in a
~1h afternoon session. Finished pieces are published to the portfolio's
Lab with the `to-lab` skill. Public repo, no secrets ever.

## Stack

- Next.js (App Router, Turbopack), TypeScript, Tailwind v4, Motion and
  GSAP; Three.js / R3F when a piece calls for it. Each app has its own
  lockfile — there is no workspace, work inside one app at a time.
- New piece: `./scripts/new-piece.sh <NN-slug>` (never `create-next-app`
  by hand). Slugs are two digits + kebab-case: `01-paragraph-reveal`.

## Foundations

Component trees that outlived their piece live in `foundations/`
(catalogue: `foundations/README.md`). Before writing a primitive,
check the catalogue against the brief; when one fits, use it and
build the piece's idea inside it. Improvements to a foundation go
back to its source, never stay in a piece. All of it → `foundations`.

## Skill routing

- Starting a piece, or about to write a primitive (text splitting,
  reveal contracts…) → `foundations`: check the catalogue, install
  what fits, lift improvements back.
- A piece is done and goes on the portfolio → `to-lab`.
- Tuning a piece's motion by eye ("tune this", "expose the values") →
  `tune-animation`: dev-only panel, load or scroll mode.

## Conventions

- One piece, one folder, one README line saying what it explores.
- Files kebab-case, components PascalCase, hooks `use*`.
- Prettier config at the root is copied into every app by the script.
- Coding standards: `docs/agents/coding-standards.md`, the review
  baseline; every piece sees it as `docs/coding-standards.md` (symlink
  made by the script). A piece's `docs/` also holds its tuning guide.
- Testing: `docs/testing.md` — contract tests in jsdom, motion by eye;
  what to test per effect family. Piece 02 is the reference setup.
- Improvement journal: `docs/RECORD.md` — append frustrations and
  lessons at the end of a session.

## What NOT to do (unless asked)

- Add features a piece didn't ask for; a piece is one idea.
- Share code between apps by hand. What is shared is a foundation,
  installed by its script; a piece never copies from another piece.
- Settle for the first easing, timing or value that "works": the whole
  point is taste. Expose the values, replay, tune.
