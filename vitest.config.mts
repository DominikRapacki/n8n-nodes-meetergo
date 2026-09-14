import { defineConfig } from 'vitest/config';
export default defineConfig({
	test: {
		include: ['test/**/*.spec.ts'],
		environment: 'node',
		maxWorkers: '25%',
		testTimeout: 30000,
	},
});
