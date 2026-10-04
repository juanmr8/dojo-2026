import { useMemo } from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Transition — the timing vocabulary every effect shares, flat in JSX:
   <BlurIn delay={0.2} duration={1.1} stagger={0.035} ease='power1.out' />
   An effect spreads this type into its props and declares only its
   visuals; toTweenVars() turns it into the timing half of a GSAP tween.
   ──────────────────────────────────────────────────────────────────── */

export type Transition = {
	/** Seconds before the first unit starts. */
	delay?: number;
	/** Seconds per unit. */
	duration?: number;
	/** Seconds between units, or GSAP's object form: { each, from: 'center', … }. */
	stagger?: number | gsap.StaggerVars;
	/** Any GSAP ease string. */
	ease?: string;
};

/** Escape hatch: merged last into an effect's tween, wins over everything. */
export type TweenOverrides = {
	from?: gsap.TweenVars;
	to?: gsap.TweenVars;
};

export const TRANSITION_DEFAULTS = {
	delay: 0,
	duration: 0.9,
	stagger: 0.05,
	ease: 'power3.out',
} as const satisfies Required<Transition>;

export function toTweenVars(t: Transition): gsap.TweenVars {
	return {
		delay: t.delay ?? TRANSITION_DEFAULTS.delay,
		duration: t.duration ?? TRANSITION_DEFAULTS.duration,
		stagger: t.stagger ?? TRANSITION_DEFAULTS.stagger,
		ease: t.ease ?? TRANSITION_DEFAULTS.ease,
	};
}

/**
 * The same reference while the JSON is the same, so object props
 * (stagger, vars) written inline can be effect dependencies without
 * rebuilding the timeline on every render.
 */
export function useStable<T>(value: T): T {
	const key = JSON.stringify(value) ?? '';
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(() => value, [key]);
}
