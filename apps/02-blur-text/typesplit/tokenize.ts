/* ─────────────────────────────────────────────────────────────────────
   tokenize — pure text splitting for TypeSplit. No DOM, no React.

   words:  split on whitespace, then after hyphens and dashes, so
           "self-sovereignty" can break across lines like the browser
           would. Each token remembers whether a space follows it.
   chars:  split by grapheme cluster (Intl.Segmenter), so emoji,
           flags and combining accents stay whole. Never split('').
   ──────────────────────────────────────────────────────────────────── */

export type Word = {
	text: string;
	/** A space follows this token in the source. False after "self-". */
	spaceAfter: boolean;
};

const DASH_BREAK = /(?<=[-‐‑–—])/;

export function words(input: string): Word[] {
	const parts = input.trim().split(/\s+/).filter(Boolean);
	const out: Word[] = [];

	parts.forEach((part, i) => {
		const last = i === parts.length - 1;
		const pieces = part.split(DASH_BREAK).filter(Boolean);
		pieces.forEach((text, j) => {
			out.push({ text, spaceAfter: j === pieces.length - 1 && !last });
		});
	});

	return out;
}

const segmenter =
	typeof Intl !== 'undefined' && 'Segmenter' in Intl
		? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
		: null;

export function chars(input: string): string[] {
	if (!segmenter) return Array.from(input);
	return Array.from(segmenter.segment(input), s => s.segment);
}

/** Rebuild the source text from tokens; used in tests as the invariant. */
export function join(tokens: Word[]): string {
	return tokens.map(t => t.text + (t.spaceAfter ? ' ' : '')).join('');
}
