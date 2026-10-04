'use client';

/* ─────────────────────────────────────────────────────────────────────
   BlurIn — words (or chars, or lines) arrive out of focus and settle.
   Headless: renders nothing, animates the TypeSplit units it targets.

   Builds its timeline paused, from-state rendered at once, and hands
   it to the driver: no driver plays it now, InView plays it on enter,
   Scrub ties it to the scroll. Runs in a layout effect so the
   from-state lands in the frame the root drops its pending mark.
   Rebuilds when any option changes (the Tuner relies on that) and when
   the root rebuilds its lines on a width change, which replays a load:
   known limitation, fine for a title.
   ──────────────────────────────────────────────────────────────────── */

import gsap from 'gsap';
import { useLayoutEffect } from 'react';
import type { Level } from '../context';
import { useDriver } from '../driver';
import {
	toTweenVars,
	useStable,
	type Transition,
	type TweenOverrides,
} from '../transition';
import { useTargets } from '../use-targets';

export type BlurInVisuals = {
	target?: Level;
	/** Starting blur radius in px. */
	blur?: number;
	/** Starting vertical offset in px; positive rises from below. */
	rise?: number;
};

export type BlurInProps = BlurInVisuals &
	Transition & {
		/** Merged last into the tween; wins over everything. */
		vars?: TweenOverrides;
		/** Receives the timeline once built, for scrubbing or sequencing. */
		onTimeline?: (tl: gsap.core.Timeline | null) => void;
	};

export function BlurIn({
	target = 'word',
	blur = 12,
	rise = 12,
	delay,
	duration,
	stagger: staggerProp,
	ease,
	vars: varsProp,
	onTimeline,
}: BlurInProps) {
	const targets = useTargets(target);
	const { attach } = useDriver();
	const stagger = useStable(staggerProp);
	const vars = useStable(varsProp);

	useLayoutEffect(() => {
		if (!targets?.length) return;

		const tl = gsap.timeline({
			paused: true,
			onComplete: () => gsap.set(targets, { willChange: 'auto' }),
		});
		tl.fromTo(
			targets,
			{
				opacity: 0,
				filter: `blur(${blur}px)`,
				y: rise,
				willChange: 'filter, transform',
				...vars?.from,
			},
			{
				opacity: 1,
				filter: 'blur(0px)',
				y: 0,
				...toTweenVars({ delay, duration, stagger, ease }),
				...vars?.to,
			}
		);
		const detach = attach(tl);
		onTimeline?.(tl);

		return () => {
			onTimeline?.(null);
			detach();
			tl.kill();
			gsap.set(targets, { clearProps: 'all' });
		};
	}, [
		targets,
		blur,
		rise,
		delay,
		duration,
		stagger,
		ease,
		vars,
		attach,
		onTimeline,
	]);

	return null;
}
