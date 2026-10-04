'use client';

/* ─────────────────────────────────────────────────────────────────────
   Tuner — a dev-only panel for tuning a piece's animation by eye.
   Copied into a piece by the tune-animation skill; edit freely here,
   the template in .claude/skills/tune-animation/templates is the source
   for the NEXT piece. Shown in dev, and in production only with ?tune.

   <Tuner mode="load" controls={CONTROLS}>
     {(v, api) => <Piece values={v} register={api.register} />}
   </Tuner>

   mode="load"   — Replay remounts the children so the on-load animation
                   runs again; Loop replays on completion; register() a
                   GSAP timeline or Motion controls to get a scrub bar.
   mode="scroll" — spacers above and below the children (in viewport
                   heights) so you can scroll in and out; To start;
                   Auto-scroll ping-pongs through the stage.
   controls      — { name: { value, min, max, step? } | boolean } → one
                   slider or toggle per entry; values persist per piece
                   in localStorage across reloads; Copy puts them on the
                   clipboard as JSON to bake into the source when done.
   ──────────────────────────────────────────────────────────────────── */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type CSSProperties,
	type ReactNode,
} from 'react';

export type NumberControl = {
	value: number;
	min: number;
	max: number;
	step?: number;
};
export type Controls = Record<string, NumberControl | boolean>;
export type Values<C extends Controls> = {
	[K in keyof C]: C[K] extends boolean ? boolean : number;
};

/** Anything the scrub bar can drive. Use fromGsap / fromMotion. */
export type Scrubbable = {
	duration: () => number;
	progress: () => number;
	seek: (p: number) => void;
	play: () => void;
	pause: () => void;
};

export function fromGsap(tl: {
	totalDuration: () => number;
	totalProgress: (p?: number) => number;
	play: () => unknown;
	pause: () => unknown;
}): Scrubbable {
	return {
		duration: () => tl.totalDuration(),
		progress: () => tl.totalProgress(),
		seek: p => {
			tl.pause();
			tl.totalProgress(p);
		},
		play: () => void tl.play(),
		pause: () => void tl.pause(),
	};
}

export function fromMotion(controls: {
	duration: number;
	time: number;
	play: () => void;
	pause: () => void;
}): Scrubbable {
	return {
		duration: () => controls.duration,
		progress: () => (controls.duration ? controls.time / controls.duration : 0),
		seek: p => {
			controls.pause();
			controls.time = p * controls.duration;
		},
		play: () => controls.play(),
		pause: () => controls.pause(),
	};
}

export type TunerApi = {
	/** Hand the panel the piece's timeline (load mode) for scrubbing. */
	register: (s: Scrubbable | null) => void;
	/** Remount the children; the on-load animation runs again. */
	replay: () => void;
	/** Changes on every replay; use as a dependency to rebuild timelines. */
	replayKey: number;
};

type Props<C extends Controls> = {
	mode: 'load' | 'scroll';
	controls?: C;
	/** Scroll mode: spacer height above and below, in viewport heights. */
	spacer?: number;
	children: (values: Values<C>, api: TunerApi) => ReactNode;
};

function defaults<C extends Controls>(controls: C): Values<C> {
	const out: Record<string, number | boolean> = {};
	for (const [k, c] of Object.entries(controls))
		out[k] = typeof c === 'boolean' ? c : c.value;
	return out as Values<C>;
}

function storageKey() {
	return `tuner:${typeof location === 'undefined' ? '' : location.pathname}`;
}

export function Tuner<C extends Controls>({
	mode,
	controls = {} as C,
	spacer: spacerDefault = 2,
	children,
}: Props<C>) {
	const enabled = useSyncExternalStore(
		() => () => {},
		() =>
			process.env.NODE_ENV !== 'production' ||
			new URLSearchParams(location.search).has('tune'),
		() => false
	);
	const [values, setValues] = useState<Values<C>>(() => defaults(controls));
	const [replayKey, setReplayKey] = useState(0);
	const [loop, setLoop] = useState(false);
	const [progress, setProgress] = useState(0);
	const [playing, setPlaying] = useState(true);
	const [spacer, setSpacer] = useState(spacerDefault);
	const [auto, setAuto] = useState(false);
	const [speed, setSpeed] = useState(600); // px per second
	const [scrub, setScrub] = useState<Scrubbable | null>(null);
	const stage = useRef<HTMLDivElement>(null);

	// Restore the values saved for this piece, after first paint.
	useEffect(() => {
		if (!enabled) return;
		const id = requestAnimationFrame(() => {
			try {
				const saved = localStorage.getItem(storageKey());
				if (saved) setValues(v => ({ ...v, ...JSON.parse(saved) }));
			} catch {}
		});
		return () => cancelAnimationFrame(id);
	}, [enabled]);

	useEffect(() => {
		if (!enabled) return;
		try {
			localStorage.setItem(storageKey(), JSON.stringify(values));
		} catch {}
	}, [enabled, values]);

	const replay = useCallback(() => {
		setScrub(null);
		setProgress(0);
		setPlaying(true);
		setReplayKey(k => k + 1);
	}, []);

	const register = useCallback((s: Scrubbable | null) => setScrub(s), []);

	// Load mode: follow the registered timeline; loop by replaying at the end.
	useEffect(() => {
		if (!enabled || mode !== 'load') return;
		let raf = 0;
		const tick = () => {
			if (scrub) {
				const p = scrub.progress();
				setProgress(p);
				if (p >= 1 && loop && playing) replay();
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [enabled, mode, loop, playing, replay, scrub]);

	// Loop without a registered timeline: replay on a fixed cadence.
	const [loopEvery, setLoopEvery] = useState(2000);
	useEffect(() => {
		if (!enabled || mode !== 'load' || !loop || scrub) return;
		const id = setInterval(replay, loopEvery);
		return () => clearInterval(id);
	}, [enabled, mode, loop, loopEvery, replay, replayKey, scrub]);

	// Scroll mode: progress of the stage through the viewport, auto ping-pong.
	useEffect(() => {
		if (!enabled || mode !== 'scroll') return;
		let raf = 0;
		let dir = 1;
		let last = performance.now();
		const tick = (now: number) => {
			const el = stage.current;
			if (el) {
				const r = el.getBoundingClientRect();
				const total = r.height + innerHeight;
				setProgress(Math.min(1, Math.max(0, (innerHeight - r.top) / total)));
				if (auto) {
					const dt = (now - last) / 1000;
					scrollBy(0, dir * speed * dt);
					const top = scrollY;
					const max = document.documentElement.scrollHeight - innerHeight;
					if (top <= 0) dir = 1;
					if (top >= max - 1) dir = -1;
				}
			}
			last = now;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [enabled, mode, auto, speed]);

	const api = useMemo<TunerApi>(
		() => ({ register, replay, replayKey }),
		[register, replay, replayKey]
	);

	const set = (k: keyof C, v: number | boolean) =>
		setValues(prev => ({ ...prev, [k]: v }));

	const content =
		mode === 'scroll' ? (
			<>
				<div style={{ height: `${spacer * 100}vh` }} aria-hidden />
				<div ref={stage}>{children(values, api)}</div>
				<div style={{ height: `${spacer * 100}vh` }} aria-hidden />
			</>
		) : (
			<div key={replayKey} style={{ display: 'contents' }}>
				{children(values, api)}
			</div>
		);

	if (!enabled) return <>{content}</>;

	return (
		<>
			{content}
			<aside style={panel}>
				<header style={rowStyle}>
					<strong style={{ letterSpacing: '0.08em' }}>TUNER · {mode}</strong>
					<span style={{ opacity: 0.6 }}>{progress.toFixed(2)}</span>
				</header>

				{mode === 'load' && (
					<>
						<div style={rowStyle}>
							<button style={btn} onClick={replay}>
								Replay
							</button>
							<button
								style={btn}
								onClick={() => {
									if (!scrub) return;
									if (playing) scrub.pause();
									else scrub.play();
									setPlaying(!playing);
								}}
								disabled={!scrub}
							>
								{playing ? 'Pause' : 'Play'}
							</button>
							<label style={lbl}>
								<input
									type='checkbox'
									checked={loop}
									onChange={e => setLoop(e.target.checked)}
								/>
								Loop
							</label>
						</div>
						<input
							type='range'
							min={0}
							max={1}
							step={0.001}
							value={progress}
							style={{ width: '100%' }}
							disabled={!scrub}
							title={
								scrub
									? 'Scrub the registered timeline'
									: 'register() a timeline to scrub'
							}
							onChange={e => {
								const p = Number(e.target.value);
								scrub?.seek(p);
								setPlaying(false);
								setProgress(p);
							}}
						/>
						{loop && !scrub && (
							<Slider
								name='loop every (ms)'
								value={loopEvery}
								min={300}
								max={6000}
								step={100}
								onChange={setLoopEvery}
							/>
						)}
					</>
				)}

				{mode === 'scroll' && (
					<>
						<div style={rowStyle}>
							<button
								style={btn}
								onClick={() =>
									stage.current?.scrollIntoView({
										block: 'start',
										behavior: 'instant',
									})
								}
							>
								To start
							</button>
							<label style={lbl}>
								<input
									type='checkbox'
									checked={auto}
									onChange={e => setAuto(e.target.checked)}
								/>
								Auto-scroll
							</label>
						</div>
						<Slider
							name='spacer (vh ×)'
							value={spacer}
							min={0}
							max={4}
							step={0.5}
							onChange={setSpacer}
						/>
						{auto && (
							<Slider
								name='speed (px/s)'
								value={speed}
								min={100}
								max={3000}
								step={50}
								onChange={setSpeed}
							/>
						)}
					</>
				)}

				{Object.entries(controls).map(([k, c]) =>
					typeof c === 'boolean' ? (
						<label key={k} style={lbl}>
							<input
								type='checkbox'
								checked={values[k as keyof C] as boolean}
								onChange={e => set(k as keyof C, e.target.checked)}
							/>
							{k}
						</label>
					) : (
						<Slider
							key={k}
							name={k}
							value={values[k as keyof C] as number}
							min={c.min}
							max={c.max}
							step={c.step ?? (c.max - c.min) / 100}
							onChange={v => set(k as keyof C, v)}
						/>
					)
				)}

				<div style={rowStyle}>
					<button
						style={btn}
						onClick={() =>
							navigator.clipboard.writeText(JSON.stringify(values, null, 2))
						}
					>
						Copy values
					</button>
					<button
						style={btn}
						onClick={() => {
							setValues(defaults(controls));
							try {
								localStorage.removeItem(storageKey());
							} catch {}
						}}
					>
						Reset
					</button>
				</div>
			</aside>
		</>
	);
}

function Slider({
	name,
	value,
	min,
	max,
	step,
	onChange,
}: {
	name: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (v: number) => void;
}) {
	return (
		<label style={{ display: 'block' }}>
			<div style={rowStyle}>
				<span>{name}</span>
				<input
					type='number'
					value={value}
					step={step}
					onChange={e => onChange(Number(e.target.value))}
					style={{ ...btn, width: 72, textAlign: 'right' }}
				/>
			</div>
			<input
				type='range'
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={e => onChange(Number(e.target.value))}
				style={{ width: '100%' }}
			/>
		</label>
	);
}

const panel: CSSProperties = {
	position: 'fixed',
	right: 12,
	bottom: 12,
	zIndex: 2147483647,
	width: 280,
	maxHeight: '80vh',
	overflowY: 'auto',
	padding: 12,
	display: 'grid',
	gap: 8,
	background: 'rgba(10,10,10,0.92)',
	color: '#eee',
	font: '11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
	border: '1px solid rgba(255,255,255,0.12)',
	borderRadius: 8,
	backdropFilter: 'blur(6px)',
};
const rowStyle: CSSProperties = {
	display: 'flex',
	gap: 8,
	alignItems: 'center',
	justifyContent: 'space-between',
};
const lbl: CSSProperties = {
	display: 'flex',
	gap: 6,
	alignItems: 'center',
	cursor: 'pointer',
};
const btn: CSSProperties = {
	background: '#222',
	color: '#eee',
	border: '1px solid rgba(255,255,255,0.15)',
	borderRadius: 4,
	padding: '3px 8px',
	font: 'inherit',
	cursor: 'pointer',
};
