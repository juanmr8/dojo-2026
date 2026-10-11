import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Tweakit } from './_tweakit-stub';
import { TILE_COUNT } from '@/lens/strip';
import { CONTROLS } from './controls';
import { ScrollImageScale } from './scroll-image-scale';

describe('ScrollImageScale', () => {
	const html = renderToString(
		<Tweakit controls={CONTROLS}>
			<ScrollImageScale />
		</Tweakit>
	);

	it('renders exactly one playhead', () => {
		expect(html.match(/data-playhead/g)).toHaveLength(1);
	});

	it('renders the strip once: TILE_COUNT tiles, no copies', () => {
		expect(html.match(/data-tile=/g)).toHaveLength(TILE_COUNT);
	});
});
