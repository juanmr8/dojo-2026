/* BlurIn's contract with the driver: the from-state is on the units
   before anything plays, and the timeline waits for the driver. */

import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InView } from '../drivers/in-view';
import { TypeSplit } from '../typesplit';
import { BlurIn } from './blur-in';

type Fake = { onEnter?: () => void };
const { created } = vi.hoisted(() => ({ created: [] as Fake[] }));

vi.mock('gsap/ScrollTrigger', () => ({
	ScrollTrigger: {
		name: 'ScrollTrigger',
		register() {},
		create(vars: Fake) {
			created.push(vars);
			return { vars, kill() {}, refresh() {} };
		},
	},
}));

function mount(driven: boolean) {
	const onTimeline = vi.fn();
	const effect = <BlurIn onTimeline={onTimeline} />;
	const utils = render(
		<TypeSplit as='h1' text='one two three'>
			{driven ? <InView>{effect}</InView> : effect}
		</TypeSplit>
	);
	const tl = onTimeline.mock.calls[0][0] as gsap.core.Timeline;
	return { ...utils, tl };
}

describe('BlurIn', () => {
	it('under a waiting driver: units sit at the from-state, timeline paused at 0', () => {
		const { container, tl } = mount(true);
		const units = container.querySelectorAll<HTMLElement>('[data-unit="word"]');
		expect(units).toHaveLength(3);
		units.forEach(u => expect(u.style.opacity).toBe('0'));
		expect(tl.paused()).toBe(true);
		expect(tl.progress()).toBe(0);
	});

	it('with no driver: the timeline is playing right after mount', () => {
		const { tl } = mount(false);
		expect(tl.paused()).toBe(false);
	});

	it('plays when the driver says so', () => {
		const { tl } = mount(true);
		act(() => created[created.length - 1].onEnter?.());
		expect(tl.paused()).toBe(false);
	});
});
