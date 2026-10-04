'use client';

/* ─────────────────────────────────────────────────────────────────────
   InView — plays the effects it wraps when the trigger enters the
   viewport. One ScrollTrigger per driver, on the TypeSplit root unless
   a `trigger` ref names another element (the section, usually).

   once (default): plays on enter, never again.
   once={false}: reverses when the trigger leaves back above `start`
   and plays again on re-enter. Scrolling past `end` changes nothing.

   <TypeSplit …><InView start='top 85%'><BlurIn /></InView></TypeSplit>
   ──────────────────────────────────────────────────────────────────── */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	type ReactNode,
	type RefObject,
} from 'react';
import { TypeSplitContext } from '../context';
import { DriverContext, type Driver } from '../driver';

gsap.registerPlugin(ScrollTrigger);

export type InViewProps = {
	/** ScrollTrigger syntax: "<trigger edge> <viewport edge>". */
	start?: string;
	end?: string;
	/** Play once (default), or reverse on leaving back above start. */
	once?: boolean;
	/** ScrollTrigger's dev lines showing where start and end sit. */
	markers?: boolean;
	/** Element to watch; defaults to the TypeSplit root. */
	trigger?: RefObject<HTMLElement | null>;
	children: ReactNode;
};

export function InView({
	start = 'top 85%',
	end = 'bottom top',
	once = true,
	markers = false,
	trigger,
	children,
}: InViewProps) {
	const ctx = useContext(TypeSplitContext);
	if (!ctx) throw new Error('<InView> must be used inside <TypeSplit>');
	// `ready` flips in a re-render after mount, once the root's ref is set:
	// a child's layout effect runs before its parent's ref is attached.
	const { root, ready } = ctx;

	const timelines = useRef(new Set<gsap.core.Timeline>());
	const active = useRef(false);

	const driver = useMemo<Driver>(
		() => ({
			attach: tl => {
				timelines.current.add(tl);
				// Re-attached while in view (a Tuner change): catch up.
				if (active.current) tl.play();
				return () => {
					timelines.current.delete(tl);
				};
			},
		}),
		[]
	);

	useLayoutEffect(() => {
		const el = trigger?.current ?? root.current;
		if (!ready || !el) return;

		const st = ScrollTrigger.create({
			trigger: el,
			start,
			end,
			markers,
			onEnter: () => {
				active.current = true;
				timelines.current.forEach(tl => tl.play());
			},
			onLeaveBack: () => {
				if (once) return;
				active.current = false;
				timelines.current.forEach(tl => tl.reverse());
			},
		});

		return () => st.kill();
	}, [ready, root, trigger, start, end, once, markers]);

	return (
		<DriverContext.Provider value={driver}>{children}</DriverContext.Provider>
	);
}
