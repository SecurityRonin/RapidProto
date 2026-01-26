/**
 * Vitest Setup for Node Environment (Server Action Tests)
 * Uses in-memory SQLite for realistic database testing
 */

import { vi, beforeEach, afterEach } from 'vitest'
import { setTestDb, resetDb } from '@/lib/db'
import { setupTestDb, clearDatabase, type TestDb } from './db-helpers'

// Global test database instance
let testDb: TestDb

// Set up fresh database before each test
beforeEach(async () => {
  testDb = await setupTestDb()
  setTestDb(testDb)
})

// Clean up after each test
afterEach(async () => {
  if (testDb) {
    await clearDatabase(testDb)
  }
  resetDb()
})

// Mock Clerk auth - can be overridden per test
vi.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'test_user_123' }),
  currentUser: () => Promise.resolve({ id: 'test_user_123', firstName: 'Test' }),
}))

// Export for tests that need direct db access
export { testDb }
