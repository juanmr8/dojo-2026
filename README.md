# Dojo 2026

Creative-development practice, one piece at a time. Every folder under
`apps/` is a standalone Next.js app exploring one thing: a paragraph
reveal, a scroll-driven sequence, a shader. Finished pieces land on the
Lab at [juanmoraromero.com/lab](https://www.juanmoraromero.com/lab).

## Start a piece

```
./scripts/new-piece.sh 01-paragraph-reveal
cd apps/01-paragraph-reveal && pnpm dev
```

The script spins up Next.js (App Router, TypeScript, Tailwind v4) with
Motion, GSAP and Prettier, and an empty page. Each app keeps its own
dependencies and lockfile. What pieces share lives in `foundations/`
(component trees that outlived their piece, such as `typesplit` for
text effects) and is installed into an app as a copy:

```
bash .claude/skills/foundations/scripts/install.sh 02-blur-text typesplit
```

## Publish a piece

Deploy the app on Vercel (root directory = the app folder), then the
`to-lab` skill in `.claude/skills/` captures it and adds the Lab entry
with the repo and demo links.

## Pieces

- (none yet)
