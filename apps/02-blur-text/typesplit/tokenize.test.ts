import { describe, expect, it } from 'vitest';
import { chars, join, words } from './tokenize';

describe('words', () => {
	it('splits on single spaces', () => {
		expect(words('Words arrive out')).toEqual([
			{ text: 'Words', spaceAfter: true },
			{ text: 'arrive', spaceAfter: true },
			{ text: 'out', spaceAfter: false },
		]);
	});

	it('collapses runs of whitespace, tabs and newlines', () => {
		expect(words('a  b\tc\nd').map(w => w.text)).toEqual(['a', 'b', 'c', 'd']);
	});

	it('trims leading and trailing whitespace', () => {
		expect(words('  hello  ')).toEqual([{ text: 'hello', spaceAfter: false }]);
	});

	it('returns nothing for empty or blank input', () => {
		expect(words('')).toEqual([]);
		expect(words('   ')).toEqual([]);
	});

	it('breaks after a hyphen with no space between the pieces', () => {
		expect(words('self-sovereignty now')).toEqual([
			{ text: 'self-', spaceAfter: false },
			{ text: 'sovereignty', spaceAfter: true },
			{ text: 'now', spaceAfter: false },
		]);
	});

	it('breaks after en and em dashes', () => {
		expect(words('wait—what').map(w => w.text)).toEqual(['wait—', 'what']);
		expect(words('1–2').map(w => w.text)).toEqual(['1–', '2']);
	});

	it('keeps a trailing hyphen on the last word', () => {
		expect(words('a-')).toEqual([{ text: 'a-', spaceAfter: false }]);
	});

	it('keeps punctuation attached to its word', () => {
		expect(words('Hello, world!').map(w => w.text)).toEqual([
			'Hello,',
			'world!',
		]);
	});

	it('keeps emoji and accents inside words', () => {
		expect(words('café 👩‍🚀 niño').map(w => w.text)).toEqual([
			'café',
			'👩‍🚀',
			'niño',
		]);
	});

	it('rebuilds the normalised source from its tokens', () => {
		const src = 'Words arrive out-of focus, one—by—one.';
		expect(join(words(src))).toBe(src);
	});
});

describe('chars', () => {
	it('splits ascii into single characters', () => {
		expect(chars('abc')).toEqual(['a', 'b', 'c']);
	});

	it('keeps combining accents with their base letter', () => {
		expect(chars('éa')).toEqual(['é', 'a']);
	});

	it('keeps precomposed accents', () => {
		expect(chars('ñ')).toEqual(['ñ']);
	});

	it('keeps a surrogate-pair emoji whole', () => {
		expect(chars('a😀b')).toEqual(['a', '😀', 'b']);
	});

	it('keeps a ZWJ emoji sequence whole', () => {
		expect(chars('👩‍🚀')).toEqual(['👩‍🚀']);
	});

	it('keeps a flag whole', () => {
		expect(chars('🇪🇸!')).toEqual(['🇪🇸', '!']);
	});

	it('keeps a skin-tone modifier with its emoji', () => {
		expect(chars('👍🏽')).toEqual(['👍🏽']);
	});

	it('returns nothing for empty input', () => {
		expect(chars('')).toEqual([]);
	});

	it('rebuilds the word from its graphemes', () => {
		const w = 'Cáfé🇪🇸';
		expect(chars(w).join('')).toBe(w);
	});
});
