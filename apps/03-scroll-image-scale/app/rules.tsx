import { RULES_Y } from '@/lens/strip';

/** The background rules, edge to edge of the viewport. */
export function Rules() {
	return (
		<div aria-hidden>
			{RULES_Y.map(y => (
				<div
					key={y}
					className='bg-rule absolute inset-x-0 h-px'
					style={{ top: `${y * 100}%` }}
				/>
			))}
		</div>
	);
}
