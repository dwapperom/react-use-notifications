import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-use-notifications/internal': fileURLToPath(
        new URL('../core/src/internal/index.ts', import.meta.url),
      ),
      'react-use-notifications/testing': fileURLToPath(
        new URL('../core/src/testing/index.ts', import.meta.url),
      ),
      'react-use-notifications': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 97,
        branches: 86,
        functions: 100,
        lines: 97,
      },
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/index.ts'],
    },
  },
});
