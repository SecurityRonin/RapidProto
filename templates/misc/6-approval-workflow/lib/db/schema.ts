/**
 * Template #6: Approval Workflow
 * Database schema for multi-step approval processes
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

/**
 * Approval Templates
 * Define reusable approval workflows with pre-configured steps
 */
export const approvalTemplates = sqliteTable('approval_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  requestType: text('request_type', {
    enum: ['expense', 'timeoff', 'purchase', 'document'],
  }).notNull(),
  // JSON array: [{ email: string, role?: string, isOptional?: boolean }]
  steps: text('steps').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

/**
 * Approval Requests
 * Individual approval requests submitted by users
 */
export const approvalRequests = sqliteTable('approval_requests', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  requesterId: text('requester_id').notNull(),
  requesterEmail: text('requester_email').notNull(),
  requestType: text('request_type', {
    enum: ['expense', 'timeoff', 'purchase', 'document'],
  }).notNull(),
  // Amount for expense/purchase requests
  amount: real('amount'),
  // URL to attached file (Vercel Blob, etc.)
  attachmentUrl: text('attachment_url'),
  // Reference to template used (if any)
  templateId: text('template_id').references(() => approvalTemplates.id),
  // Current step number (1-indexed)
  currentStep: integer('current_step').notNull().default(1),
  // Request status
  status: text('status', {
    enum: ['pending', 'in_progress', 'approved', 'rejected', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

/**
 * Approval Steps
 * Individual approval steps for each request
 */
export const approvalSteps = sqliteTable('approval_steps', {
  id: text('id').primaryKey(),
  requestId: text('request_id')
    .notNull()
    .references(() => approvalRequests.id, { onDelete: 'cascade' }),
  // Step order (1-indexed)
  stepNumber: integer('step_number').notNull(),
  // Approver info
  approverId: text('approver_id'), // Set when approved/rejected
  approverEmail: text('approver_email').notNull(),
  approverRole: text('approver_role'), // e.g., "manager", "finance", "executive"
  // Whether this step can be skipped
  isOptional: integer('is_optional', { mode: 'boolean' }).notNull().default(false),
  // Step status
  status: text('status', {
    enum: ['pending', 'approved', 'rejected', 'skipped'],
  })
    .notNull()
    .default('pending'),
  // Approver's comments
  comments: text('comments'),
  // When the decision was made
  decidedAt: integer('decided_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Type exports
export type ApprovalTemplate = typeof approvalTemplates.$inferSelect
export type NewApprovalTemplate = typeof approvalTemplates.$inferInsert

export type ApprovalRequest = typeof approvalRequests.$inferSelect
export type NewApprovalRequest = typeof approvalRequests.$inferInsert

export type ApprovalStep = typeof approvalSteps.$inferSelect
export type NewApprovalStep = typeof approvalSteps.$inferInsert

// Request type enum for validation
export const REQUEST_TYPES = ['expense', 'timeoff', 'purchase', 'document'] as const
export type RequestType = (typeof REQUEST_TYPES)[number]

// Status enums for validation
export const REQUEST_STATUSES = ['pending', 'in_progress', 'approved', 'rejected', 'cancelled'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const STEP_STATUSES = ['pending', 'approved', 'rejected', 'skipped'] as const
export type StepStatus = (typeof STEP_STATUSES)[number]

// Step configuration for templates
export interface TemplateStep {
  email: string
  role?: string
  isOptional?: boolean
}

// Request with steps for API responses
export interface ApprovalRequestWithSteps extends ApprovalRequest {
  steps?: ApprovalStep[]
}

// History entry for audit trail
export interface HistoryEntry {
  stepNumber: number
  approverEmail: string
  approverRole?: string | null
  status: StepStatus
  comments?: string | null
  decidedAt?: Date | null
}
