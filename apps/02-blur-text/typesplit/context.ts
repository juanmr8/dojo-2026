import { createContext, type RefObject } from 'react';

export type Level = 'line' | 'word' | 'char';

export type TypeSplitContextValue = {
	root: RefObject<HTMLElement | null>;
	/** Which levels the root rendered. Effects may only target these. */
	split: readonly Level[];
	/** Mounted, fonts loaded, and lines measured if requested. */
	ready: boolean;
	/** Bumps whenever line wrappers are rebuilt (width change). */
	generation: number;
};

export const TypeSplitContext = createContext<TypeSplitContextValue | null>(
	null
);
