'use client';

import { PLAYHEAD } from '@/lens/strip';
import { motion, useTransform, type MotionValue } from 'motion/react';

const { triangle, lineInset } = PLAYHEAD;

/** The one playhead: line and both triangles as one unit, slid across
    the screen by its x. The layer spans the viewport, so its own % is
    the viewport width. In the overshoot it is simply drawn past an edge
    and clipped, so it turns unseen and comes back the way it left. */
export function Playhead({ x }: { x: MotionValue<number> }) {
	const translate = useTransform(x, v => `${v * 100}%`);
	return (
		<motion.div
			aria-hidden
			data-playhead
			className='pointer-events-none absolute inset-0 will-change-transform'
			style={{ x: translate }}
		>
			<Triangle pointing='down' edge='top' />
			<div
				className='bg-ink absolute left-0 w-px -translate-x-1/2'
				style={{ top: lineInset, bottom: lineInset }}
			/>
			<Triangle pointing='up' edge='bottom' />
		</motion.div>
	);
}

const PATH = {
	up: `M${triangle.w / 2} 0L${triangle.w} ${triangle.h}H0Z`,
	down: `M0 0H${triangle.w}L${triangle.w / 2} ${triangle.h}Z`,
};

function Triangle({
	pointing,
	edge,
}: {
	pointing: keyof typeof PATH;
	edge: 'top' | 'bottom';
}) {
	return (
		<svg
			viewBox={`0 0 ${triangle.w} ${triangle.h}`}
			className='fill-ink absolute'
			style={{
				left: -triangle.w / 2,
				[edge]: triangle.inset,
				width: triangle.w,
				height: triangle.h,
			}}
		>
			<path d={PATH[pointing]} />
		</svg>
	);
}
