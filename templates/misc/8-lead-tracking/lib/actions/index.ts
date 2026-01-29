/**
 * Template #8: Lead Tracking
 * Server actions for sales lead management
 */

'use server'

import { db } from '@/lib/db'
import { leads, leadActivities, type Lead, type LeadActivity } from '../db/schema'
import { eq, and, lt, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type LeadSource = 'web' | 'referral' | 'event' | 'cold'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type ActivityType = 'call' | 'email' | 'meeting' | 'note'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// Validation Schemas
// ============================================================================

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(['web', 'referral', 'event', 'cold']),
  value: z.number().min(0, 'Value must be non-negative').optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

export const updateLeadSchema = createLeadSchema.partial()

export const addActivitySchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  type: z.enum(['call', 'email', 'meeting', 'note']),
  description: z.string().min(1, 'Description is required'),
  userId: z.string().optional(),
})

export const scheduleActivitySchema = addActivitySchema.extend({
  scheduledAt: z.date({ required_error: 'Scheduled date is required' }),
})

// ============================================================================
// Lead CRUD Actions
// ============================================================================

/**
 * Create a new lead
 */
export async function createLead(
  data: z.infer<typeof createLeadSchema>
): Promise<ActionResult<Lead>> {
  const validated = createLeadSchema.parse(data)

  const [lead] = await db.insert(leads).values({
    id: crypto.randomUUID(),
    ...validated,
    email: validated.email || null,
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  return { success: true, data: lead }
}

/**
 * Get leads with optional filters
 */
export async function getLeads(filters?: {
  status?: LeadStatus
  source?: LeadSource
  assignedTo?: string
}): Promise<ActionResult<Lead[]>> {
  let query = db.select().from(leads).orderBy(desc(leads.createdAt))

  const conditions: ReturnType<typeof eq>[] = []

  if (filters?.status) {
    conditions.push(eq(leads.status, filters.status))
  }
  if (filters?.source) {
    conditions.push(eq(leads.source, filters.source))
  }
  if (filters?.assignedTo) {
    conditions.push(eq(leads.assignedTo, filters.assignedTo))
  }

  const result = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query.where(and())

  return { success: true, data: result }
}

/**
 * Get a single lead by ID with its activities
 */
export async function getLeadById(
  id: string
): Promise<ActionResult<{ lead: Lead; activities: LeadActivity[] }>> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id))

  if (!lead) {
    return { success: false, error: 'Lead not found' }
  }

  const activities = await db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, id))
    .orderBy(desc(leadActivities.createdAt))

  return { success: true, data: { lead, activities } }
}

/**
 * Update lead fields
 */
export async function updateLead(
  id: string,
  data: z.infer<typeof updateLeadSchema>
): Promise<ActionResult<Lead>> {
  const validated = updateLeadSchema.parse(data)

  const [lead] = await db
    .update(leads)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning()

  if (!lead) {
    return { success: false, error: 'Lead not found' }
  }

  return { success: true, data: lead }
}

/**
 * Update lead status with timestamp
 */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<ActionResult<Lead>> {
  // Validate status
  const validStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`)
  }

  const updateData: Partial<Lead> = {
    status,
    updatedAt: new Date(),
  }

  // Update lastContactedAt for contact-related statuses
  if (['contacted', 'qualified', 'proposal', 'negotiation'].includes(status)) {
    updateData.lastContactedAt = new Date()
  }

  const [lead] = await db
    .update(leads)
    .set(updateData)
    .where(eq(leads.id, id))
    .returning()

  if (!lead) {
    return { success: false, error: 'Lead not found' }
  }

  return { success: true, data: lead }
}

/**
 * Assign lead to a user
 */
export async function assignLead(
  id: string,
  userId: string | null
): Promise<ActionResult<Lead>> {
  const [lead] = await db
    .update(leads)
    .set({
      assignedTo: userId,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id))
    .returning()

  if (!lead) {
    return { success: false, error: 'Lead not found' }
  }

  return { success: true, data: lead }
}

// ============================================================================
// Activity Actions
// ============================================================================

/**
 * Add an activity log for a lead
 */
export async function addActivity(
  data: z.infer<typeof addActivitySchema>
): Promise<ActionResult<LeadActivity>> {
  const validated = addActivitySchema.parse(data)

  const [activity] = await db.insert(leadActivities).values({
    id: crypto.randomUUID(),
    ...validated,
    completedAt: new Date(),
    createdAt: new Date(),
  }).returning()

  // Update lead's lastContactedAt
  await db
    .update(leads)
    .set({
      lastContactedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, validated.leadId))

  return { success: true, data: activity }
}

/**
 * Schedule a future follow-up activity
 */
export async function scheduleActivity(
  data: z.infer<typeof scheduleActivitySchema>
): Promise<ActionResult<LeadActivity>> {
  const validated = scheduleActivitySchema.parse(data)

  const [activity] = await db.insert(leadActivities).values({
    id: crypto.randomUUID(),
    ...validated,
    completedAt: null,
    createdAt: new Date(),
  }).returning()

  return { success: true, data: activity }
}

/**
 * Mark an activity as completed
 */
export async function completeActivity(
  id: string
): Promise<ActionResult<LeadActivity>> {
  const [activity] = await db
    .update(leadActivities)
    .set({
      completedAt: new Date(),
    })
    .where(eq(leadActivities.id, id))
    .returning()

  if (!activity) {
    return { success: false, error: 'Activity not found' }
  }

  // Update lead's lastContactedAt
  await db
    .update(leads)
    .set({
      lastContactedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, activity.leadId))

  return { success: true, data: activity }
}

// ============================================================================
// Pipeline & Analytics Actions
// ============================================================================

type StageData = {
  count: number
  value: number
}

type PipelineData = Record<LeadStatus, StageData>

/**
 * Get leads grouped by pipeline stage with count and total value
 */
export async function getLeadsByStage(): Promise<ActionResult<PipelineData>> {
  const allLeads = await db.select().from(leads)

  const stages: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

  const pipelineData: PipelineData = stages.reduce((acc, stage) => {
    acc[stage] = { count: 0, value: 0 }
    return acc
  }, {} as PipelineData)

  for (const lead of allLeads) {
    const stage = lead.status as LeadStatus
    pipelineData[stage].count += 1
    pipelineData[stage].value += lead.value ?? 0
  }

  return { success: true, data: pipelineData }
}

type ConversionData = {
  totalLeads: number
  wonLeads: number
  lostLeads: number
  closedDeals: number
  conversionRate: number // won / total * 100
  winRate: number // won / (won + lost) * 100
}

/**
 * Calculate lead conversion rate
 */
export async function getLeadConversionRate(): Promise<ActionResult<ConversionData>> {
  const allLeads = await db.select().from(leads)

  const totalLeads = allLeads.length
  const wonLeads = allLeads.filter(l => l.status === 'won').length
  const lostLeads = allLeads.filter(l => l.status === 'lost').length
  const closedDeals = wonLeads + lostLeads

  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0
  const winRate = closedDeals > 0 ? (wonLeads / closedDeals) * 100 : 0

  return {
    success: true,
    data: {
      totalLeads,
      wonLeads,
      lostLeads,
      closedDeals,
      conversionRate,
      winRate,
    },
  }
}

type SourceData = {
  count: number
  totalValue: number
  wonCount: number
  conversionRate: number
}

type SourceAnalytics = Record<LeadSource, SourceData>

/**
 * Get lead statistics grouped by source
 */
export async function getLeadsBySource(): Promise<ActionResult<SourceAnalytics>> {
  const allLeads = await db.select().from(leads)

  const sources: LeadSource[] = ['web', 'referral', 'event', 'cold']

  const sourceData: SourceAnalytics = sources.reduce((acc, source) => {
    acc[source] = { count: 0, totalValue: 0, wonCount: 0, conversionRate: 0 }
    return acc
  }, {} as SourceAnalytics)

  for (const lead of allLeads) {
    const source = lead.source as LeadSource
    sourceData[source].count += 1
    sourceData[source].totalValue += lead.value ?? 0
    if (lead.status === 'won') {
      sourceData[source].wonCount += 1
    }
  }

  // Calculate conversion rates
  for (const source of sources) {
    const data = sourceData[source]
    data.conversionRate = data.count > 0 ? (data.wonCount / data.count) * 100 : 0
  }

  return { success: true, data: sourceData }
}

type OverdueActivity = LeadActivity & { lead?: Lead }

/**
 * Get scheduled activities that are past due and not completed
 */
export async function getOverdueFollowUps(filters?: {
  userId?: string
}): Promise<ActionResult<OverdueActivity[]>> {
  const now = new Date()

  let conditions = [
    lt(leadActivities.scheduledAt, now),
    isNull(leadActivities.completedAt),
  ]

  if (filters?.userId) {
    conditions.push(eq(leadActivities.userId, filters.userId))
  }

  const overdueActivities = await db
    .select()
    .from(leadActivities)
    .where(and(...conditions))
    .orderBy(leadActivities.scheduledAt)

  return { success: true, data: overdueActivities }
}

// ============================================================================
// Legacy exports for backward compatibility
// ============================================================================

export { createLead as createItem }
export { getLeads as getItems }
export { getLeadById as getItem }
export { updateLead as updateItem }
