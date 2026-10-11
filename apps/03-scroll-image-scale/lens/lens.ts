/* The lens: pure maths, no React. Scroll is the one input; the
   playhead's x is a function of it, and every tile's motion is a
   function of the line's signed offset to that tile's rest centre.

   A wide swell carries a sharp core. The lens is a zone about a third
   of the screen wide, centred on the line: inside it a broad, gentle
   raised cosine moves every tile a little, and a narrow, tall one on
   top moves the few tiles nearest the line a lot. Outside the zone a
   tile sits exactly at rest: scale 1, no translate.

   Movement is the effect, scale supports it: a tile in the zone lifts
   off the strip (its own direction, up or down) by the lens's shape,
   drifts sideways, and, if it is one of the scattered scalers, swells
   about its centre. `mess` decides how alike they do it: at 0 every
   tile follows the same profile (lift by its weight, a push away from
   the line); at 1 each follows its own personality (lens/model.ts),
   still inside the same envelope, so the strip rests exactly as before.

   Units are normalised: 1 is the viewport width. The tiles fill
   [0, 1), the screen. Each lap of scroll the playhead SWEEPS left to
   right, locked to the scroll, from `overshoot` past the left edge to
   `overshoot` past the right. There the scroll's lap ends and the line
   would jump back; instead it REWINDS on its own clock, a quick eased
   race right to left that the scroll doesn't drive, the lens still on,
   so every tile it crosses blooms and settles on the way (rewindX; the
   clock is app/use-playhead-x.ts). Scrolling up does the same the other
   way. Distances are plain linear distances. */

export type Lens = {
	/** The lens's full width (fraction of the viewport width), centred
	    on the line: a tile whose centre is more than half of it away
	    rests. */
	zoneWidth: number;
	/** The core's width as a fraction of the zone (0–1). */
	coreShare: number;
	/** A scaler's scale with the line on its centre (1 = no scaling,
	    movement only). The lens's shape carries its neighbours less. */
	scale: number;
	/** Every tile scales (true), or only the scattered scalers. */
	scaleAll: boolean;
	/** How far the tile under the line lifts off the strip, in strip
	    heights (its own height at rest). */
	liftY: number;
	/** How far a tile drifts sideways at most, as a fraction of the
	    viewport width. */
	driftX: number;
	/** 0 = every tile moves alike, by distance alone; 1 = each moves by
	    its own personality. Blends every amount between the two. */
	mess: number;
};

/** a at t = 0, b at t = 1, a straight line between. */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The lens's half-width: the swell's reach either side of the line. */
const reach = (lens: Lens) => lens.zoneWidth / 2;

/** A raised cosine of half-width `radius`: 1 at distance 0, easing to
    0 at `radius` and staying there. Flat at both ends, so a tile
    neither jumps when the zone reaches it nor when it leaves. */
export function raisedCosine(distance: number, radius: number): number {
	const d = Math.abs(distance);
	if (d >= radius) return 0;
	return 0.5 * (1 + Math.cos((Math.PI * d) / radius));
}

/** A tile's uniform scale: exactly 1 outside the zone, rising to
    `scale` at the line by the lens's shape. A tile that only moves
    passes weight 0. */
export function scaleAt(distance: number, weight: number, lens: Lens): number {
	return 1 + (lens.scale - 1) * weight * lensShape(distance, lens);
}

/** The largest scale the lens ever gives a full-weight tile. */
export const maxScale = (lens: Lens) => Math.max(lens.scale, 1);

/** The lens's shape: the swell and the core in equal parts, 1 at the
    line, 0 from half a zone on. Drives the lift and the scale alike,
    each with its own amount. */
export function lensShape(distance: number, lens: Lens): number {
	const radius = reach(lens);
	return (
		0.5 * raisedCosine(distance, radius) +
		0.5 * raisedCosine(distance, lens.coreShare * radius)
	);
}

/** How far a tile lifts off the strip, in strip heights (the tile's
    own `grow` says up or down; a negative weight, hand-set, flips it).
    liftY · weight at the line, exactly 0 outside the zone (never -0). */
export function liftAt(distance: number, weight: number, lens: Lens): number {
	const shape = lensShape(distance, lens);
	if (shape === 0) return 0;
	return lens.liftY * weight * shape;
}

/** The orderly sideways push, signed by the side of the line: +1
    pushes right. sin² of π·d / reach, so it is 0 AT the line with a
    flat slope (the tile under the line holds still and slides through
    0 as the line crosses its centre, no flip), peaks at half the
    reach, and eases back to 0 at the zone's edge, flat again (no kink
    as a tile enters or leaves). */
export function awayProfile(offset: number, radius: number): number {
	const d = Math.abs(offset);
	if (d >= radius) return 0;
	return Math.sign(offset) * Math.sin((Math.PI * d) / radius) ** 2;
}

/** How far a tile drifts sideways (fraction of the viewport width),
    `offset` being its rest centre minus the line. Orderly (mess 0) it
    is pushed away from the line; with personality (mess 1) it drifts
    its own way, `dx` (−1…1), by the lens's shape: the most with the
    line on it, no flip as the line crosses, 0 at the zone's edge. */
export function driftAt(offset: number, dx: number, lens: Lens): number {
	const orderly = awayProfile(offset, reach(lens));
	const own = dx * lensShape(offset, lens);
	return lens.driftX * mix(orderly, own, lens.mess);
}

/** The signed offset of a tile's rest centre from the line: positive
    when the tile is right of it. */
export const centreOffset = (line: number, rest: { x: number; w: number }) =>
	rest.x + rest.w / 2 - line;

/** A true modulo: n folded into [0, size), negative n included
    (JS's % keeps the dividend's sign: -1 % 1 is -1, not 0.x). */
export function wrap(n: number, size: number): number {
	const folded = ((n % size) + size) % size;
	// (-tiny % size) + size rounds to size itself in floating point.
	return folded === size ? 0 : folded;
}

/** The line's whole travel, one sweep: from overshoot past the left
    edge to overshoot past the right, 1 + 2 · overshoot. */
export const travel = (overshoot: number) => 1 + 2 * overshoot;

/** The rewind's ease on [0, 1] → [0, 1]: a blend of linear and a sine
    ease-in-out. Both end at 0 and 1, so any blend starts where the
    sweep left the line and lands where the scroll has it. */
export function rewindEase(s: number, ease: number): number {
	const sine = 0.5 * (1 - Math.cos(Math.PI * s));
	return s + ease * (sine - s);
}

/** Scroll to the line's x on the sweep. `laps` is the unbounded scroll
    in laps (any real number): x is linear in it, because the playhead
    is the scroll and should feel locked to the finger, and runs the
    travel once per lap, from −overshoot to 1 + overshoot, then starts
    again: a sawtooth whose drop is a cliff, covered by the timed
    rewind. `phase` is where the line stands at laps = 0 (clamped to the
    travel). Periodic in whole laps, so Lenis's own wrap of the native
    scroll (± one page, one lap) leaves x exactly where it was; and x is
    a pure function of scroll, so scrolling up retraces it exactly. */
export function sweepX(laps: number, phase: number, overshoot: number): number {
	const span = travel(overshoot);
	const start = Math.min(Math.max(phase, -overshoot), 1 + overshoot);
	return span * wrap((start + overshoot) / span + laps, 1) - overshoot;
}

/** Did the sweep cross a lap's end between two frames? A frame moves the
    line a sliver of its travel; only the cliff moves it more than half. */
export const lapEnded = (from: number, to: number, overshoot: number) =>
	Math.abs(to - from) > travel(overshoot) / 2;

/** The line on the rewind, `s` (0–1) of the way through it: from where
    the sweep left it to where the scroll has it now, eased. */
export const rewindX = (from: number, to: number, s: number, ease: number) =>
	mix(from, to, rewindEase(s, ease));
