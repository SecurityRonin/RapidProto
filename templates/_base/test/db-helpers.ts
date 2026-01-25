import { sql } from 'drizzle-orm'
import { createTestDb } from '@/lib/db'
import { users, items } from '@/lib/db/schema'

/**
 * Test database helpers
 * Use these in your tests for database operations
 */

export async function setupTestDb() {
  const db = createTestDb()

  // Create tables
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  return db
}

export async function seedTestUser(db: ReturnType<typeof createTestDb>) {
  const user = {
    id: 'user_test123',
    email: 'test@example.com',
    name: 'Test User',
  }

  await db.insert(users).values(user)
  return user
}

export async function seedTestItem(
  db: ReturnType<typeof createTestDb>,
  userId: string = 'user_test123'
) {
  const item = {
    id: `item_${Date.now()}`,
    title: 'Test Item',
    description: 'Test Description',
    status: 'active' as const,
    userId,
  }

  await db.insert(items).values(item)
  return item
}

export async function clearDatabase(db: ReturnType<typeof createTestDb>) {
  await db.delete(items)
  await db.delete(users)
}
