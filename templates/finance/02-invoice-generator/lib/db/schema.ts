/**
 * Template #2: Invoice Generator
 * Database schema for invoices, clients, and line items
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Invoice status type
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

// ============================================================
// CLIENTS TABLE
// ============================================================
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  address: text('address'),
  phone: text('phone'),
  userId: text('user_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

// ============================================================
// INVOICES TABLE
// ============================================================
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId: text('client_id')
    .notNull()
    .references(() => clients.id),
  issueDate: integer('issue_date', { mode: 'timestamp' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  status: text('status', {
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  })
    .notNull()
    .default('draft'),
  subtotal: real('subtotal').notNull().default(0),
  tax: real('tax').notNull().default(0),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  userId: text('user_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

// ============================================================
// INVOICE LINE ITEMS TABLE
// ============================================================
export const invoiceLineItems = sqliteTable('invoice_line_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
})

// ============================================================
// TYPE EXPORTS
// ============================================================
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert

export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert
