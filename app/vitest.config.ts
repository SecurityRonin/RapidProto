import { defineConfig } from 'vitest/config'
import path from 'path'

// Main config - workspaces are defined in vitest.workspace.ts
export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.config.ts', 'node_modules/', 'test/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
