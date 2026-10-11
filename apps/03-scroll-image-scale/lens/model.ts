/* The tile model. Every tile rests in one slot of the strip (x, w as
   fractions of the viewport width; the strip sums to exactly 1), lifts
   off the strip in its own direction and, if it is a scaler, swells
   about its own centre. Each also has a personality, drawn from a seed,
   that says how much of that it does its own way.
   Pure functions; lens/tiles.ts runs them once. */

import { mix, type Lens } from './lens';
import { aspectOf, TILE_COUNT, type Grow, type ImageId } from './strip';

/** A rest slot: left edge and width, fractions of the viewport width. */
export type Slot = { x: number; w: number };

export type StripEntry = {
	image: ImageId;
	grow: Grow;
	weight: number;
	scales: boolean;
};

export type TileModel = {
	key: string;
	image: ImageId;
	rest: Slot;
	/** Which way the tile lifts off the strip in the lens. */
	grow: Grow;
	/** The tile's share of the lens, about 1 (±15%). */
	weight: number;
	/** Whether the tile swells about its centre too, or only moves. */
	scales: boolean;
};

/** The sign of a tile's lift on screen (y grows downwards): up-growers
    rise, down-growers sink. */
export const liftSign = (grow: Grow) => (grow === 'up' ? -1 : 1);

/** A tile's share of the lens's scale: its weight if every tile
    scales or it is a scaler, 0 if it only moves (so it keeps its size,
    the line on it or not). */
export const scaleWeight = (
	tile: Pick<TileModel, 'scales' | 'weight'>,
	all: boolean
) => (all || tile.scales ? tile.weight : 0);

/** A tile's own character in the lens, so the bloom reads hand-made,
    not stamped out. Fixed per tile for a given seed. */
export type Personality = {
	/** Its sideways drift, −1…1, either way whatever its side of the
	    line: about a third barely move, a few wander far. */
	dx: number;
	/** How far it leaves the strip, 0…1.3 (its `grow` says up or down):
	    about a fifth stay on the strip, a few fly. */
	dy: number;
	/** How much it swells, 0.3…1.3: most a little, a few a lot. */
	ds: number;
};

/** mulberry32: a tiny seeded PRNG, uniform on [0, 1). Same seed, same
    run, on the server and in every browser. */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Shares of the strip that play each part. Dealt, not rolled, so
    every seed gets the same cast in a different order. */
const CAST = {
	/** Tiles that barely move sideways. */
	stillX: 0.3,
	/** Tiles that wander far sideways. */
	wildX: 0.12,
	/** Tiles that stay on the strip. */
	stillY: 0.2,
	/** Tiles that fly furthest off the strip. */
	highY: 0.15,
	/** Tiles that swell the most. */
	bigS: 0.15,
} as const;

/** The indices 0…count−1 in a seeded order (Fisher–Yates). */
function shuffled(count: number, rand: () => number): number[] {
	const order = Array.from({ length: count }, (_, i) => i);
	for (let i = count - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[order[i], order[j]] = [order[j], order[i]];
	}
	return order;
}

/** Each tile's place in a seeded order, as a share of the strip
    (0…1): the first `CAST.stillX` of them play still, the next
    `CAST.wildX` wild, and so on. One deal per axis, so parts on the
    same axis never overlap. */
function deal(count: number, rand: () => number): number[] {
	const place = new Array<number>(count);
	shuffled(count, rand).forEach((tile, rank) => (place[tile] = rank / count));
	return place;
}

/** Every tile's personality for a seed. The parts are dealt (a fixed
    share of still, wild, high, big tiles), the amounts within each part
    are rolled and skewed low (r², r³), so most tiles are modest and a
    few are dramatic. Pure and deterministic. */
export function personalities(seed: number, count: number): Personality[] {
	const rand = mulberry32(Math.imul(seed, 0x9e3779b1));
	const [onX, onY, onS] = [
		deal(count, rand),
		deal(count, rand),
		deal(count, rand),
	];
	return Array.from({ length: count }, (_, i) => {
		const [r1, r2, r3, r4] = [rand(), rand(), rand(), rand()];
		const sign = r1 < 0.5 ? -1 : 1;
		const reachX =
			onX[i] < CAST.stillX
				? 0.04 * r2
				: onX[i] < CAST.stillX + CAST.wildX
					? 0.75 + 0.25 * r2
					: 0.12 + 0.43 * r2 ** 2;
		const dy =
			onY[i] < CAST.stillY
				? 0.05 * r3
				: onY[i] < CAST.stillY + CAST.highY
					? 1 + 0.3 * r3
					: 0.35 + 0.6 * r3 ** 2;
		const ds = onS[i] < CAST.bigS ? 1 + 0.3 * r4 : 0.3 + 0.6 * r4 ** 3;
		return { dx: sign * reachX, dy, ds };
	});
}

/** One tile's hand-set values, each optional: its character, and `z`,
    its place in the stack. */
export type TileOverride = Partial<Personality> & { z?: number };

/** Hand-set values per tile index: where a tile's character or stacking
    is chosen, not rolled. */
export type PersonalityOverrides = Readonly<Record<number, TileOverride>>;

/** Tile `index`'s z-index: fixed, its place in the strip counted from 1
    (the rightmost on top), unless an override sets it. Never moves with
    the line. */
export const stackOf = (index: number, overrides: PersonalityOverrides = {}) =>
	overrides[index]?.z ?? index + 1;

/** Tile `index`'s personality for a seed: the seeded cast, with any
    override winning component by component (an override on dx leaves
    the rolled dy and ds alone). Pure. */
export function personalityOf(
	index: number,
	seed: number,
	overrides: PersonalityOverrides = {}
): Personality {
	const rolled = personalities(seed, TILE_COUNT)[index];
	const set = overrides[index] ?? {};
	return {
		dx: set.dx ?? rolled.dx,
		dy: set.dy ?? rolled.dy,
		ds: set.ds ?? rolled.ds,
	};
}

/** A tile's share of the lift: its weight when orderly, its own `dy`
    with mess. */
export const liftShare = (
	tile: Pick<TileModel, 'weight'>,
	own: Personality,
	mess: number
) => mix(tile.weight, own.dy, mess);

/** A tile's share of the scale: its scale weight when orderly, its own
    `ds` with mess. A mover (scaleAll off, not a scaler) keeps its size
    either way. */
export const scaleShare = (
	tile: Pick<TileModel, 'scales' | 'weight'>,
	own: Personality,
	lens: Pick<Lens, 'scaleAll' | 'mess'>
) =>
	mix(
		scaleWeight(tile, lens.scaleAll),
		lens.scaleAll || tile.scales ? own.ds : 0,
		lens.mess
	);

/** Rest slots end to end from 0, each as wide as its image's aspect,
    all scaled so the strip is exactly 1: the viewport width. */
export function restSlots(images: readonly ImageId[]): Slot[] {
	const aspects = images.map(aspectOf);
	const total = aspects.reduce((sum, a) => sum + a, 0);
	let x = 0;
	return aspects.map(a => {
		const slot = { x, w: a / total };
		x += slot.w;
		return slot;
	});
}

export function buildTiles(strip: readonly StripEntry[]): TileModel[] {
	const slots = restSlots(strip.map(e => e.image));
	return strip.map((entry, i) => ({
		key: `${entry.image}-${i}`,
		image: entry.image,
		rest: slots[i],
		grow: entry.grow,
		weight: entry.weight,
		scales: entry.scales,
	}));
}
