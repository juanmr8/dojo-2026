'use client';

import { lapEnded, rewindX, sweepX } from '@/lens/lens';
import { useLenis } from 'lenis/react';
import {
	animate,
	useMotionValue,
	useReducedMotion,
	type AnimationPlaybackControls,
	type MotionValue,
} from 'motion/react';
import { useEffect, useRef } from 'react';

/** The rewind: how long it takes (s) and how it eases (0 = constant
    speed, 1 = sine in-out). */
export type Rewind = { duration: number; ease: number };

/** The playhead's x (fraction of the viewport width, in
    [−overshoot, 1 + overshoot]) as a motion value. No React state, no
    re-render.

    The sweep is the scroll: Lenis's UNBOUNDED scroll (animatedScroll,
    which runs below 0 and past the limit with `infinite`), in laps, the
    page's scroll limit being exactly one lap. sweepX is periodic in
    whole laps, so when Lenis wraps the native scroll x doesn't move.

    The rewind is time: when the sweep reaches a lap's end (lapEnded,
    the scroll's x jumping from one end of the travel to the other), the
    line doesn't jump with it but races there over `rewind.duration`,
    aiming at wherever the scroll has the line meanwhile, so it lands on
    the sweep exactly and hands back to the scroll. A lap's end mid-
    rewind (a flick back) starts a new rewind from where the line is.
    Scrolling up past the start rewinds the other way.

    Reduced motion: no Lenis, the line stands at `phase`. */
export function usePlayheadX(
	phase: number,
	overshoot: number,
	rewind: Rewind
): MotionValue<number> {
	const { duration, ease } = rewind;
	const x = useMotionValue(phase);
	const reduced = useReducedMotion();
	/** Where the scroll has the line, last frame; null before the first. */
	const scrolled = useRef<number | null>(null);
	const running = useRef<AnimationPlaybackControls | null>(null);

	useLenis(
		lenis => {
			if (lenis.limit <= 0) return;
			const next = sweepX(lenis.animatedScroll / lenis.limit, phase, overshoot);
			const prev = scrolled.current;
			scrolled.current = next;
			if (prev !== null && lapEnded(prev, next, overshoot)) {
				running.current?.stop();
				const from = x.get();
				running.current = animate(0, 1, {
					duration,
					ease: 'linear',
					onUpdate: s =>
						x.set(rewindX(from, scrolled.current ?? next, s, ease)),
					onComplete: () => (running.current = null),
				});
				return;
			}
			if (!running.current) x.set(next);
		},
		[phase, overshoot, duration, ease]
	);

	useEffect(() => () => running.current?.stop(), []);

	useEffect(() => {
		if (reduced) x.set(phase);
	}, [reduced, phase, x]);

	return x;
}
