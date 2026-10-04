'use client';

/* The demo page: BlurTitle in every flavour, wired to the dev-only Tuner
   in scroll mode. Each section is tall enough to enter on its own;
   scroll through with markers on to see where each one fires. The
   preset never learns the Tuner exists: it only receives options. */

import { useRef, type RefObject } from 'react';
import { BlurTitle, type Trigger } from './presets/blur-title';
import { Tuner, type Values } from './_tuner/tuner';

const TEXT =
	'Words arrive out of focus and settle one by one, the way a thought does before you can say it.';

const CONTROLS = {
	duration: { value: 1.1, min: 0.1, max: 3, step: 0.05 },
	stagger: { value: 0.035, min: 0, max: 0.3, step: 0.005 },
	delay: { value: 0, min: 0, max: 1, step: 0.05 },
	blur: { value: 5, min: 0, max: 40, step: 1 },
	easePower: { value: 1, min: 1, max: 4, step: 1 },
	startAt: { value: 85, min: 50, max: 100, step: 1 },
	scrubLag: { value: 0.5, min: 0, max: 2, step: 0.1 },
	// Off while tuning: scrolling out and back is the replay. Bake as true.
	once: false,
	markers: true,
};

type Flavour = {
	caption: string;
	trigger: Trigger;
	/** The section is the trigger instead of the title. */
	ref?: RefObject<HTMLElement | null>;
};

function Demo({ values }: { values: Values<typeof CONTROLS> }) {
	const section = useRef<HTMLElement>(null);
	const start = `top ${values.startAt}%`;
	const { once, markers } = values;

	const flavours: Flavour[] = [
		{
			caption: 'load · plays on mount, wherever it is',
			trigger: { type: 'load' },
		},
		{
			caption: `in-view · start "${start}"`,
			trigger: { type: 'in-view', start, once, markers },
		},
		{
			caption: 'in-view · the section is the trigger',
			trigger: { type: 'in-view', start, once, markers, ref: section },
			ref: section,
		},
		{
			caption: 'scrub · "top 80%" to "top 30%"',
			trigger: {
				type: 'scrub',
				start: 'top 80%',
				end: 'top 30%',
				scrub: values.scrubLag || true,
				markers,
			},
		},
	];

	return (
		<div className='flex w-full flex-col'>
			{flavours.map((f, i) => (
				<section
					key={f.caption}
					ref={f.ref}
					className='flex min-h-[80vh] flex-col justify-center gap-6 p-8'
				>
					<p className='font-mono text-xs tracking-widest text-neutral-500 uppercase'>
						{f.caption}
					</p>
					<BlurTitle
						as={i === 0 ? 'h1' : 'h2'}
						text={TEXT}
						className='max-w-3xl text-4xl leading-tight font-medium tracking-tight md:text-6xl'
						options={{
							transition: {
								duration: values.duration,
								stagger: values.stagger,
								delay: values.delay,
								ease: `power${values.easePower}.out`,
							},
							blur: values.blur,
							trigger: f.trigger,
						}}
					/>
				</section>
			))}
		</div>
	);
}

export function BlurText() {
	return (
		<Tuner mode='scroll' spacer={1.5} controls={CONTROLS}>
			{values => <Demo values={values} />}
		</Tuner>
	);
}
