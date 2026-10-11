/* The strip as data: TILE_COUNT tiles in the order they rest, each
   with its image, the side it lifts to, how far, and whether it also
   scales. Positions are NORMALISED: x and w are fractions of the
   viewport width (0 → 1), so the strip is exactly the screen at any
   size. Vertical positions are fractions of the viewport height. */

/** Each image's pixel size, read from the file (`sips -g pixelWidth
    -g pixelHeight`): its aspect sets its rest width in the strip. */
export const IMAGES = {
	cafeTable: { src: '/images/cafe-table.jpg', w: 1000, h: 666 },
	canalHouses: { src: '/images/canal-houses.jpg', w: 1000, h: 666 },
	candyBalls: { src: '/images/candy-balls.jpg', w: 480, h: 360 },
	cityStreet: { src: '/images/city-street.jpg', w: 750, h: 1000 },
	cliffForest: { src: '/images/cliff-forest.jpg', w: 290, h: 479 },
	coastForest: { src: '/images/coast-forest.jpg', w: 1000, h: 666 },
	concreteBunker: { src: '/images/concrete-bunker.jpg', w: 1000, h: 666 },
	facadeStripes: { src: '/images/facade-stripes.jpg', w: 572, h: 381 },
	frostedGlass: { src: '/images/frosted-glass.jpg', w: 320, h: 480 },
	glassTower: { src: '/images/glass-tower.jpg', w: 429, h: 572 },
	greenGorge: { src: '/images/green-gorge.jpg', w: 1000, h: 662 },
	monstera: { src: '/images/monstera.jpg', w: 320, h: 480 },
	orangeBlur: { src: '/images/orange-blur.jpg', w: 320, h: 480 },
	ravineWaterfall: { src: '/images/ravine-waterfall.jpg', w: 1000, h: 666 },
	rustyMachine: { src: '/images/rusty-machine.jpg', w: 480, h: 320 },
	shopShelves: { src: '/images/shop-shelves.jpg', w: 320, h: 480 },
	snowPeaks: { src: '/images/snow-peaks.jpg', w: 1000, h: 667 },
	snowyRooftops: { src: '/images/snowy-rooftops.jpg', w: 1000, h: 668 },
	tubeLight: { src: '/images/tube-light.jpg', w: 1000, h: 666 },
	wallClock: { src: '/images/wall-clock.jpg', w: 1000, h: 671 },
	whiteBuilding: { src: '/images/white-building.jpg', w: 339, h: 480 },
	whiteTiger: { src: '/images/white-tiger.jpg', w: 389, h: 692 },
	woodenShed: { src: '/images/wooden-shed.jpg', w: 1000, h: 664 },
	workshopHands: { src: '/images/workshop-hands.jpg', w: 320, h: 480 },
} as const satisfies Record<string, { src: string; w: number; h: number }>;

export type ImageId = keyof typeof IMAGES;

export const aspectOf = (id: ImageId) => IMAGES[id].w / IMAGES[id].h;

/** Which way a tile leaves the strip in the lens: `up` rises above
    it, `down` sinks below it. */
export type Grow = 'up' | 'down';

/** The curated run, every image once, left to right. Neighbours
    contrast in subject and colour (warm / cool, built / grown, light /
    dark, landscape / portrait), and the ends (last, first) do too, so
    the run can repeat. `grow` alternates so every pair of neighbours
    parts to opposite sides of the strip. `weight`
    is the tile's share of the lens, 0.85–1.15 around 1, so the swell
    never looks stamped out: two tiles at the same distance from the
    line move a little differently. */
const CURATED: readonly { image: ImageId; grow: Grow; weight: number }[] = [
	{ image: 'orangeBlur', grow: 'up', weight: 0.95 },
	{ image: 'glassTower', grow: 'down', weight: 1.1 },
	{ image: 'woodenShed', grow: 'up', weight: 0.85 },
	{ image: 'snowPeaks', grow: 'down', weight: 1 },
	{ image: 'candyBalls', grow: 'up', weight: 1.05 },
	{ image: 'concreteBunker', grow: 'down', weight: 0.9 },
	{ image: 'monstera', grow: 'up', weight: 1.15 },
	{ image: 'wallClock', grow: 'down', weight: 0.85 },
	{ image: 'canalHouses', grow: 'up', weight: 1 },
	{ image: 'whiteTiger', grow: 'down', weight: 1.15 },
	{ image: 'tubeLight', grow: 'up', weight: 0.9 },
	{ image: 'whiteBuilding', grow: 'down', weight: 1.05 },
	{ image: 'rustyMachine', grow: 'up', weight: 0.95 },
	{ image: 'coastForest', grow: 'down', weight: 0.85 },
	{ image: 'shopShelves', grow: 'up', weight: 1.1 },
	{ image: 'snowyRooftops', grow: 'down', weight: 0.95 },
	{ image: 'greenGorge', grow: 'up', weight: 0.9 },
	{ image: 'facadeStripes', grow: 'down', weight: 1 },
	{ image: 'cafeTable', grow: 'up', weight: 0.85 },
	{ image: 'frostedGlass', grow: 'down', weight: 1.15 },
	{ image: 'cliffForest', grow: 'up', weight: 1.05 },
	{ image: 'workshopHands', grow: 'down', weight: 0.95 },
	{ image: 'ravineWaterfall', grow: 'up', weight: 0.9 },
	{ image: 'cityStreet', grow: 'down', weight: 1.1 },
];

/** How many tiles rest in the strip, edge to edge across the screen:
    the more, the thinner each one. Change it freely; the strip repeats
    the curated run to fill it. */
export const TILE_COUNT = 40;

/** Gaps between scalers, in tiles, cycled from the first scaler at
    index 1: never 1, so no two scalers touch, and uneven, so they read
    as accents scattered along the strip, not a beat. Averages 3: about
    a third of the tiles scale, the rest only move. */
const SCALER_GAPS = [3, 2, 4] as const;

/** Is tile i a scaler? Deterministic: walk the gaps from index 1. */
function isScaler(i: number): boolean {
	let at = 1;
	for (let k = 0; at < i; k++) at += SCALER_GAPS[k % SCALER_GAPS.length];
	return at === i;
}

/** The strip, left to right: the curated run cycled to TILE_COUNT, so
    an image repeats a whole run (24 tiles) after itself, never beside
    itself, and up / down keeps alternating (the run is even). `scales`
    marks the scalers: they swell about their centre as well as moving. */
export const STRIP: readonly {
	image: ImageId;
	grow: Grow;
	weight: number;
	scales: boolean;
}[] = Array.from({ length: TILE_COUNT }, (_, i) => ({
	...CURATED[i % CURATED.length],
	scales: isScaler(i),
}));

/** Sum of the strip's aspects: its own aspect at thickness 1,
    where every tile shows its whole image. */
export const STRIP_ASPECT = STRIP.reduce(
	(sum, t) => sum + aspectOf(t.image),
	0
);

/** The background rules, as fractions of the viewport height,
    symmetric about the strip at the middle. */
export const RULES_Y = [0.095, 0.257, 0.419, 0.581, 0.743, 0.905] as const;

/** The playhead's chrome, in px (it does not scale with the screen):
    a 1px line and two triangles, the top one pointing down, the bottom
    one pointing up, `inset` from the viewport's top and bottom. */
export const PLAYHEAD = {
	triangle: { w: 24.2487, h: 21, inset: 2 },
	lineInset: 29,
} as const;
