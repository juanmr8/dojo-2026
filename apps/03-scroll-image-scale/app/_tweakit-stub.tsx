/* Stand-in for @juan/tweakit when its folder isn't on this machine
   (no tweakit folder above the app, or a production build): renders
   the page only, and answers useTuner() with the controls' defaults.
   Keep its exports and props in step with tweakit/src/index.tsx;
   tsconfig reads the types from here. Written by tweakit/scripts/install.sh. */
import { createContext, useContext, type ReactNode } from 'react';

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
export type ItemControls = Record<
	string,
	{ min: number; max: number; step?: number }
>;
export type Scrubbable = {
	duration: () => number;
	progress: () => number;
	seek: (p: number) => void;
	play: () => void;
	pause: () => void;
};
export type TunerApi = {
	register: (s: Scrubbable | null) => void;
	replay: () => void;
	replayKey: number;
};

/* The load-mode adapter contract (tweakit/src/drive/adapter.ts), so the
   wiring's adapters type-check here too; the stub never runs them. */
export type Driver = 'css' | 'waapi' | 'gsap' | 'motion' | 'js' | 'canvas';
export type Handle = 'copy' | 'native';
export type Param =
	| {
			name: string;
			kind: 'number';
			value: number;
			min?: number;
			max?: number;
			step?: number;
			unit?: 'ms' | 's' | 'px' | '%' | 'deg' | '';
	  }
	| { name: string; kind: 'ease'; value: string }
	| { name: string; kind: 'color' | 'string'; value: string }
	| { name: string; kind: 'boolean'; value: boolean };
export type Identity = {
	component: string;
	file?: string;
	element?: Element | null;
	label: string;
};
export type Timing = { delay: number; duration: number; iterations?: number };
export type Control = {
	identity: Identity;
	driver: Driver;
	handle: Handle;
	params: Param[];
	timing: Timing;
	play(): void;
	seek(ms: number): void;
	cancel(): void;
	set?(name: string, value: Param['value']): void;
};
type AdapterValues = Record<string, Param['value']>;
type Verbs = Pick<Control, 'play' | 'seek' | 'cancel'>;
export type Adapter =
	| {
			kind: 'dom';
			component: string;
			file?: string;
			driver?: 'js';
			params: Param[];
			targets(root: Element): Element[];
			keyframes(p: AdapterValues, i: number): Keyframe[];
			timing(p: AdapterValues, i: number): Timing & { easing: string };
	  }
	| {
			kind: 'canvas';
			component: string;
			file?: string;
			params: Param[];
			canvas(root: Element): HTMLCanvasElement | null;
			bind(
				c: HTMLCanvasElement,
				p: AdapterValues
			): Verbs & { timing: Timing; takeover?(): boolean };
	  };

const api: TunerApi = { register: () => {}, replay: () => {}, replayKey: 0 };
const Defaults = createContext<Record<string, number | boolean>>({});

export function track(
	_label: string,
	_timing: { delay?: number; duration: number; repeat?: number },
	_verbs?: Verbs
) {}

const idle: Scrubbable = {
	duration: () => 0,
	progress: () => 0,
	seek: () => {},
	play: () => {},
	pause: () => {},
};
export const fromGsap = (_tl: unknown): Scrubbable => idle;
export const fromMotion = (_controls: unknown): Scrubbable => idle;

export function useTuner<C extends Controls>(): {
	values: Values<C>;
	api: TunerApi;
} {
	return { values: useContext(Defaults) as Values<C>, api };
}

/** No panel: an Item keeps the values its code computes. */
export const useTunerItem = <T extends Record<string, number>>(
	_id: string | number,
	base: T
): T => base;

export function Tweakit({
	controls = {},
	children,
}: {
	gate?: boolean;
	mode?: 'load' | 'scroll';
	gsap?: unknown;
	controls?: Controls;
	itemControls?: ItemControls;
	adapters?: readonly Adapter[];
	children?: ReactNode;
}) {
	const values = Object.fromEntries(
		Object.entries(controls).map(([k, c]) => [
			k,
			typeof c === 'boolean' ? c : c.value,
		])
	);
	return <Defaults.Provider value={values}>{children}</Defaults.Provider>;
}
