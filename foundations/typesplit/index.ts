/* One import for a text effect: the root, its contracts, the drivers
   and the effects catalogue. Pieces import from '@/typesplit'. */

export { TypeSplit, type TypeSplitProps } from './typesplit';
export { useTargets } from './use-targets';
export { TypeSplitContext, type Level } from './context';
export { DriverContext, useDriver, type Driver } from './driver';
export {
	TRANSITION_DEFAULTS,
	toTweenVars,
	useStable,
	type Transition,
	type TweenOverrides,
} from './transition';

export { InView, type InViewProps } from './drivers/in-view';
export { Scrub, type ScrubProps } from './drivers/scrub';

export { BlurIn, type BlurInProps, type BlurInVisuals } from './effects/blur-in';
