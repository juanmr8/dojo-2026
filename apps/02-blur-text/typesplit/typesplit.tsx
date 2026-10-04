'use client';

/* ─────────────────────────────────────────────────────────────────────
   TypeSplit — the base of text manipulation. Owns the markup and the
   contracts every text effect needs, so an effect only animates:

   • Server HTML carries the text once, inside the real element (`as`),
     split into spans, plus a visually hidden copy for screen readers.
     The split spans are aria-hidden: assistive tech reads one sentence.
   • Units start hidden only under @media (scripting: enabled) and
     (prefers-reduced-motion: no-preference). No JS, or reduced motion,
     means static visible text and no flash. See typesplit.css.
   • Under reduced motion the effect children are not rendered at all.
   • `ready` flips after mount, after document.fonts.ready (capped),
     and after lines are measured when 'line' is requested. Effects set
     their from-state in useLayoutEffect, so the frame that drops
     data-pending is the frame they take over: nothing flashes.
   • Levels nest line > word > char. Lines cannot be known on the
     server: words render flat, get measured by offsetTop after fonts,
     and re-render wrapped in block spans. Width changes re-measure.

   <TypeSplit as="h1" text="…" split={['word']}>
     <BlurIn target="word" />
   </TypeSplit>
   ──────────────────────────────────────────────────────────────────── */

import {
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type ElementType,
	type ReactNode,
} from 'react';
import { TypeSplitContext, type Level } from './context';
import { chars, words, type Word } from './tokenize';
import './typesplit.css';

type Tag = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type TypeSplitProps = {
	text: string;
	as?: Tag;
	split?: readonly Level[];
	className?: string;
	/** Effects. Headless components that call useTargets(level). */
	children?: ReactNode;
};

const FONT_WAIT_CAP_MS = 1000;

export function TypeSplit({
	text,
	as = 'p',
	split = ['word'],
	className,
	children,
}: TypeSplitProps) {
	const root = useRef<HTMLElement>(null);
	const tokens = useMemo(() => words(text), [text]);
	const wantsChars = split.includes('char');
	const wantsLines = split.includes('line');

	const fontsReady = useFontsReady();
	const reducedMotion = useReducedMotion();
	const { lines, generation } = useLines(root, fontsReady && wantsLines);

	const ready = fontsReady && (!wantsLines || lines !== null);

	const ctx = useMemo(
		() => ({ root, split, ready, generation }),
		[split, ready, generation]
	);

	const renderWord = (w: Word, key: number) => (
		<span key={key} data-unit='word' className='inline-block'>
			{wantsChars
				? chars(w.text).map((c, i) => (
						<span key={i} data-unit='char' className='inline-block'>
							{c}
						</span>
					))
				: w.text}
		</span>
	);

	// Words and the spaces between them. Spaces stay plain text nodes so
	// the browser wraps and selects them as text, not as boxes.
	const renderRun = (run: Word[], offset: number) =>
		run.flatMap((w, i) => [
			renderWord(w, offset + i),
			w.spaceAfter ? ' ' : null,
		]);

	const body =
		lines === null
			? renderRun(tokens, 0)
			: lines.map((count, li) => {
					const start = lines.slice(0, li).reduce((a, b) => a + b, 0);
					return (
						<span key={li} data-unit='line' className='block'>
							{renderRun(tokens.slice(start, start + count), start)}
						</span>
					);
				});

	// Widened so `ref` accepts the shared HTMLElement ref across all tags.
	const Tag = as as ElementType;

	return (
		<Tag ref={root} className={className} data-pending={ready ? undefined : ''}>
			{/* select-none: copying the page must yield the sentence once. */}
			<span className='sr-only select-none'>{text}</span>
			<span aria-hidden='true'>{body}</span>
			<TypeSplitContext.Provider value={ctx}>
				{reducedMotion ? null : children}
			</TypeSplitContext.Provider>
		</Tag>
	);
}

/* ── hooks ─────────────────────────────────────────────────────────── */

function useFontsReady() {
	const [ready, setReady] = useState(false);
	useLayoutEffect(() => {
		let alive = true;
		const done = () => alive && setReady(true);
		const fonts = typeof document !== 'undefined' ? document.fonts : null;
		if (!fonts) {
			done();
			return;
		}
		const cap = setTimeout(done, FONT_WAIT_CAP_MS);
		fonts.ready.then(done);
		return () => {
			alive = false;
			clearTimeout(cap);
		};
	}, []);
	return ready;
}

const REDUCED = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void) {
	if (typeof window.matchMedia !== 'function') return () => {};
	const mq = window.matchMedia(REDUCED);
	mq.addEventListener('change', cb);
	return () => mq.removeEventListener('change', cb);
}
function useReducedMotion() {
	return useSyncExternalStore(
		subscribeReduced,
		() =>
			typeof window.matchMedia === 'function' &&
			window.matchMedia(REDUCED).matches,
		() => false
	);
}

/**
 * Lines as word counts per line, measured from the word spans' offsetTop.
 * null while unknown (server, before fonts, or during a re-measure).
 * A width change resets to null so words render flat again, then the
 * layout effect measures the browser's own wrapping before paint.
 */
function useLines(root: React.RefObject<HTMLElement | null>, enabled: boolean) {
	const [lines, setLines] = useState<number[] | null>(null);
	const [generation, setGeneration] = useState(0);
	const width = useRef<number | null>(null);

	useLayoutEffect(() => {
		if (!enabled || lines !== null || !root.current) return;
		const units =
			root.current.querySelectorAll<HTMLElement>('[data-unit="word"]');
		const counts: number[] = [];
		let lastTop: number | null = null;
		units.forEach(el => {
			if (el.offsetTop !== lastTop) {
				counts.push(0);
				lastTop = el.offsetTop;
			}
			counts[counts.length - 1]++;
		});
		// Measure-then-render: lines exist only after layout, and must be
		// committed before paint so effects start on the final DOM.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setLines(counts);
		setGeneration(g => g + 1);
	}, [enabled, lines, root]);

	useLayoutEffect(() => {
		if (!enabled || !root.current || typeof ResizeObserver === 'undefined') {
			return;
		}
		const ro = new ResizeObserver(([entry]) => {
			const w = entry.contentRect.width;
			if (width.current !== null && width.current !== w) setLines(null);
			width.current = w;
		});
		ro.observe(root.current);
		return () => ro.disconnect();
	}, [enabled, root]);

	return { lines, generation };
}
