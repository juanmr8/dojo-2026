# Foundations

Component trees that outlived their piece. Each folder is the source
of truth; a piece gets a copy with
`bash .claude/skills/foundations/scripts/install.sh <slug> <name>` and
imports it as `@/<name>`. Improvements go back here, never stay in a
piece (`.claude/skills/foundations/SKILL.md`).

| Name        | Owns                                                                                                                                                              | Fits when                                                        | Born      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------- |
| `typesplit` | Text split into lines, words, chars: SSR text, screen-reader copy, no-JS and reduced-motion fallbacks, font and line readiness; drivers (`InView`, `Scrub`) that decide when an effect plays; the `Transition` timing vocabulary. Effects: `BlurIn`. | The piece animates text by unit. Any reveal, mask, scramble, stagger. | piece 02 |

Each folder has an `INSTALL.md` the script prints after copying.
