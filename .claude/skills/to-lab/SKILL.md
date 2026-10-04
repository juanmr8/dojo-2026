---
name: to-lab
description: Publish a finished Dojo 2026 piece (apps/<slug>) as a Lab item on the portfolio (jmr_v2) — deploy the demo, capture image + loop, add the registry entry with repo and demo links, run the Lab tests, commit. Use when Juan says "to lab", "publish this piece", "add it to the lab", or a piece under apps/ is done.
---

# To Lab

Turns one app under `apps/<slug>` into a Lab item on the portfolio. The
portfolio checkout is `$DEV_PROJECTS/jmr_v2` (the env var is set on both
devices); missing var → stop and hand Juan the export line.

## Procedure

1. **Pull the portfolio.** `git -C "$DEV_PROJECTS/jmr_v2" pull`. Never
   write into an unpulled checkout.

2. **Deploy the demo.** From `apps/<slug>`: `pnpm dlx vercel deploy --prod
   --yes`. First deploy of a piece links a new Vercel project (root =
   the app folder) — that prompt is Juan's, hand it to him. Keep the
   production URL; it is the `live` link.

3. **Capture.** `bash .claude/skills/to-lab/scripts/capture.sh <slug>
   <url> [loop.mp4]` — headless Chrome screenshot at 1600 wide into
   `$DEV_PROJECTS/jmr_v2/public/lab/<slug>/image.png`; an optional loop
   (Juan records 3–6 s with CleanShot) is copied next to it as
   `video.mp4`, the site derives the video path from the image path.
   A static-first-frame screenshot rarely shows the best moment: ask
   Juan for the frame if the piece is motion-only, or take the
   screenshot from the loop with the `--from-video` flag.

4. **Registry entry.** Append to `LAB_PIECES` in
   `$DEV_PROJECTS/jmr_v2/app/lab/_utils/lab-data.ts`:

   ```ts
   {
     slug: "<slug>",
     title: "<Title>",              // two or three words
     image: "/lab/<slug>/image.png",
     description: "<one line: what it does, stack>",
     live: "<vercel production url>",
     code: "https://github.com/juanmr8/dojo-2026/tree/main/apps/<slug>",
     rect: { x, y, w, h },
   },
   ```

   The rect is a hand placement inside `CLUSTER` (3600×2600 design
   units, top-left origin). Read the existing rects, pick a free spot
   near the last-added pieces, keep the piece's aspect (w ≈ 260–460),
   and leave ≥ 40 units to every neighbour, including neighbours
   wrapped across the cluster edges — the test checks overlap across
   the seam.

5. **Verify.** In jmr_v2: `pnpm test:run app/lab` then `pnpm lint`. Red
   → fix the entry (usually the rect), never the tests. If the piece
   uses a foundation, `diff -r foundations/<name> apps/<slug>/<name>`
   must be empty: lift the difference back first (`foundations` skill).

6. **Commit the portfolio.** `git -C "$DEV_PROJECTS/jmr_v2" add public/lab/<slug>
   app/lab/_utils/lab-data.ts && git commit -m "Lab: <Title> (<slug>)"`
   then push. Hand Juan `/lab/<slug>` on the deployed site to eyeball.

## Not this skill's job

Writing the piece, the explainer, or a challenge — those are the piece
session and the future dojo layer. The skill only publishes.
