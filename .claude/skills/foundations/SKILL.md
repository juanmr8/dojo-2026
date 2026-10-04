---
name: foundations
description: Reuse the dojo's foundational components (foundations/<name>, e.g. typesplit for any text effect) in a piece — check the catalogue against the brief, install the one that fits with the script, build the piece's effect on top, and lift improvements back to the source. Use at the start of every piece, when Juan says "use the foundation", "install typesplit", "lift this back", or when a piece is about to write a primitive that already exists.
---

# Foundations

A foundation is a component tree that has outlived its piece: the
outer layers own the contracts (markup, accessibility, fallbacks,
timing), the inner children are where a piece puts its idea. The
source of truth is `foundations/<name>/`; a piece works on an
installed copy and imports it as `@/<name>`. Catalogue:
`foundations/README.md`.

## 1. Check the catalogue before writing a primitive

Read `foundations/README.md` against the brief. A foundation fits when
the piece animates the thing it owns (text → `typesplit`). It is not
a fit when the brief is about the primitive itself (a new way to split
text is a new foundation, not an effect). Say which one you chose and
why in one line; then do not write what it already does.

## 2. Install

    bash .claude/skills/foundations/scripts/install.sh <slug> <name>

Copies the folder, tests included, into `apps/<slug>/<name>/` and
prints the foundation's `INSTALL.md`: the import line, the minimal
usage, how to add an effect. Already installed → the script stops and
tells you to diff first; `--force` takes the source copy.

Tests travel with the copy. The piece needs Vitest + jsdom + Testing
Library and `include: ['**/*.test.{ts,tsx}']` in its vitest config;
piece 02 is the setup to copy (`docs/testing.md`).

## 3. Build on it

The piece's own work goes next to the copy, never inside it:
`app/effects/<name>.tsx` for a new effect, `app/presets/<name>.tsx`
for a composed one (rules in `docs/agents/coding-standards.md`). The
foundation's `effects/` folder is the catalogue of effects that
earned their place, with the first one as the reference.

## 4. Lift back

Anything that generalises leaves the piece before the piece is done:

- A fix or improvement inside the installed copy → apply it in
  `foundations/<name>/` with a test, then reinstall with `--force`.
  `diff -r -x INSTALL.md foundations/<name> apps/<slug>/<name>` must be empty when
  the piece is published; the `to-lab` check asks for it.
- An effect that a second piece would want → move it to
  `foundations/<name>/effects/`, export it from `index.ts`, add it to
  the catalogue line in `README.md`.
- A change to a contract (a new prop on the root, a new driver) →
  design it with two consumers in mind, as the drivers were (see
  `docs/RECORD.md`, 2026-10-04).

Presets and tuned values never lift: they are the piece's taste.

## 5. A new foundation

When a piece's primitive is the second time the same contracts were
needed: move it to `foundations/<name>/` with `index.ts`, tests and an
`INSTALL.md`, add a line to the catalogue, and install it back into
the piece that gave birth to it.
