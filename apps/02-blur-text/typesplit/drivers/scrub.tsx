'use client';

/* ─────────────────────────────────────────────────────────────────────
   Scrub — ties the effects it wraps to the scroll position between
   `start` and `end`. The attached timelines sit at time 0 on one
   master timeline that a single ScrollTrigger scrubs. `scrub` is the
   lag in seconds; true locks it to the finger.

   <TypeSplit …>
     <Scrub start='top 80%' end='top 30%' scrub={0.5}><BlurIn /></Scrub>
   </TypeSplit>
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

export type ScrubProps = {
	/** ScrollTrigger syntax: "<trigger edge> <viewport edge>". */
	start?: string;
	end?: string;
	/** Lag in seconds, or true for no lag. */
	scrub?: number | boolean;
	/** ScrollTrigger's dev lines showing where start and end sit. */
	markers?: boolean;
	/** Element to watch; defaults to the TypeSplit root. */
	trigger?: RefObject<HTMLElement | null>;
	children: ReactNode;
};

export function Scrub({
	start = 'top 80%',
	end = 'top 30%',
	scrub = true,
	markers = false,
	trigger,
	children,
}: ScrubProps) {
	const ctx = useContext(TypeSplitContext);
	if (!ctx) throw new Error('<Scrub> must be used inside <TypeSplit>');
	// `ready` flips in a re-render after mount, once the root's ref is set:
	// a child's layout effect runs before its parent's ref is attached.
	const { root, ready } = ctx;

	const master = useRef<gsap.core.Timeline | null>(null);
	const st = useRef<ScrollTrigger | null>(null);

	const driver = useMemo<Driver>(
		() => ({
			attach: tl => {
				master.current ??= gsap.timeline({ paused: true });
				// A paused child never advances inside its parent.
				tl.paused(false);
				master.current.add(tl, 0);
				st.current?.refresh();
				return () => {
					master.current?.remove(tl);
					st.current?.refresh();
				};
			},
		}),
		[]
	);

	useLayoutEffect(() => {
		const el = trigger?.current ?? root.current;
		if (!ready || !el) return;

		master.current ??= gsap.timeline({ paused: true });
		const instance = ScrollTrigger.create({
			trigger: el,
			start,
			end,
			scrub,
			markers,
			animation: master.current,
		});
		st.current = instance;

		return () => {
			instance.kill();
			st.current = null;
		};
	}, [ready, root, trigger, start, end, scrub, markers]);

	return (
		<DriverContext.Provider value={driver}>{children}</DriverContext.Provider>
	);
}
