/**
 * Template #1: Expense Tracker
 * Database schema
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

/**
 * Users table - stores Clerk user information
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

/**
 * Expense categories table - user-defined expense categories with optional budget limits
 */
export const expenseCategories = sqliteTable('expense_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  budgetLimit: real('budget_limit'), // Optional monthly budget limit
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

/**
 * Expense status enum values
 */
export const EXPENSE_STATUSES = ['pending', 'approved', 'rejected', 'reimbursed'] as const
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number]

/**
 * Expenses table - individual expense records
 */
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(), // Expense amount (supports decimals)
  category: text('category').notNull(), // Category name/identifier
  vendor: text('vendor').notNull(), // Vendor/merchant name
  date: text('date').notNull(), // ISO date string (YYYY-MM-DD)
  description: text('description'), // Optional description
  receipt_url: text('receipt_url'), // Optional URL to uploaded receipt
  status: text('status', { enum: EXPENSE_STATUSES })
    .notNull()
    .default('pending'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type ExpenseCategory = typeof expenseCategories.$inferSelect
export type NewExpenseCategory = typeof expenseCategories.$inferInsert

export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
