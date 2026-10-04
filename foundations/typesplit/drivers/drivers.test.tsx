/* Driver contracts, with a fake ScrollTrigger: the tests record what the
   driver asked for and fire its callbacks by hand. No scrolling in jsdom. */

import { act, render } from '@testing-library/react';
import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDriver } from '../driver';
import { TypeSplit } from '../typesplit';
import { useTargets } from '../use-targets';
import { InView } from './in-view';
import { Scrub } from './scrub';

type Vars = {
	trigger: Element;
	start?: string;
	end?: string;
	scrub?: number | boolean;
	animation?: gsap.core.Timeline;
	onEnter?: () => void;
	onLeaveBack?: () => void;
};
type Fake = { vars: Vars; kill: () => void; refresh: () => void };

const { created } = vi.hoisted(() => ({ created: [] as Fake[] }));

vi.mock('gsap/ScrollTrigger', () => ({
	ScrollTrigger: {
		name: 'ScrollTrigger',
		register() {},
		create(vars: Vars) {
			const st = { vars, kill: vi.fn(), refresh: vi.fn() };
			created.push(st);
			return st;
		},
	},
}));

const last = () => created[created.length - 1];

/** A bare effect: one paused second-long timeline handed to the driver. */
function Probe({
	onTimeline,
}: {
	onTimeline: (tl: gsap.core.Timeline) => void;
}) {
	const targets = useTargets('word');
	const { attach } = useDriver();
	useLayoutEffect(() => {
		if (!targets) return;
		const tl = gsap.timeline({ paused: true });
		tl.to({}, { duration: 1 });
		const detach = attach(tl);
		onTimeline(tl);
		return () => {
			detach();
			tl.kill();
		};
	}, [targets, attach, onTimeline]);
	return null;
}

function mount(
	children: (onTimeline: (tl: gsap.core.Timeline) => void) => React.ReactNode
) {
	let tl: gsap.core.Timeline | null = null;
	const onTimeline = (t: gsap.core.Timeline) => {
		tl = t;
	};
	const utils = render(
		<TypeSplit as='h1' text='one two three'>
			{children(onTimeline)}
		</TypeSplit>
	);
	return { ...utils, tl: () => tl as gsap.core.Timeline | null };
}

beforeEach(() => {
	created.length = 0;
});

describe('no driver', () => {
	it('plays the attached timeline at once', () => {
		const { tl } = mount(on => <Probe onTimeline={on} />);
		expect(tl()?.paused()).toBe(false);
		expect(created).toHaveLength(0);
	});
});

describe('InView', () => {
	it('keeps the timeline paused until the trigger enters, then plays', () => {
		const { tl } = mount(on => (
			<InView>
				<Probe onTimeline={on} />
			</InView>
		));
		expect(tl()?.paused()).toBe(true);
		act(() => last().vars.onEnter?.());
		expect(tl()?.paused()).toBe(false);
	});

	it('watches the TypeSplit root by default, with the given start and end', () => {
		const { container } = mount(on => (
			<InView start='top 70%' end='bottom 10%'>
				<Probe onTimeline={on} />
			</InView>
		));
		expect(last().vars.trigger).toBe(container.querySelector('h1'));
		expect(last().vars.start).toBe('top 70%');
		expect(last().vars.end).toBe('bottom 10%');
	});

	it('watches the given trigger ref instead', () => {
		function Page() {
			const section = useRef<HTMLElement>(null);
			return (
				<section ref={section} data-testid='section'>
					<TypeSplit as='h2' text='one two'>
						<InView trigger={section}>
							<Probe onTimeline={() => {}} />
						</InView>
					</TypeSplit>
				</section>
			);
		}
		const { getByTestId } = render(<Page />);
		expect(last().vars.trigger).toBe(getByTestId('section'));
	});

	it('once (default): leaving back above start changes nothing', () => {
		const { tl } = mount(on => (
			<InView>
				<Probe onTimeline={on} />
			</InView>
		));
		act(() => last().vars.onEnter?.());
		act(() => last().vars.onLeaveBack?.());
		expect(tl()?.reversed()).toBe(false);
		expect(tl()?.paused()).toBe(false);
	});

	it('once={false}: leaving back above start reverses, re-entering plays', () => {
		const { tl } = mount(on => (
			<InView once={false}>
				<Probe onTimeline={on} />
			</InView>
		));
		act(() => last().vars.onEnter?.());
		act(() => last().vars.onLeaveBack?.());
		expect(tl()?.reversed()).toBe(true);
		act(() => last().vars.onEnter?.());
		expect(tl()?.reversed()).toBe(false);
	});

	it('plays a timeline attached while already in view', () => {
		// Simulates a Tuner change: the effect re-attaches after the enter.
		const grabbed: { attach?: (tl: gsap.core.Timeline) => () => void } = {};
		function Grab() {
			const { attach } = useDriver();
			useLayoutEffect(() => {
				grabbed.attach = attach;
			}, [attach]);
			return null;
		}
		render(
			<TypeSplit as='h1' text='one two'>
				<InView>
					<Grab />
				</InView>
			</TypeSplit>
		);
		act(() => last().vars.onEnter?.());
		const tl = gsap.timeline({ paused: true });
		tl.to({}, { duration: 1 });
		act(() => {
			grabbed.attach?.(tl);
		});
		expect(tl.paused()).toBe(false);
	});

	it('kills its ScrollTrigger on unmount', () => {
		const { unmount } = mount(on => (
			<InView>
				<Probe onTimeline={on} />
			</InView>
		));
		const st = last();
		unmount();
		expect(st.kill).toHaveBeenCalledTimes(1);
	});
});

describe('Scrub', () => {
	it('puts the timeline on a master that one scrubbed ScrollTrigger drives', () => {
		const { tl } = mount(on => (
			<Scrub start='top 80%' end='top 30%' scrub={0.5}>
				<Probe onTimeline={on} />
			</Scrub>
		));
		const { vars } = last();
		expect(vars.scrub).toBe(0.5);
		expect(vars.start).toBe('top 80%');
		expect(vars.end).toBe('top 30%');
		expect(vars.animation).toBeDefined();
		expect(tl()?.parent).toBe(vars.animation);
		expect(tl()?.paused()).toBe(false);
	});

	it('takes the timeline off the master on detach and kills the trigger on unmount', () => {
		const { tl, unmount } = mount(on => (
			<Scrub>
				<Probe onTimeline={on} />
			</Scrub>
		));
		const st = last();
		const timeline = tl();
		unmount();
		expect(timeline?.parent).not.toBe(st.vars.animation);
		expect(st.kill).toHaveBeenCalledTimes(1);
	});
});
