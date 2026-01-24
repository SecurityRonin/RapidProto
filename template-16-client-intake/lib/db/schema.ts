import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

/**
 * Template #16: Client Intake & Onboarding
 * For professional services firms (law, accounting, consulting, etc.)
 */

// Clients table
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['individual', 'business'] }).notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'), // JSON: { street, city, state, zip }
  status: text('status', {
    enum: ['prospect', 'active', 'inactive', 'conflict'],
  })
    .notNull()
    .default('prospect'),
  assignedTo: text('assigned_to'), // User ID (partner/manager)
  source: text('source'), // referral, website, event, cold-call
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

// Intake forms (templates)
export const intakeForms = sqliteTable('intake_forms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  firmType: text('firm_type', {
    enum: ['law', 'accounting', 'consulting', 'architecture', 'medical'],
  }).notNull(),
  fields: text('fields').notNull(), // JSON: form field definitions
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Form submissions
export const intakeSubmissions = sqliteTable('intake_submissions', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => intakeForms.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => clients.id),
  submitterEmail: text('submitter_email').notNull(),
  submitterName: text('submitter_name').notNull(),
  data: text('data').notNull(), // JSON: form field responses
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  reviewedBy: text('reviewed_by'),
  reviewNotes: text('review_notes'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  submittedAt: integer('submitted_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Conflict checks (for law firms, etc.)
export const conflictChecks = sqliteTable('conflict_checks', {
  id: text('id').primaryKey(),
  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  opposingParties: text('opposing_parties'), // JSON: array of names/entities
  relatedMatters: text('related_matters'), // JSON: array of matter IDs
  status: text('status', { enum: ['clear', 'conflict', 'review'] })
    .notNull()
    .default('review'),
  checkedBy: text('checked_by').notNull(),
  notes: text('notes'),
  clearedAt: integer('cleared_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Onboarding tasks
export const onboardingTasks = sqliteTable('onboarding_tasks', {
  id: text('id').primaryKey(),
  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  assignedTo: text('assigned_to'), // User ID
  dueDate: integer('due_date', { mode: 'timestamp' }),
  priority: text('priority', { enum: ['low', 'medium', 'high'] })
    .notNull()
    .default('medium'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedBy: text('completed_by'),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Document uploads
export const clientDocuments = sqliteTable('client_documents', {
  id: text('id').primaryKey(),
  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type'), // id, business_license, tax_return, etc.
  blobUrl: text('blob_url').notNull(),
  extractedData: text('extracted_data'), // JSON: AI-extracted information
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Type exports
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert

export type IntakeForm = typeof intakeForms.$inferSelect
export type NewIntakeForm = typeof intakeForms.$inferInsert

export type IntakeSubmission = typeof intakeSubmissions.$inferSelect
export type NewIntakeSubmission = typeof intakeSubmissions.$inferInsert

export type ConflictCheck = typeof conflictChecks.$inferSelect
export type NewConflictCheck = typeof conflictChecks.$inferInsert

export type OnboardingTask = typeof onboardingTasks.$inferSelect
export type NewOnboardingTask = typeof onboardingTasks.$inferInsert

export type ClientDocument = typeof clientDocuments.$inferSelect
export type NewClientDocument = typeof clientDocuments.$inferInsert
