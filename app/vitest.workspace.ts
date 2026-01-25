import { defineWorkspace } from 'vitest/config'
import path from 'path'

export default defineWorkspace([
  {
    // Server action tests - node environment with in-memory SQLite
    test: {
      name: 'actions',
      environment: 'node',
      include: ['__tests__/lib/**/*.test.ts', '__tests__/types/**/*.test.ts'],
      exclude: ['node_modules/**'],
      globals: true,
      setupFiles: ['./test/setup-node.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  },
  {
    // Component tests - jsdom environment with mocked actions
    test: {
      name: 'components',
      environment: 'jsdom',
      include: ['__tests__/components/**/*.test.tsx', '__tests__/hooks/**/*.test.tsx'],
      exclude: ['node_modules/**'],
      globals: true,
      setupFiles: ['./test/setup-dom.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  },
])
