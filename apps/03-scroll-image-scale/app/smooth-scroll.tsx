'use client';

import { useTuner } from '@juan/tweakit';
import { ReactLenis } from 'lenis/react';
import { useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import type { CONTROLS } from './controls';

/** Lenis on the window, infinite: wheel and touch ease into the native
    scroll, which Lenis wraps at both ends, so the page scrolls forever
    and useScroll still reads window scroll (see use-playhead-x.ts).
    syncTouch routes touch through Lenis too; without it a finger
    scrolls natively and stops at the ends. Reduced motion keeps the
    browser's own scroll. */
export function SmoothScroll({ children }: { children: ReactNode }) {
	const { values } = useTuner<typeof CONTROLS>();
	const reduced = useReducedMotion();
	if (reduced) return children;

	return (
		<ReactLenis
			root
			options={{ lerp: values.scrollLerp, infinite: true, syncTouch: true }}
		>
			{children}
		</ReactLenis>
	);
}
