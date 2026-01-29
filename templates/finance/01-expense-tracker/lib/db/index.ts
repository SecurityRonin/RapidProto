/**
 * Template #1: Expense Tracker
 * Database connection
 */

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

// Create Turso client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Create Drizzle instance with schema
export const db = drizzle(client, { schema })

// For testing - use in-memory SQLite
export function createTestDb() {
  const testClient = createClient({
    url: ':memory:',
  })
  return drizzle(testClient, { schema })
}
