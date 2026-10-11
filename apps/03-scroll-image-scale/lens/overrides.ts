/* Hand-set personalities, by tile index (0 = the leftmost tile), each
   component optional: { 12: { dx: -0.9 } } sends tile 12 far left
   whatever the seed, keeping its rolled lift and swell; { 12: { z: 99 } }
   puts it on top of the stack (by default a tile's z is its place in
   the strip, counted from 1). Empty: every tile plays the part its
   seed deals it. */

import type { PersonalityOverrides } from './model';

export const OVERRIDES: PersonalityOverrides = {
	1: { dy: 0.4, ds: 1.24 },
	2: { dy: 0.49, ds: 0.62 },
	5: { ds: 0.66 },
	6: { dy: 0.69, ds: 0.98 },
	7: { ds: 0.66 },
	10: { dy: 0.88 },
	12: { dx: 1.05, ds: 0.81 },
	13: { ds: 0.62 },
	15: { dx: 0, dy: 0.4, ds: 0.61 },
	18: { dy: 0.41, ds: 0.77 },
	20: { ds: 0.58 },
	21: { dy: 0.58, ds: 0.81 },
	22: { ds: 0.42 },
	24: { dx: 0.16, dy: 0.44, ds: 0.74 },
	25: { dy: 0.48, ds: 0.74 },
	28: { ds: 0.64 },
	29: { dy: -0.2 },
	32: { dy: 0.65, ds: 0.77 },
	35: { dy: 0.55, ds: 0.8 },
	39: { dy: 0.53 },
};
