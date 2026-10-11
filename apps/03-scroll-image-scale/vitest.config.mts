import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@juan/tweakit': fileURLToPath(
				new URL('./app/_tweakit-stub.tsx', import.meta.url)
			),
			'@': fileURLToPath(new URL('.', import.meta.url)),
		},
	},
	test: {
		environment: 'jsdom',
		include: ['**/*.test.{ts,tsx}'],
	},
});
