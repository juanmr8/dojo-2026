import { CONTROLS } from '@/app/controls';
import { describe, expect, it } from 'vitest';
import {
	awayProfile,
	centreOffset,
	driftAt,
	lensShape,
	lapEnded,
	liftAt,
	raisedCosine,
	rewindEase,
	rewindX,
	scaleAt,
	sweepX,
	travel,
	wrap,
	type Lens,
} from './lens';
import {
	liftShare,
	liftSign,
	mulberry32,
	personalities,
	personalityOf,
	stackOf,
	restSlots,
	scaleShare,
	scaleWeight,
	type Personality,
} from './model';
import { IMAGES, STRIP, TILE_COUNT, type ImageId } from './strip';
import { personalitiesFor, TILES } from './tiles';

/** The Tuner's defaults (app/controls.ts). */
type Numeric = {
	[K in keyof typeof CONTROLS]: (typeof CONTROLS)[K] extends boolean
		? never
		: K;
}[keyof typeof CONTROLS];
const v = (k: Numeric) => CONTROLS[k].value;
const lens: Lens = {
	zoneWidth: v('zoneWidth'),
	coreShare: v('coreShare'),
	scale: v('scale'),
	scaleAll: CONTROLS.scaleAll,
	liftY: v('liftY'),
	driftX: v('driftX'),
	mess: v('mess'),
};
/** Today's cast: the default seed's personalities, in strip order. */
const MOODS = personalitiesFor(v('seed'));
/** The same seed's cast as rolled, before the hand-set overrides. */
const ROLLED = TILES.map((_, i) => personalityOf(i, v('seed'), {}));
const OVER = v('overshoot');
const EASE = v('returnEase');
const PHASE = v('phase');
const SPAN = travel(OVER);
/** Half the zone, and half the core: the two cosines' reaches. */
const R = lens.zoneWidth / 2;
const CORE_R = lens.coreShare * R;
/** The same lens with no mess: every tile moves alike, as before. */
const ORDERLY: Lens = { ...lens, mess: 0 };
const mood = (t: Tile) => MOODS[TILES.indexOf(t)];

type Tile = (typeof TILES)[number];
const centre = (t: Tile) => t.rest.x + t.rest.w / 2;

/** Everything one tile does with the line at x. */
const pose = (
	t: Tile,
	x: number,
	l: Lens = lens,
	moods: Personality[] = MOODS
) => {
	const d = centreOffset(x, t.rest);
	const own = moods[TILES.indexOf(t)];
	return {
		scale: scaleAt(d, scaleShare(t, own, l), l),
		lift: liftAt(d, liftShare(t, own, l.mess), l),
		drift: driftAt(d, own.dx, l),
	};
};

const atRest = (x: number, l: Lens = lens, moods: Personality[] = MOODS) =>
	TILES.every(t => {
		const p = pose(t, x, l, moods);
		return p.scale === 1 && p.lift === 0 && p.drift === 0;
	});

/** Evenly spaced samples of [from, to]. */
const samples = (from: number, to: number, n: number) =>
	Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);

const x = (laps: number, over = OVER) => sweepX(laps, PHASE, over);

/** Laps from scroll 0 to the first lap's end, where the line leaves
    the sweep at 1 + overshoot for the rewind. */
const LAP_END = 1 - (PHASE + OVER) / SPAN;

describe('raisedCosine', () => {
	it('is 1 at distance 0, a half at half the radius, exactly 0 from the radius on', () => {
		expect(raisedCosine(0, 0.1)).toBe(1);
		expect(raisedCosine(0.05, 0.1)).toBeCloseTo(0.5, 12);
		expect(raisedCosine(0.1, 0.1)).toBe(0);
		expect(raisedCosine(5, 0.1)).toBe(0);
	});

	it('only falls with distance, either side', () => {
		const c = samples(0, 0.1, 20).map(d => raisedCosine(d, 0.1));
		c.slice(1).forEach((s, i) => expect(s).toBeLessThan(c[i]));
		expect(raisedCosine(-0.03, 0.1)).toBe(raisedCosine(0.03, 0.1));
	});
});

describe('wrap', () => {
	it('folds into [0, size), negatives forwards', () => {
		expect(wrap(0, 1)).toBe(0);
		expect(wrap(1.25, 1)).toBeCloseTo(0.25, 12);
		expect(wrap(-0.1, 1)).toBeCloseTo(0.9, 12);
		expect(wrap(-1e-17, 1)).toBeLessThan(1);
		expect(wrap(-0, 1)).toBe(0);
	});
});

describe('rewindEase', () => {
	it('starts at 0 and ends at 1 at any ease, so the turns never jump', () => {
		for (const e of [0, 0.3, 0.5, 1]) {
			expect(rewindEase(0, e)).toBe(0);
			expect(rewindEase(1, e)).toBeCloseTo(1, 12);
		}
		expect(rewindEase(0.3, 0)).toBe(0.3);
	});
});

describe('sweepX: the scroll drives the sweep, left to right', () => {
	it('starts at the phase heading right and crosses the travel once per lap', () => {
		expect(x(0)).toBeCloseTo(PHASE, 12);
		expect(x(1e-3)).toBeGreaterThan(PHASE);
		const all = samples(0, 1, 20000).map(l => x(l));
		expect(Math.max(...all)).toBeCloseTo(1 + OVER, 3);
		expect(Math.min(...all)).toBeCloseTo(-OVER, 3);
		expect(x(LAP_END - 1e-9)).toBeCloseTo(1 + OVER, 6);
	});

	it('is linear in the scroll, locked to the finger: one travel per lap', () => {
		const h = 1e-6;
		for (const l of [0.1, 0.4, -0.7]) {
			if (Math.abs(l - LAP_END) < 0.01) continue;
			expect((x(l + h) - x(l - h)) / (2 * h)).toBeCloseTo(SPAN, 4);
		}
	});

	it('ends each lap with exactly one cliff, the one the rewind covers', () => {
		const n = 30000;
		const xs = samples(0, 3, n).map(l => x(l));
		const ends = xs.slice(1).filter((now, i) => lapEnded(xs[i], now, OVER));
		expect(ends).toHaveLength(3);
		// Anywhere else a frame's step moves the line a frame's worth.
		xs.slice(1).forEach((now, i) => {
			if (!lapEnded(xs[i], now, OVER))
				expect(now - xs[i]).toBeCloseTo((SPAN * 3) / n, 9);
		});
	});

	it('sees a lap end both ways: down past the right end, up past the left', () => {
		const h = 1e-4;
		expect(lapEnded(x(LAP_END - h), x(LAP_END + h), OVER)).toBe(true);
		expect(lapEnded(x(LAP_END + h), x(LAP_END - h), OVER)).toBe(true);
		expect(lapEnded(x(0.2), x(0.2 + h), OVER)).toBe(false);
	});

	it('reverses exactly: scrolling up retraces scrolling down', () => {
		// x is a pure function of the scroll: no state, no direction.
		const ls = samples(0, 1.5, 3000);
		const down = ls.map(l => x(l));
		const up = [...ls].reverse().map(l => x(l));
		expect(up).toEqual([...down].reverse());
	});

	it('lands on the same x when Lenis wraps the scroll by a whole page', () => {
		// The scrollable length is one lap: Lenis folds the native scroll
		// by ± limit, which is whole laps.
		const limit = 6000;
		for (const scroll of [0, 10, limit - 1, limit, 2 * limit + 333, -45]) {
			const l = scroll / limit;
			expect(x(l + 1)).toBeCloseTo(x(l), 9);
			expect(x(l - 1)).toBeCloseTo(x(l), 9);
		}
	});

	it('clamps a phase outside the travel to its edges', () => {
		expect(sweepX(0, -5, 0.3)).toBeCloseTo(-0.3, 12);
		expect(sweepX(0, 5, 0.3)).toBeCloseTo(-0.3, 12); // the end is the start
	});
});

describe('rewindX: the timed race back', () => {
	it('starts where the sweep left the line and lands where the scroll has it', () => {
		for (const e of [0, 0.5, 1]) {
			expect(rewindX(1, 0.02, 0, e)).toBe(1);
			expect(rewindX(1, 0.02, 1, e)).toBeCloseTo(0.02, 12);
		}
	});

	it('only goes one way, right to left, at any ease', () => {
		for (const e of [0, EASE, 1]) {
			const xs = samples(0, 1, 200).map(s => rewindX(1 + OVER, -OVER, s, e));
			xs.slice(1).forEach((now, i) => expect(now).toBeLessThan(xs[i]));
		}
	});

	it('crosses the whole screen, so every tile blooms as the line passes', () => {
		const back = samples(0, 1, 1000).map(s =>
			rewindX(1 + OVER, -OVER, s, EASE)
		);
		for (const tile of [TILES[0], TILES[TILES.length >> 1], TILES.at(-1)!]) {
			const peak = Math.max(...back.map(p => pose(tile, p, ORDERLY).lift));
			expect(peak).toBeGreaterThan(lens.liftY * tile.weight * 0.9);
		}
	});
});

describe('centreOffset: plain linear distance', () => {
	it('is the tile centre minus the line, signed by side', () => {
		const rest = { x: 0.4, w: 0.04 };
		expect(centreOffset(0.3, rest)).toBeCloseTo(0.12, 12);
		expect(centreOffset(0.5, rest)).toBeCloseTo(-0.08, 12);
		// No wrap: a line far past the right edge is far from the first tile.
		expect(centreOffset(1.2, TILES[0].rest)).toBeLessThan(-1);
	});
});

describe('the strip', () => {
	it('holds TILE_COUNT tiles, every image at least once', () => {
		const ids = TILES.map(t => t.image);
		expect(ids).toHaveLength(TILE_COUNT);
		expect(new Set(ids)).toEqual(new Set(Object.keys(IMAGES) as ImageId[]));
	});

	it('never sets an image beside itself, and spreads its repeats apart', () => {
		STRIP.slice(1).forEach((e, i) => expect(e.image).not.toBe(STRIP[i].image));
		const last = new Map<ImageId, number>();
		STRIP.forEach((e, i) => {
			const prev = last.get(e.image);
			if (prev !== undefined) expect(i - prev).toBeGreaterThanOrEqual(12);
			last.set(e.image, i);
		});
	});

	it('alternates up and down, so neighbours part to opposite sides', () => {
		STRIP.slice(1).forEach((e, i) => expect(e.grow).not.toBe(STRIP[i].grow));
	});

	it('scatters the scalers: about a third, never two side by side', () => {
		const share = STRIP.filter(e => e.scales).length / STRIP.length;
		expect(share).toBeGreaterThan(0.25);
		expect(share).toBeLessThan(0.4);
		STRIP.slice(1).forEach((e, i) =>
			expect(e.scales && STRIP[i].scales).toBe(false)
		);
	});

	it('rests edge to edge from 0 and sums to the viewport width, 1', () => {
		expect(TILES[0].rest.x).toBe(0);
		TILES.slice(1).forEach((t, i) =>
			expect(t.rest.x).toBeCloseTo(TILES[i].rest.x + TILES[i].rest.w, 12)
		);
		const sum = TILES.reduce((total, t) => total + t.rest.w, 0);
		expect(sum).toBeCloseTo(1, 12);
	});

	it('gives each tile a width in proportion to its image aspect', () => {
		const [a, b] = [TILES[0], TILES[2]];
		const aspect = (id: ImageId) => IMAGES[id].w / IMAGES[id].h;
		expect(a.rest.w / b.rest.w).toBeCloseTo(
			aspect(a.image) / aspect(b.image),
			12
		);
	});

	it('fits any run of images into exactly one width', () => {
		const run: ImageId[] = ['monstera', 'snowPeaks', 'candyBalls'];
		const sum = restSlots(run).reduce((s, r) => s + r.w, 0);
		expect(sum).toBeCloseTo(1, 12);
	});

	it('takes each tile its direction, weight and scaler flag from the data, weight within ±15% of 1', () => {
		TILES.forEach((t, i) => {
			expect(t.grow).toBe(STRIP[i].grow);
			expect(t.weight).toBe(STRIP[i].weight);
			expect(t.scales).toBe(STRIP[i].scales);
			expect(Math.abs(t.weight - 1)).toBeLessThanOrEqual(0.15 + 1e-12);
		});
	});

	it('lifts up-growers up the screen and down-growers down', () => {
		expect(liftSign('up')).toBe(-1);
		expect(liftSign('down')).toBe(1);
	});
});

describe('personality: each tile its own character', () => {
	const SEEDS = samples(1, 99, 98);

	it('rolls uniform numbers in [0, 1), the same run for the same seed', () => {
		const a = mulberry32(5);
		const b = mulberry32(5);
		for (let i = 0; i < 1000; i++) {
			const n = a();
			expect(n).toBe(b());
			expect(n).toBeGreaterThanOrEqual(0);
			expect(n).toBeLessThan(1);
		}
	});

	it('is deterministic per seed and different across seeds', () => {
		expect(personalities(23, TILE_COUNT)).toEqual(
			personalities(23, TILE_COUNT)
		);
		expect(personalitiesFor(v('seed'))).toEqual(MOODS);
		expect(personalities(23, TILE_COUNT)).not.toEqual(
			personalities(24, TILE_COUNT)
		);
		expect(personalities(1, TILE_COUNT)).not.toEqual(
			personalities(99, TILE_COUNT)
		);
	});

	it('lets an override replace only its own component', () => {
		expect(stackOf(7)).toBe(8);
		expect(stackOf(7, { 7: { z: 99 } })).toBe(99);
		expect(stackOf(8, { 7: { z: 99 } })).toBe(9);
		const rolled = personalityOf(7, 23);
		expect(rolled).toEqual(personalities(23, TILE_COUNT)[7]);
		const set = personalityOf(7, 23, { 7: { dx: -0.9 } });
		expect(set).toEqual({ ...rolled, dx: -0.9 });
		// Other tiles keep their rolled character.
		expect(personalityOf(8, 23, { 7: { dx: -0.9 } })).toEqual(
			personalityOf(8, 23)
		);
	});

	it('keeps every amount in range, whatever the seed', () => {
		for (const seed of SEEDS)
			for (const p of personalities(seed, TILE_COUNT)) {
				expect(Math.abs(p.dx)).toBeLessThanOrEqual(1);
				expect(p.dy).toBeGreaterThanOrEqual(0);
				expect(p.dy).toBeLessThanOrEqual(1.3);
				expect(p.ds).toBeGreaterThanOrEqual(0.3);
				expect(p.ds).toBeLessThanOrEqual(1.3);
			}
	});

	it('casts still, wild, negative and staying tiles in every seed', () => {
		for (const seed of SEEDS) {
			const cast = personalities(seed, TILE_COUNT);
			const still = cast.filter(p => Math.abs(p.dx) <= 0.04).length;
			const wild = cast.filter(p => Math.abs(p.dx) >= 0.75).length;
			const stay = cast.filter(p => p.dy <= 0.05).length;
			expect(still / TILE_COUNT).toBeCloseTo(0.3, 1);
			expect(wild).toBeGreaterThanOrEqual(3);
			expect(cast.some(p => p.dx < -0.1)).toBe(true);
			expect(cast.some(p => p.dx > 0.1)).toBe(true);
			expect(stay / TILE_COUNT).toBeCloseTo(0.2, 1);
			// Skewed: most tiles modest, a few dramatic.
			const modest = cast.filter(p => Math.abs(p.dx) < 0.5).length;
			expect(modest).toBeGreaterThan(TILE_COUNT / 2);
		}
	});

	it('the default seed sends its wanderers both ways, about half the drifters each side', () => {
		const wild = MOODS.filter(p => Math.abs(p.dx) >= 0.75);
		expect(wild.some(p => p.dx > 0) && wild.some(p => p.dx < 0)).toBe(true);
		const movers = MOODS.filter(p => Math.abs(p.dx) > 0.04);
		const right = movers.filter(p => p.dx > 0).length / movers.length;
		expect(right).toBeGreaterThan(0.35);
		expect(right).toBeLessThan(0.65);
	});
});

describe('mess: from orderly to personal', () => {
	it('at 0 reproduces the orderly lens exactly: lift by weight, scale by scale weight, a push away from the line', () => {
		for (const [i, t] of TILES.entries()) {
			const own = MOODS[i];
			expect(liftShare(t, own, 0)).toBe(t.weight);
			for (const scaleAll of [true, false])
				expect(scaleShare(t, own, { scaleAll, mess: 0 })).toBe(
					scaleWeight(t, scaleAll)
				);
			for (const d of samples(-R - 0.05, R + 0.05, 80))
				expect(driftAt(d, own.dx, ORDERLY)).toBe(
					ORDERLY.driftX * awayProfile(d, R)
				);
		}
	});

	it('at 1 is the personality: dy for the lift, ds for the scale, dx at the line', () => {
		const full = { ...lens, mess: 1 };
		for (const [i, t] of TILES.entries()) {
			const own = MOODS[i];
			const c = centre(t);
			expect(pose(t, c, full).lift).toBeCloseTo(full.liftY * own.dy, 12);
			expect(pose(t, c, full).scale).toBeCloseTo(
				1 + (full.scale - 1) * own.ds,
				12
			);
			expect(pose(t, c, full).drift).toBeCloseTo(full.driftX * own.dx, 12);
		}
	});
});

describe('scale: every tile, or scattered accents', () => {
	it('scales every tile under the line with scaleAll on, by its share', () => {
		for (const l of [ORDERLY, lens]) {
			const all = { ...l, scaleAll: true };
			for (const t of TILES)
				expect(pose(t, centre(t), all).scale).toBeCloseTo(
					1 + (all.scale - 1) * scaleShare(t, mood(t), all),
					12
				);
		}
		for (const t of TILES)
			expect(
				pose(t, centre(t), { ...ORDERLY, scaleAll: true }).scale
			).toBeCloseTo(1 + (lens.scale - 1) * t.weight, 12);
	});
});

describe('scale: scattered accents (scaleAll off)', () => {
	const scalers = TILES.filter(t => t.scales);
	const movers = TILES.filter(t => !t.scales);

	it('only the flagged tiles scale, at any mess: the rest stay 1 with the line on them', () => {
		expect(movers.length).toBeGreaterThan(0);
		for (const mess of [0, 0.5, 1]) {
			const only = { ...lens, scaleAll: false, mess };
			for (const t of movers) {
				for (const d of samples(-R, R, 40))
					expect(pose(t, centre(t) + d, only).scale).toBe(1);
			}
			for (const t of scalers)
				expect(pose(t, centre(t), only).scale).toBeGreaterThan(1);
		}
	});

	it('is exactly 1 once the line is half a zone or more from a tile centre', () => {
		const only = { ...lens, scaleAll: false };
		for (const t of scalers) {
			const c = centre(t);
			for (const p of [c - R, c + R, c + 0.5, c - R - 0.2])
				expect(pose(t, p, only).scale).toBe(1);
		}
	});

	it('takes the orderly scaler under the line to `scale` · weight, the side bands well below', () => {
		const only = { ...ORDERLY, scaleAll: false };
		for (const t of scalers)
			expect(pose(t, centre(t), only).scale).toBeCloseTo(
				1 + (lens.scale - 1) * t.weight,
				12
			);
		const side = scaleAt(CORE_R, 1, lens);
		expect(side).toBeGreaterThan(1);
		expect(side).toBeLessThan(1 + (lens.scale - 1) / 2);
	});

	it('only grows as the line approaches, from either side', () => {
		const only = { ...lens, scaleAll: false };
		for (const t of scalers) {
			for (const side of [-1, 1]) {
				const s = samples(R, 0, 60).map(
					d => pose(t, centre(t) + side * d, only).scale
				);
				s.slice(1).forEach((now, i) =>
					expect(now).toBeGreaterThanOrEqual(s[i])
				);
			}
		}
	});
});

describe('lift: the main move, in strip heights', () => {
	it('is liftY · its share at the line and exactly 0 from half a zone on', () => {
		for (const l of [ORDERLY, lens]) {
			for (const t of TILES) {
				const c = centre(t);
				expect(pose(t, c, l).lift).toBeCloseTo(
					l.liftY * liftShare(t, mood(t), l.mess),
					12
				);
				for (const p of [c - R, c + R, c + 0.7])
					expect(pose(t, p, l).lift).toBe(0);
			}
		}
		for (const t of TILES)
			expect(pose(t, centre(t), ORDERLY).lift).toBeCloseTo(
				lens.liftY * t.weight,
				12
			);
	});

	it('throws the core tiles several strip heights, well past the side bands', () => {
		expect(liftAt(0, 1, lens)).toBeGreaterThanOrEqual(3);
		const side = liftAt(CORE_R, 1, lens);
		expect(side).toBeGreaterThan(0);
		expect(side).toBeLessThan(liftAt(0, 1, lens) / 2);
	});

	it('keeps the lens shape with scaling off', () => {
		const flat = { ...lens, scale: 1 };
		expect(liftAt(0, 1, flat)).toBeCloseTo(lens.liftY, 12);
		expect(lensShape(R / 2, flat)).toBe(lensShape(R / 2, lens));
	});

	it('only rises as the line approaches', () => {
		const l = samples(R, 0, 60).map(d => liftAt(d, 1, lens));
		l.slice(1).forEach((s, i) => expect(s).toBeGreaterThanOrEqual(l[i]));
	});
});

describe('drift: sideways, orderly or personal', () => {
	it('orderly, pushes right of the line rightwards and left leftwards, 0 on the line', () => {
		expect(driftAt(R / 2, 0, ORDERLY)).toBeCloseTo(ORDERLY.driftX, 12);
		expect(driftAt(-R / 2, 0, ORDERLY)).toBeCloseTo(-ORDERLY.driftX, 12);
		expect(driftAt(0, 1, ORDERLY)).toBe(0);
	});

	// The rolled cast only: a hand-set dx may pass ±1 (ITEM_CONTROLS).
	it('never goes past driftX as rolled, and is exactly 0 from half a zone on, at any mess', () => {
		for (const mess of [0, 0.3, 1]) {
			const l = { ...lens, mess };
			for (const own of ROLLED) {
				for (const d of samples(-R, R, 100))
					expect(Math.abs(driftAt(d, own.dx, l))).toBeLessThanOrEqual(
						l.driftX + 1e-15
					);
				for (const d of [R, -R, R + 0.2, -R - 0.4])
					expect(driftAt(d, own.dx, l)).toBe(0);
			}
		}
	});

	it('is continuous as the line crosses a tile centre: no flip, no jump', () => {
		const h = 1e-6;
		const shapeSlope = (Math.PI / 2) * (0.5 / R + 0.5 / CORE_R);
		const most = lens.driftX * Math.max(Math.PI / R, shapeSlope) * 2 * h;
		for (const own of MOODS) {
			const left = driftAt(-h, own.dx, lens);
			const right = driftAt(h, own.dx, lens);
			expect(Math.abs(right - left)).toBeLessThanOrEqual(most);
			// Full personality: the tile under the line keeps its own way.
			if (Math.abs(own.dx) > 0.01)
				expect(Math.sign(left)).toBe(Math.sign(right));
		}
	});
});

describe('past an edge: the strip at rest', () => {
	it('rests every tile, scale 1, no lift, no drift, once the line is more than half a zone past either edge, at any mess and seed', () => {
		for (const seed of [1, v('seed'), 77])
			for (const mess of [0, 0.5, 1]) {
				const l = { ...lens, mess };
				const moods = personalitiesFor(seed);
				for (const p of samples(-1, -R, 50))
					expect(atRest(p, l, moods)).toBe(true);
				for (const p of samples(1 + R, 2, 50))
					expect(atRest(p, l, moods)).toBe(true);
			}
	});
});

describe('the whole motion, sweep and rewind', () => {
	/** One lap of the line: the sweep the scroll drives, left edge to
	    right, then the timed rewind back, n steps each. */
	const lap = (n: number) => [
		...Array.from({ length: n }, (_, i) => x(LAP_END - 1 + i / n)),
		...samples(0, 1, n).map(s => rewindX(1 + OVER, -OVER, s, EASE)),
	];

	/** Walks a lap, and returns, per motion, the worst step as a share
	    of the steepest step the lens allows for that much line travel. */
	const worstSteps = (l: Lens, n: number) => {
		// Steepest change per unit of line travel, per motion.
		const lifts = TILES.map(t => liftShare(t, mood(t), l.mess));
		const scales = TILES.map(t => scaleShare(t, mood(t), l));
		const shapeSlope = (Math.PI / 2) * (0.5 / R + 0.5 / CORE_R);
		const slopes = {
			scale: (l.scale - 1) * Math.max(...scales.map(Math.abs)) * shapeSlope,
			lift: l.liftY * Math.max(...lifts.map(Math.abs)) * shapeSlope,
			drift:
				l.driftX *
				Math.max(Math.PI / R, shapeSlope) *
				Math.max(
					1,
					...ROLLED.map(m => Math.abs(m.dx)),
					...MOODS.map(m => Math.abs(m.dx))
				),
		};
		const posed = (line: number) => TILES.map(tile => pose(tile, line, l));
		const worst = { scale: 0, lift: 0, drift: 0 };
		const keys = ['scale', 'lift', 'drift'] as const;
		const lines = lap(n);
		let prev = posed(lines[0]);
		for (let i = 1; i < lines.length; i++) {
			const now = posed(lines[i]);
			const dx = Math.abs(lines[i] - lines[i - 1]);
			now.forEach((p, j) => {
				for (const k of keys) {
					const r =
						Math.abs(p[k] - prev[j][k]) / (slopes[k] * dx * 1.0001 + 1e-12);
					if (r > worst[k]) worst[k] = r;
				}
			});
			prev = now;
		}
		return worst;
	};

	it('the lap ends where it starts: the rewind lands on the sweep', () => {
		const lines = lap(1000);
		expect(lines.at(-1)).toBeCloseTo(lines[0], 6);
	});

	it('moves every tile continuously through a lap, rewind included, at any mess', () => {
		for (const [l, n] of [
			[lens, 40000],
			[{ ...lens, mess: 0.5 }, 10000],
			[ORDERLY, 10000],
		] as const) {
			const worst = worstSteps(l, n);
			for (const r of Object.values(worst)) {
				expect(r).toBeLessThan(1);
				expect(r).toBeGreaterThan(0);
			}
		}
	});
});
