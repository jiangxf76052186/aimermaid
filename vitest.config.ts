import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      'vscode': resolve(__dirname, 'src/extension/__tests__/mocks/vscode.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/**/e2e/**', 'node_modules'],
    setupFiles: ['./src/webview/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 55,
        functions: 45,
        branches: 40,
        statements: 55
      },
      exclude: [
        '**/node_modules/**',
        '**/__tests__/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.config.*',
      ]
    }
  },
});
