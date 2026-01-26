import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

export type DbInstance = ReturnType<typeof drizzle<typeof schema>>

// Create client (environment-specific)
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Default production/development db
const defaultDb = drizzle(client, { schema })

// Mutable reference for test injection
let currentDb: DbInstance = defaultDb

// Export db getter - allows test injection
export const db: DbInstance = new Proxy({} as DbInstance, {
  get: (_, prop) => (currentDb as any)[prop],
})

/**
 * Set a custom database instance (for testing with in-memory SQLite)
 */
export function setTestDb(testDb: DbInstance): void {
  currentDb = testDb
}

/**
 * Reset to default database instance
 */
export function resetDb(): void {
  currentDb = defaultDb
}

/**
 * Create an in-memory test database
 */
export function createTestDb(): DbInstance {
  const testClient = createClient({
    url: ':memory:',
  })
  return drizzle(testClient, { schema })
}
