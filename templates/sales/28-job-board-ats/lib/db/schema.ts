/**
 * Template #28: Job Board ATS
 * Database schema
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// TODO: Define your database tables here
// Example:
export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type Item = typeof items.$inferSelect
