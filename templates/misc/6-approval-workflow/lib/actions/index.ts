/**
 * Template #6: Approval Workflow
 * Server actions for multi-step approval processes
 */

'use server'

import { auth, currentUser } from '@clerk/nextjs'
import { eq, and, or, desc } from 'drizzle-orm'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import {
  approvalTemplates,
  approvalRequests,
  approvalSteps,
  type ApprovalTemplate,
  type ApprovalRequest,
  type ApprovalStep,
  type ApprovalRequestWithSteps,
  type TemplateStep,
  type HistoryEntry,
  REQUEST_TYPES,
  REQUEST_STATUSES,
  STEP_STATUSES,
} from '../db/schema'

// ============================================================
// TYPES
// ============================================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const templateStepSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.string().optional(),
  isOptional: z.boolean().optional().default(false),
})

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  requestType: z.enum(REQUEST_TYPES),
  steps: z.array(templateStepSchema).min(1, 'At least one step is required'),
})

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  steps: z.array(templateStepSchema).min(1).optional(),
})

const createRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  requestType: z.enum(REQUEST_TYPES),
  amount: z.number().optional(),
  attachmentUrl: z.string().url().optional(),
  templateId: z.string().optional(),
  steps: z.array(templateStepSchema).optional(),
}).refine(
  (data) => data.templateId || (data.steps && data.steps.length > 0),
  { message: 'Either template or steps must be provided' }
)

const approveStepSchema = z.object({
  approverId: z.string().min(1),
  comments: z.string().optional(),
  stepNumber: z.number().optional(),
})

const rejectStepSchema = z.object({
  approverId: z.string().min(1),
  comments: z.string().min(1, 'Rejection comment is required'),
  stepNumber: z.number().optional(),
})

const skipStepSchema = z.object({
  stepNumber: z.number().min(1),
  reason: z.string().optional(),
})

const reassignStepSchema = z.object({
  stepNumber: z.number().min(1),
  newApproverEmail: z.string().email('Invalid email format'),
  reason: z.string().optional(),
})

const getRequestsFilterSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  requestType: z.enum(REQUEST_TYPES).optional(),
  requesterId: z.string().optional(),
})

// ============================================================
// TEMPLATE OPERATIONS
// ============================================================

/**
 * Create a new approval template
 */
export async function createTemplate(
  input: z.infer<typeof createTemplateSchema>
): Promise<ActionResult<ApprovalTemplate & { steps: TemplateStep[] }>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createTemplateSchema.parse(input)

    const newTemplate = {
      id: nanoid(),
      name: validated.name,
      requestType: validated.requestType,
      steps: JSON.stringify(validated.steps),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [created] = await db.insert(approvalTemplates).values(newTemplate).returning()

    return {
      success: true,
      data: {
        ...created,
        steps: validated.steps,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create template' }
  }
}

/**
 * Get all templates with optional filtering
 */
export async function getTemplates(filters?: {
  requestType?: typeof REQUEST_TYPES[number]
}): Promise<ActionResult<(ApprovalTemplate & { steps: TemplateStep[] })[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const conditions = []
    if (filters?.requestType) {
      conditions.push(eq(approvalTemplates.requestType, filters.requestType))
    }

    const results = await db
      .select()
      .from(approvalTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(approvalTemplates.createdAt))

    const templatesWithSteps = results.map((t) => ({
      ...t,
      steps: JSON.parse(t.steps) as TemplateStep[],
    }))

    return { success: true, data: templatesWithSteps }
  } catch (error) {
    return { success: false, error: 'Failed to fetch templates' }
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  id: string,
  input: z.infer<typeof updateTemplateSchema>
): Promise<ActionResult<ApprovalTemplate & { steps: TemplateStep[] }>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = updateTemplateSchema.parse(input)

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    }
    if (validated.name) updateData.name = validated.name
    if (validated.steps) updateData.steps = JSON.stringify(validated.steps)

    const [updated] = await db
      .update(approvalTemplates)
      .set(updateData)
      .where(eq(approvalTemplates.id, id))
      .returning()

    if (!updated) {
      return { success: false, error: 'Template not found' }
    }

    return {
      success: true,
      data: {
        ...updated,
        steps: JSON.parse(updated.steps) as TemplateStep[],
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update template' }
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.delete(approvalTemplates).where(eq(approvalTemplates.id, id))

    return { success: true, data: { deleted: true } }
  } catch (error) {
    return { success: false, error: 'Failed to delete template' }
  }
}

// ============================================================
// REQUEST OPERATIONS
// ============================================================

/**
 * Create a new approval request with auto-generated steps
 */
export async function createRequest(
  input: z.infer<typeof createRequestSchema>
): Promise<ActionResult<ApprovalRequestWithSteps>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await currentUser()
    const requesterEmail = user?.emailAddresses[0]?.emailAddress || 'unknown@unknown.com'

    const validated = createRequestSchema.parse(input)

    // Get steps from template or input
    let stepConfigs: TemplateStep[] = []

    if (validated.templateId) {
      const [template] = await db
        .select()
        .from(approvalTemplates)
        .where(eq(approvalTemplates.id, validated.templateId))

      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      stepConfigs = JSON.parse(template.steps) as TemplateStep[]
    } else if (validated.steps) {
      stepConfigs = validated.steps
    }

    if (stepConfigs.length === 0) {
      return { success: false, error: 'Either template or steps must be provided' }
    }

    // Create request
    const requestId = nanoid()
    const newRequest = {
      id: requestId,
      title: validated.title,
      description: validated.description || null,
      requesterId: userId,
      requesterEmail,
      requestType: validated.requestType,
      amount: validated.amount ?? null,
      attachmentUrl: validated.attachmentUrl || null,
      templateId: validated.templateId || null,
      currentStep: 1,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [createdRequest] = await db.insert(approvalRequests).values(newRequest).returning()

    // Create steps
    const stepsToInsert = stepConfigs.map((step, index) => ({
      id: nanoid(),
      requestId,
      stepNumber: index + 1,
      approverId: null,
      approverEmail: step.email,
      approverRole: step.role || null,
      isOptional: step.isOptional || false,
      status: 'pending' as const,
      comments: null,
      decidedAt: null,
      createdAt: new Date(),
    }))

    await db.insert(approvalSteps).values(stepsToInsert)

    // Fetch created steps
    const createdSteps = await db
      .select()
      .from(approvalSteps)
      .where(eq(approvalSteps.requestId, requestId))
      .orderBy(approvalSteps.stepNumber)

    return {
      success: true,
      data: {
        ...createdRequest,
        steps: createdSteps,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create request' }
  }
}

/**
 * Get requests with optional filtering
 */
export async function getRequests(
  filters?: z.infer<typeof getRequestsFilterSchema>
): Promise<ActionResult<ApprovalRequest[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const conditions = []

    if (filters?.status) {
      conditions.push(eq(approvalRequests.status, filters.status))
    }
    if (filters?.requestType) {
      conditions.push(eq(approvalRequests.requestType, filters.requestType))
    }
    if (filters?.requesterId) {
      conditions.push(eq(approvalRequests.requesterId, filters.requesterId))
    }

    const results = await db
      .select()
      .from(approvalRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(approvalRequests.createdAt))

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch requests' }
  }
}

/**
 * Get a single request with all its steps
 */
export async function getRequestById(
  id: string
): Promise<ActionResult<ApprovalRequestWithSteps>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, id))

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    const steps = await db
      .select()
      .from(approvalSteps)
      .where(eq(approvalSteps.requestId, id))
      .orderBy(approvalSteps.stepNumber)

    return {
      success: true,
      data: {
        ...request,
        steps,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch request' }
  }
}

// ============================================================
// APPROVAL FLOW OPERATIONS
// ============================================================

/**
 * Approve the current step of a request
 */
export async function approveStep(
  requestId: string,
  input: z.infer<typeof approveStepSchema>
): Promise<ActionResult<{ request: ApprovalRequest; step: ApprovalStep }>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = approveStepSchema.parse(input)

    // Get request
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, requestId))

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    if (request.status === 'rejected' || request.status === 'cancelled') {
      return { success: false, error: 'Request is already closed' }
    }

    if (request.status === 'approved') {
      return { success: false, error: 'Request is already approved' }
    }

    // Get current step
    const targetStepNumber = validated.stepNumber || request.currentStep

    if (targetStepNumber !== request.currentStep) {
      return { success: false, error: 'This is not the current step' }
    }

    const [currentStep] = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.requestId, requestId),
          eq(approvalSteps.stepNumber, targetStepNumber)
        )
      )

    if (!currentStep) {
      return { success: false, error: 'Step not found' }
    }

    if (currentStep.status !== 'pending') {
      return { success: false, error: 'Step has already been processed' }
    }

    // Update step
    const [updatedStep] = await db
      .update(approvalSteps)
      .set({
        status: 'approved',
        approverId: validated.approverId,
        comments: validated.comments || null,
        decidedAt: new Date(),
      })
      .where(eq(approvalSteps.id, currentStep.id))
      .returning()

    // Check if there are more steps
    const allSteps = await db
      .select()
      .from(approvalSteps)
      .where(eq(approvalSteps.requestId, requestId))
      .orderBy(approvalSteps.stepNumber)

    const nextStep = allSteps.find((s) => s.stepNumber > targetStepNumber && s.status === 'pending')

    // Update request status
    let newStatus: typeof request.status
    let newCurrentStep: number

    if (nextStep) {
      newStatus = 'in_progress'
      newCurrentStep = nextStep.stepNumber
    } else {
      newStatus = 'approved'
      newCurrentStep = targetStepNumber
    }

    const [updatedRequest] = await db
      .update(approvalRequests)
      .set({
        status: newStatus,
        currentStep: newCurrentStep,
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, requestId))
      .returning()

    return {
      success: true,
      data: {
        request: updatedRequest,
        step: updatedStep,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to approve step' }
  }
}

/**
 * Reject the current step (and the entire request)
 */
export async function rejectStep(
  requestId: string,
  input: z.infer<typeof rejectStepSchema>
): Promise<ActionResult<{ request: ApprovalRequest; step: ApprovalStep }>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = rejectStepSchema.parse(input)

    // Get request
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, requestId))

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    if (request.status === 'rejected') {
      return { success: false, error: 'Request is already rejected' }
    }

    if (request.status === 'cancelled') {
      return { success: false, error: 'Request is cancelled' }
    }

    if (request.status === 'approved') {
      return { success: false, error: 'Request is already approved' }
    }

    // Get current step
    const targetStepNumber = validated.stepNumber || request.currentStep

    const [currentStep] = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.requestId, requestId),
          eq(approvalSteps.stepNumber, targetStepNumber)
        )
      )

    if (!currentStep) {
      return { success: false, error: 'Step not found' }
    }

    if (currentStep.status !== 'pending') {
      return { success: false, error: 'Step has already been processed' }
    }

    // Update step
    const [updatedStep] = await db
      .update(approvalSteps)
      .set({
        status: 'rejected',
        approverId: validated.approverId,
        comments: validated.comments,
        decidedAt: new Date(),
      })
      .where(eq(approvalSteps.id, currentStep.id))
      .returning()

    // Reject the entire request
    const [updatedRequest] = await db
      .update(approvalRequests)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, requestId))
      .returning()

    return {
      success: true,
      data: {
        request: updatedRequest,
        step: updatedStep,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to reject step' }
  }
}

/**
 * Skip an optional step
 */
export async function skipStep(
  requestId: string,
  input: z.infer<typeof skipStepSchema>
): Promise<ActionResult<{ request: ApprovalRequest; step: ApprovalStep }>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = skipStepSchema.parse(input)

    // Get request
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, requestId))

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    if (request.status === 'rejected' || request.status === 'cancelled' || request.status === 'approved') {
      return { success: false, error: 'Request is already closed' }
    }

    if (validated.stepNumber !== request.currentStep) {
      return { success: false, error: 'This is not the current step' }
    }

    // Get step
    const [step] = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.requestId, requestId),
          eq(approvalSteps.stepNumber, validated.stepNumber)
        )
      )

    if (!step) {
      return { success: false, error: 'Step not found' }
    }

    if (!step.isOptional) {
      return { success: false, error: 'This step is not optional' }
    }

    if (step.status !== 'pending') {
      return { success: false, error: 'Step has already been processed' }
    }

    // Update step
    const [updatedStep] = await db
      .update(approvalSteps)
      .set({
        status: 'skipped',
        comments: validated.reason || null,
        decidedAt: new Date(),
      })
      .where(eq(approvalSteps.id, step.id))
      .returning()

    // Check for next step
    const allSteps = await db
      .select()
      .from(approvalSteps)
      .where(eq(approvalSteps.requestId, requestId))
      .orderBy(approvalSteps.stepNumber)

    const nextStep = allSteps.find((s) => s.stepNumber > validated.stepNumber && s.status === 'pending')

    let newStatus: typeof request.status
    let newCurrentStep: number

    if (nextStep) {
      newStatus = 'in_progress'
      newCurrentStep = nextStep.stepNumber
    } else {
      newStatus = 'approved'
      newCurrentStep = validated.stepNumber
    }

    const [updatedRequest] = await db
      .update(approvalRequests)
      .set({
        status: newStatus,
        currentStep: newCurrentStep,
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, requestId))
      .returning()

    return {
      success: true,
      data: {
        request: updatedRequest,
        step: updatedStep,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to skip step' }
  }
}

// ============================================================
// REQUEST MANAGEMENT
// ============================================================

/**
 * Cancel a request (by requester only)
 */
export async function cancelRequest(
  requestId: string
): Promise<ActionResult<ApprovalRequest>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get request
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, requestId))

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    // Only requester can cancel
    if (request.requesterId !== userId) {
      return { success: false, error: 'You are not authorized to cancel this request' }
    }

    // Cannot cancel already completed requests
    if (request.status === 'approved') {
      return { success: false, error: 'You cannot cancel an approved request' }
    }

    if (request.status === 'rejected') {
      return { success: false, error: 'You cannot cancel a rejected request' }
    }

    if (request.status === 'cancelled') {
      return { success: false, error: 'Request is already cancelled' }
    }

    // Cancel request
    const [updatedRequest] = await db
      .update(approvalRequests)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, requestId))
      .returning()

    return { success: true, data: updatedRequest }
  } catch (error) {
    return { success: false, error: 'Failed to cancel request' }
  }
}

/**
 * Reassign a step to a different approver
 */
export async function reassignStep(
  requestId: string,
  input: z.infer<typeof reassignStepSchema>
): Promise<ActionResult<ApprovalStep>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = reassignStepSchema.parse(input)

    // Get step
    const [step] = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.requestId, requestId),
          eq(approvalSteps.stepNumber, validated.stepNumber)
        )
      )

    if (!step) {
      return { success: false, error: 'Step not found' }
    }

    if (step.status !== 'pending') {
      return { success: false, error: 'Step is already completed' }
    }

    // Update step
    const [updatedStep] = await db
      .update(approvalSteps)
      .set({
        approverEmail: validated.newApproverEmail,
        comments: validated.reason
          ? `Reassigned: ${validated.reason}`
          : null,
      })
      .where(eq(approvalSteps.id, step.id))
      .returning()

    return { success: true, data: updatedStep }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to reassign step' }
  }
}

// ============================================================
// QUERY OPERATIONS
// ============================================================

/**
 * Get pending approvals for a specific approver
 */
export async function getMyPendingApprovals(
  approverEmail: string
): Promise<ActionResult<ApprovalRequestWithSteps[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get all pending steps for this approver
    const pendingSteps = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.approverEmail, approverEmail),
          eq(approvalSteps.status, 'pending')
        )
      )

    // Get corresponding requests that are active and at the step for this approver
    const results: ApprovalRequestWithSteps[] = []

    for (const step of pendingSteps) {
      const [request] = await db
        .select()
        .from(approvalRequests)
        .where(
          and(
            eq(approvalRequests.id, step.requestId),
            eq(approvalRequests.currentStep, step.stepNumber),
            or(
              eq(approvalRequests.status, 'pending'),
              eq(approvalRequests.status, 'in_progress')
            )
          )
        )

      if (request) {
        const allSteps = await db
          .select()
          .from(approvalSteps)
          .where(eq(approvalSteps.requestId, request.id))
          .orderBy(approvalSteps.stepNumber)

        results.push({
          ...request,
          steps: allSteps,
        })
      }
    }

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch pending approvals' }
  }
}

/**
 * Get full history/audit trail for a request
 */
export async function getRequestHistory(
  requestId: string
): Promise<ActionResult<{ request: ApprovalRequest; history: HistoryEntry[] }>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get request
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, requestId))

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    // Get all steps that have been actioned
    const steps = await db
      .select()
      .from(approvalSteps)
      .where(eq(approvalSteps.requestId, requestId))
      .orderBy(approvalSteps.stepNumber)

    const history: HistoryEntry[] = steps
      .filter((s) => s.status !== 'pending')
      .map((s) => ({
        stepNumber: s.stepNumber,
        approverEmail: s.approverEmail,
        approverRole: s.approverRole,
        status: s.status as HistoryEntry['status'],
        comments: s.comments,
        decidedAt: s.decidedAt,
      }))

    return {
      success: true,
      data: {
        request,
        history,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch request history' }
  }
}
