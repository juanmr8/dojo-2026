/* One record per tile of the strip: rest slot, lift direction,
   weight, scaler or not; and its personality, per seed. */

import { buildTiles, personalityOf, stackOf } from './model';
import { OVERRIDES } from './overrides';
import { STRIP } from './strip';

export const TILES = buildTiles(STRIP);

/** Every tile's personality for a seed, in strip order, the hand-set
    overrides winning over the rolled values. */
/** Every tile's fixed z-index, in strip order. */
export const STACK = TILES.map((_, i) => stackOf(i, OVERRIDES));

export const personalitiesFor = (seed: number) =>
	TILES.map((_, i) => personalityOf(i, seed, OVERRIDES));
