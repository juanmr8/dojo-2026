'use client';

import { useTuner } from '@juan/tweakit';
import type { Lens } from '@/lens/lens';
import { STRIP_ASPECT } from '@/lens/strip';
import { personalitiesFor, STACK, TILES } from '@/lens/tiles';
import type { CONTROLS } from './controls';
import { ImageTile } from './image-tile';
import { Playhead } from './playhead';
import { Rules } from './rules';
import { usePlayheadX } from './use-playhead-x';

/** A pinned strip of images, exactly the viewport wide, and one
    playhead that sweeps across it as you scroll and, at the right edge,
    races back to the start on its own, a quick timed rewind the scroll
    doesn't drive, forever. The line carries a lens a
    third of the screen wide: a wide swell moving every tile in it a
    little, with a sharp core moving the tiles nearest the line a lot,
    on the sweep and the rewind alike. Tiles lift off the strip, up or
    down, drift sideways, and swell, each by its own personality (a
    seed), so the bloom reads hand-made.
    The page is one lap of scroll (lapLength of scrollable height on top
    of the pinned screen) and Lenis loops it. Reduced motion collapses
    the page to one screen with the line frozen at the phase. */
export function ScrollImageScale() {
	const { values } = useTuner<typeof CONTROLS>();
	const lens: Lens = {
		zoneWidth: values.zoneWidth,
		coreShare: values.coreShare,
		scale: values.scale,
		scaleAll: values.scaleAll,
		liftY: values.liftY,
		driftX: values.driftX,
		mess: values.mess,
	};
	const moods = personalitiesFor(values.seed);
	const x = usePlayheadX(values.phase, values.overshoot, {
		duration: values.returnDuration,
		ease: values.returnEase,
	});

	return (
		<section
			aria-label='A strip of images magnified by a playhead as you scroll'
			className='relative motion-reduce:h-svh!'
			style={{ height: `${values.lapLength + 100}vh` }}
		>
			<div className='sticky top-0 h-svh w-full overflow-clip'>
				<Rules />
				<div
					className='absolute inset-x-0 top-1/2 isolate -translate-y-1/2'
					style={{ aspectRatio: STRIP_ASPECT / values.stripThickness }}
				>
					{TILES.map((tile, i) => (
						<ImageTile
							key={tile.key}
							index={i}
							tile={tile}
							personality={moods[i]}
							z={STACK[i]}
							playheadX={x}
							lens={lens}
						/>
					))}
				</div>
				<Playhead x={x} />
			</div>
		</section>
	);
}
