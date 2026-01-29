import { sql } from 'drizzle-orm'
import { createTestDb } from '@/lib/db'
import { users, expenses, expenseCategories } from '@/lib/db/schema'

/**
 * Test database helpers for Expense Tracker
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
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      budget_limit REAL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      vendor TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      receipt_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
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

export async function seedTestCategory(
  db: ReturnType<typeof createTestDb>,
  userId: string = 'user_test123'
) {
  const category = {
    id: `cat_${Date.now()}`,
    name: 'Test Category',
    budgetLimit: 500,
    userId,
  }

  await db.insert(expenseCategories).values(category)
  return category
}

export async function seedTestExpense(
  db: ReturnType<typeof createTestDb>,
  userId: string = 'user_test123'
) {
  const expense = {
    id: `exp_${Date.now()}`,
    amount: 100.00,
    category: 'food',
    vendor: 'Test Restaurant',
    date: '2024-01-15',
    description: 'Test expense',
    receipt_url: null,
    status: 'pending' as const,
    userId,
  }

  await db.insert(expenses).values(expense)
  return expense
}

export async function clearDatabase(db: ReturnType<typeof createTestDb>) {
  await db.delete(expenses)
  await db.delete(expenseCategories)
  await db.delete(users)
}
