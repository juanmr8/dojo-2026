'use client';

/* ─────────────────────────────────────────────────────────────────────
   BlurTitle — the blur-in title in its flavours: load, in-view, scrub.
   The tuned values live in BLUR_TITLE at the top. A project installs
   the typesplit foundation and copies this file, then edits that one
   constant. `options` overrides it per instance: top-level keys are
   replaced, `transition` keys merge.

   <BlurTitle text='…' as='h1' />
   <BlurTitle text='…' as='h2' options={{ trigger: { type: 'in-view', start: 'top 85%' } }} />
   <BlurTitle text='…' options={{ trigger: { type: 'scrub', start: 'top 80%', end: 'top 30%', scrub: 0.5 } }} />
   ──────────────────────────────────────────────────────────────────── */

import type { ReactNode, RefObject } from 'react';
import {
	BlurIn,
	InView,
	Scrub,
	TypeSplit,
	type Transition,
	type TypeSplitProps,
} from '@/typesplit';

type Watch = {
	start?: string;
	end?: string;
	markers?: boolean;
	/** Element to watch; defaults to the title itself. */
	ref?: RefObject<HTMLElement | null>;
};

export type Trigger =
	| { type: 'load' }
	| ({ type: 'in-view'; once?: boolean } & Watch)
	| ({ type: 'scrub'; scrub?: number | boolean } & Watch);

export type BlurTitleOptions = {
	transition: Transition;
	/** Starting blur radius in px. */
	blur: number;
	/** Starting vertical offset in px; negative drops from above. */
	rise: number;
	trigger: Trigger;
};

/* The tuned values. Edit here, never in JSX. Soft: barely any rise, a
   near-linear ease; the blur and the stagger do the work. */
export const BLUR_TITLE: BlurTitleOptions = {
	transition: { delay: 0, duration: 1.1, stagger: 0.035, ease: 'power1.out' },
	blur: 5,
	rise: -1,
	trigger: { type: 'load' },
};

/* Saved for the stenrosets project: the same feel in two flavours.
   <BlurTitle text='…' options={STENROSETS.scrub} /> */
export const STENROSETS = {
	load: BLUR_TITLE,
	scrub: {
		...BLUR_TITLE,
		trigger: { type: 'scrub', start: 'top 80%', end: 'top 30%', scrub: 0.5 },
	},
} satisfies Record<string, BlurTitleOptions>;

export type BlurTitleProps = Pick<
	TypeSplitProps,
	'text' | 'as' | 'className'
> & {
	options?: Partial<BlurTitleOptions>;
};

export function BlurTitle({ text, as, className, options }: BlurTitleProps) {
	const o: BlurTitleOptions = {
		...BLUR_TITLE,
		...options,
		transition: { ...BLUR_TITLE.transition, ...options?.transition },
	};

	return (
		<TypeSplit as={as} text={text} split={['word']} className={className}>
			{drive(
				o.trigger,
				<BlurIn {...o.transition} blur={o.blur} rise={o.rise} />
			)}
		</TypeSplit>
	);
}

function drive(trigger: Trigger, effect: ReactNode) {
	switch (trigger.type) {
		case 'load':
			return effect;
		case 'in-view': {
			const { start, end, once, markers, ref } = trigger;
			return (
				<InView
					start={start}
					end={end}
					once={once}
					markers={markers}
					trigger={ref}
				>
					{effect}
				</InView>
			);
		}
		case 'scrub': {
			const { start, end, scrub, markers, ref } = trigger;
			return (
				<Scrub
					start={start}
					end={end}
					scrub={scrub}
					markers={markers}
					trigger={ref}
				>
					{effect}
				</Scrub>
			);
		}
	}
}
