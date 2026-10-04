import { createContext, useContext } from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Driver — the layer between the root and its effects that decides
   *when* an effect plays. An effect builds its timeline paused and
   hands it over with attach(); the driver plays, reverses or scrubs
   it. No driver in the tree means "play now", so a bare effect inside
   <TypeSplit> is a load animation.

   Drivers live in drivers/ (InView, Scrub). This file is only the
   contract, so effects and drivers never import each other.
   ──────────────────────────────────────────────────────────────────── */

export type Driver = {
	/** Hand over a paused timeline. Returns the function that takes it back. */
	attach: (tl: gsap.core.Timeline) => () => void;
};

const playNow: Driver = {
	attach: tl => {
		tl.play();
		return () => {};
	},
};

export const DriverContext = createContext<Driver>(playNow);

export function useDriver(): Driver {
	return useContext(DriverContext);
}
