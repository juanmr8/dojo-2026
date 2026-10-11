import type { NextConfig } from 'next';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

// @juan/tweakit lives outside the repo, in ~/dev/3. tools/tweakit.
// Dev builds read it live; anywhere it's missing (Vercel, a fresh
// clone) or in production, the import resolves to a stub that renders
// only the page.

const TWEAKIT = join('3. tools', 'tweakit');

// The nearest ancestor holding 3. tools/tweakit (~/dev): the one root
// that contains both this app and tweakit (no env var involved).
function findDev(dir: string): string | undefined {
	for (let d = dir; d !== dirname(d); d = dirname(d))
		if (existsSync(join(d, TWEAKIT, 'src', 'index.tsx'))) return d;
}
const dev = findDev(__dirname);
const live = !!dev && process.env.NODE_ENV === 'development';

const config: NextConfig = {
	// The Tree resolves source files against this app's root.
	env: live ? { TWEAKIT_ROOT: __dirname } : {},
	turbopack: {
		// Live, the root must contain the folder: Turbopack refuses
		// modules (the panels' CSS included) outside its root.
		root: live ? dev : __dirname,
		resolveAlias: {
			// Turbopack reads alias paths relative to this app, never absolute.
			'@juan/tweakit': dev && live
				? relative(__dirname, join(dev, TWEAKIT, 'src', 'index.tsx'))
				: './app/_tweakit-stub.tsx',
		},
	},
};

export default config;
