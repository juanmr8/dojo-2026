/* The piece's taste values, exposed to the Tuner (scroll mode).
   Distances along the strip are fractions of the viewport width (1 =
   the screen), so they hold at any size. Comments say what the eye
   should feel. */

export const CONTROLS = {
	/** The star: how far a tile leaves the strip with the line on it, in
	    strip heights (up-growers rise, down-growers sink), the lens's
	    swell-and-core shape carrying its neighbours less. Each tile takes
	    its own share by its personality: about a fifth stay on the strip,
	    a few fly. 6.5 throws the fliers well into the rules; 0 = the
	    strip stays on its line. */
	liftY: { value: 6.5, min: 0, max: 15, step: 0.1 },
	/** The sideways drift: how far the wildest tile wanders with the
	    line on it (fraction of the screen width). Each tile drifts its
	    own way, left or right whatever its side of the line: about a
	    third hold still, a few wander far, so the bloom frays instead of
	    parting. 0.06 is a couple of tile widths for the wild ones, a
	    nudge for the rest; past ~0.12 the strip shuffles itself. */
	driftX: { value: 0.06, min: 0, max: 0.2, step: 0.001 },
	/** How big a tile gets with the line on it, about its own centre,
	    the lens's shape carrying its neighbours less, each by its own
	    share (most a little, a few a lot). The strip is a hairline, so
	    it takes a big number to read: 7.7 makes the big swellers clear
	    pictures among the movers; 1 = no scaling, movement only. */
	scale: { value: 7.7, min: 1, max: 15, step: 0.1 },
	/** On: every tile scales, each by its own share. Off: only the
	    scattered scalers (about a third, never two side by side) do, and
	    the rest only move. */
	scaleAll: true,
	/** How hand-made the bloom feels: 0 = every tile does the same
	    thing scaled by its distance to the line (lift by weight, a push
	    away from the line, a symmetric hill); 1 = each tile has its own
	    character, drifting, lifting and swelling its own amount. In
	    between, order frays. Outside the zone every tile still rests. */
	mess: { value: 1, min: 0, max: 1, step: 0.01 },
	/** Which personalities the tiles get: reshuffle until the bloom
	    looks right. Every seed casts the same parts (still, wild, high,
	    big) to different tiles. 23 splits the drifters about evenly left
	    and right, and keeps its five wanderers apart along the strip, two
	    of them near the opening line. */
	seed: { value: 23, min: 1, max: 99, step: 1 },
	/** The lens: an area of the strip, not a point. How wide it is,
	    centred on the line (fraction of the screen width; with 40 tiles
	    each rests 0.012–0.035 wide, so 0.59 holds about 24, more than half
	    the strip). Outside it every tile lies flat and still. Narrower = a
	    tight knot of images round the line; wider = the whole strip
	    breathes with it. */
	zoneWidth: { value: 0.59, min: 0.05, max: 1, step: 0.01 },
	/** How much of the zone is the sharp core (fraction of the zone):
	    0.38 holds about 9 tiles, the one under the line and its near
	    neighbours. Smaller = one image punches out of a soft hill;
	    larger = the core blurs into the swell and the shape goes round. */
	coreShare: { value: 0.38, min: 0.05, max: 1, step: 0.01 },
	/** How far past each edge the line runs before the rewind takes it
	    back (fraction of the screen width). 0: the rewind starts the
	    moment the line touches the right edge, and lands on the left
	    edge, the edge tiles mid-bloom both times. Above zoneWidth / 2
	    (0.3 at today's zone) the line leaves the screen first and every
	    tile is flat before the rewind starts: a held beat instead. */
	overshoot: { value: 0, min: 0, max: 1, step: 0.01 },
	/** How long the rewind takes, right edge back to left (seconds): it
	    plays on its own, not with the scroll. 0.45 is a quick rush the
	    eye can still follow, each tile flaring as the line crosses it;
	    shorter = a snap; past ~1 it reads as a second sweep. */
	returnDuration: { value: 0.45, min: 0.1, max: 2, step: 0.05 },
	/** How the rewind moves: 0 = constant speed; 1 = it gathers off the
	    right edge, races through the middle and settles on the left
	    (sine in-out). 0.5 softens the take-off and landing without
	    slowing the race. */
	returnEase: { value: 0.5, min: 0, max: 1, step: 0.05 },
	/** The strip's height at rest, against its natural one (1 = every
	    tile shows its whole image). Thinner = a finer hairline of
	    images, so the lift reads as further; images crop top and
	    bottom. */
	stripThickness: { value: 0.95, min: 0.3, max: 1.5, step: 0.05 },
	/** Where the line stands at the top of the page, on the slow sweep
	    (fraction of the screen width). 0.374 opens on a full bloom just
	    left of centre, with the strip's right end still calm. */
	phase: { value: 0.374, min: 0, max: 1, step: 0.001 },
	/** Scroll length of one lap, one sweep across the screen (vh of
	    scrollable height); the page is exactly one lap, so Lenis's loop
	    is seamless. 260 sweeps the screen in about 260vh, the speed it
	    had when the rewind was scrolled too: longer = a slower sweep, a
	    longer look at each image. */
	lapLength: { value: 260, min: 100, max: 1500, step: 10 },
	/** Lenis glide per frame: low = a heavy, floaty scrub that trails
	    the wheel; 1 = no smoothing, the scrub is locked to the input. */
	scrollLerp: { value: 0.1, min: 0.02, max: 1, step: 0.01 },
};

/** One tile's own values, tuned alone: click a tile (or step with
    ‹ › in the Selected item section) and these sliders start at its own
    values. Copy for Claude brings the moved ones back under `items`;
    they bake into lens/overrides.ts, keyed by the tile's index. */
export const ITEM_CONTROLS = {
	/** Its sideways drift, in driftX units: ±1 is the wildest seeded
	    tile; past it, wider than any seed gives. */
	dx: { min: -1.5, max: 1.5, step: 0.01 },
	/** How far it leaves the strip, in liftY units, away from the strip
	    the way it grows; negative sends it the other way. */
	dy: { min: -2, max: 2, step: 0.01 },
	/** How much it swells, in shares of scale: 0 = never, 1 = the full
	    scale, past it bigger than any seeded tile. */
	ds: { min: 0, max: 2, step: 0.01 },
	/** Its stacking: higher sits on top. Fixed, never driven. */
	z: { min: 0, max: 99, step: 1 },
};
