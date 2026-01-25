import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only test core lib/ and app/ code
    // Templates are tested individually when cloned
    include: [
      'lib/**/*.test.ts',
      'app/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'template-*/**',
      'base-template/**',
      'test-project/**',
      '*-demo/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/**/*.ts',
        'app/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.config.ts',
        'template-*/**',
        'base-template/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
