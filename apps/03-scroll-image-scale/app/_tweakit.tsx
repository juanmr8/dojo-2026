'use client';

/* Mounts @juan/tweakit around the page (from app/layout.tsx). A client
   file because the page's gsap instance must reach the Timeline, and a
   server layout can't pass a module across to a client component (gsap
   doesn't set window.gsap on its own). Tuner controls for the piece go
   here too (controls={CONTROLS}); the page reads them with useTuner().
   In production / without the tweakit folder, Tweakit is the stub.
   Written by tweakit/scripts/install.sh; edit freely, it is never
   overwritten (a re-run only updates the mode). */

import { Tweakit } from '@juan/tweakit';
import gsap from 'gsap';
import type { ReactNode } from 'react';
import { CONTROLS, ITEM_CONTROLS } from './controls';

export function TweakitDev({ children }: { children: ReactNode }) {
	return (
		<Tweakit
      gate
			mode='scroll'
			gsap={gsap}
			controls={CONTROLS}
			itemControls={ITEM_CONTROLS}
		>
			{children}
		</Tweakit>
	);
}
