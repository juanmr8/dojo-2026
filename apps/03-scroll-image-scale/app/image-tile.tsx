'use client';

import {
	centreOffset,
	driftAt,
	liftAt,
	maxScale,
	scaleAt,
	type Lens,
} from '@/lens/lens';
import {
	liftShare,
	liftSign,
	scaleShare,
	type Personality,
	type TileModel,
} from '@/lens/model';
import { IMAGES } from '@/lens/strip';
import { useTunerItem } from '@juan/tweakit';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { TileImage } from './tile-image';

/** One tile at its rest slot in the strip, moved by the line's signed
    offset to its rest centre. Mostly it travels: it lifts off the strip
    (rises if it grows up, sinks if down) by the lens's shape, and drifts
    sideways; a scaler (about a third of the tiles, scattered) also
    swells about its centre. How far each goes is its own `personality`
    as `mess` rises, so no two tiles bloom alike. Exactly at rest outside
    the lens's zone, so the strip lines up perfectly whenever the line
    is far. Its z-index is fixed (`z`, from lens/overrides.ts or its
    place in the strip), so the stacking is authored, not driven.
    Its personality and z are a tweakit Item (`index`): click it in dev
    to tune them alone. Transform only, never its box. */
export function ImageTile({
	index,
	tile,
	personality: seeded,
	z: stacked,
	playheadX,
	lens,
}: {
	index: number;
	tile: TileModel;
	personality: Personality;
	z: number;
	playheadX: MotionValue<number>;
	lens: Lens;
}) {
	const { rest, grow } = tile;
	const { z, ...personality } = useTunerItem(index, { ...seeded, z: stacked });
	const lift = liftShare(tile, personality, lens.mess);
	const swell = scaleShare(tile, personality, lens);
	const offset = useTransform(playheadX, line => centreOffset(line, rest));
	const scale = useTransform(offset, d => scaleAt(d, swell, lens));
	// Translate % is of the tile's own unscaled box: y in strip heights.
	const y = useTransform(
		offset,
		d => `${liftSign(grow) * liftAt(d, lift, lens) * 100}%`
	);
	const x = useTransform(
		offset,
		d => `${driftAt(d, personality.dx, lens) * 100}vw`
	);
	// Largest it is ever drawn, as a share of the viewport width.
	const sizes = `${Math.ceil(rest.w * (1 + swell * (maxScale(lens) - 1)) * 100)}vw`;
	return (
		<motion.div
			data-tile={tile.image}
			data-tweakit-item={index}
			className='absolute top-0 h-full overflow-hidden will-change-transform'
			style={{
				left: `${rest.x * 100}%`,
				width: `${rest.w * 100}%`,
				zIndex: z,
				x,
				y,
				scale,
			}}
		>
			<TileImage src={IMAGES[tile.image].src} sizes={sizes} />
		</motion.div>
	);
}
