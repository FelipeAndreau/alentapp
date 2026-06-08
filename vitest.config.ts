import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/api/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/e2e-fullstack/**',
      '**/*.e2e.test.ts',
      '**/generated/**',
    ],
  },
});
