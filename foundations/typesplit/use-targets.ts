import { useContext, useMemo } from 'react';
import { TypeSplitContext, type Level } from './context';

/* ─────────────────────────────────────────────────────────────────────
   useTargets(level) — the one way an effect gets its DOM nodes.
   Returns null until the root is ready (mounted, fonts loaded, lines
   measured), then the nodes of that level in document order. A new
   array is returned when the root rebuilds its lines, so an effect that
   must survive a resize keys off `generation` from the context.
   ──────────────────────────────────────────────────────────────────── */
export function useTargets(level: Level): HTMLElement[] | null {
	const ctx = useContext(TypeSplitContext);
	if (!ctx) {
		throw new Error('useTargets must be used inside <TypeSplit>');
	}
	if (process.env.NODE_ENV !== 'production' && !ctx.split.includes(level)) {
		console.warn(
			`[TypeSplit] an effect targets "${level}" but the root only split ${JSON.stringify(ctx.split)}. Add it to the split prop.`
		);
	}

	const { root, ready, generation } = ctx;
	return useMemo(() => {
		if (!ready || !root.current) return null;
		return Array.from(
			root.current.querySelectorAll<HTMLElement>(`[data-unit="${level}"]`)
		);
		// generation is the signal that the DOM was rebuilt.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ready, generation, level, root]);
}
