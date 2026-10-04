import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TypeSplit } from './typesplit';
import { useTargets } from './use-targets';

const TEXT = 'Words arrive out of focus';

/** Flush the fonts-ready layout effect (jsdom has no document.fonts). */
const settle = () => act(async () => {});

describe('TypeSplit accessibility and SEO contract', () => {
	it('renders the requested element with the full text as its name', async () => {
		render(<TypeSplit as='h1' text={TEXT} />);
		await settle();
		expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
			TEXT
		);
	});

	it('defaults to a paragraph', () => {
		const { container } = render(<TypeSplit text={TEXT} />);
		expect(container.firstElementChild?.tagName).toBe('P');
	});

	it('keeps one visually hidden copy for screen readers', () => {
		const { container } = render(<TypeSplit text={TEXT} />);
		const copies = container.querySelectorAll('.sr-only');
		expect(copies).toHaveLength(1);
		expect(copies[0]).toHaveTextContent(TEXT);
	});

	it('hides the split spans from assistive tech, not from the DOM', () => {
		const { container } = render(<TypeSplit text={TEXT} />);
		const split = container.querySelector('[aria-hidden="true"]');
		expect(split).not.toBeNull();
		expect(split).toHaveTextContent(TEXT);
		expect(split?.querySelectorAll('[data-unit="word"]')).toHaveLength(5);
	});

	it('keeps the visible text readable as plain text (copy, find, translate)', () => {
		const { container } = render(<TypeSplit text={TEXT} />);
		const split = container.querySelector('[aria-hidden="true"]');
		expect(split?.textContent).toBe(TEXT);
	});

	it('splits chars by grapheme inside words when asked', () => {
		const { container } = render(
			<TypeSplit text='niño 👩‍🚀' split={['word', 'char']} />
		);
		const charsOf = (i: number) =>
			Array.from(
				container
					.querySelectorAll('[data-unit="word"]')
					[i].querySelectorAll('[data-unit="char"]')
			).map(el => el.textContent);
		expect(charsOf(0)).toEqual(['n', 'i', 'ñ', 'o']);
		expect(charsOf(1)).toEqual(['👩‍🚀']);
	});

	it('does not render char spans unless asked', () => {
		const { container } = render(<TypeSplit text={TEXT} />);
		expect(container.querySelectorAll('[data-unit="char"]')).toHaveLength(0);
	});

	it('server HTML is pending and carries the text, split and readable', () => {
		const html = renderToString(<TypeSplit as='h1' text={TEXT} />);
		expect(html).toMatch(/^<h1[^>]*data-pending=""/);
		expect(html).toContain(`<span class="sr-only select-none">${TEXT}</span>`);
		expect(html.match(/data-unit="word"/g)).toHaveLength(5);
	});

	it('drops the pending mark on the client once ready', async () => {
		const { container } = render(<TypeSplit text={TEXT} />);
		await settle();
		expect(container.firstElementChild).not.toHaveAttribute('data-pending');
	});

	it('hands effects their targets once ready, in document order', async () => {
		const seen: string[][] = [];
		function Probe() {
			const t = useTargets('word');
			seen.push(t ? t.map(el => el.textContent ?? '') : ['<null>']);
			return null;
		}
		render(
			<TypeSplit text={TEXT}>
				<Probe />
			</TypeSplit>
		);
		expect(seen[0]).toEqual(['<null>']);
		await settle();
		expect(seen.at(-1)).toEqual(['Words', 'arrive', 'out', 'of', 'focus']);
	});

	it('wraps words in lines when asked (jsdom lays everything on one line)', async () => {
		const { container } = render(
			<TypeSplit text={TEXT} split={['line', 'word']} />
		);
		await settle();
		const lines = container.querySelectorAll('[data-unit="line"]');
		expect(lines).toHaveLength(1);
		expect(lines[0].querySelectorAll('[data-unit="word"]')).toHaveLength(5);
		expect(lines[0].textContent).toBe(TEXT);
	});
});
