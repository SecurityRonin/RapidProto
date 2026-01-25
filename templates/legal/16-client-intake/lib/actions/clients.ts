'use server'

import { auth } from '@clerk/nextjs'
import { eq, and, like, or } from 'drizzle-orm'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import {
  clients,
  intakeSubmissions,
  conflictChecks,
  onboardingTasks,
  type Client,
  type ConflictCheck,
} from '@/lib/db/schema'
import { sendEmail } from '@/lib/email'

/**
 * Template #16: Client Intake Server Actions
 * Following TDD patterns - implementation to pass tests
 */

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  type: z.enum(['individual', 'business']),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  source: z.string().optional(),
  autoConflictCheck: z.boolean().optional(),
})

const updateClientStatusSchema = z.object({
  status: z.enum(['prospect', 'active', 'inactive', 'conflict']),
})

const conflictCheckSchema = z.object({
  clientId: z.string(),
  opposingParties: z.array(z.string()),
  override: z.boolean().optional(),
  notes: z.string().optional(),
})

const approveSubmissionSchema = z.object({
  approve: z.boolean().default(true),
  createClient: z.boolean().optional(),
  generateTasks: z.boolean().optional(),
  sendWelcomeEmail: z.boolean().optional(),
  reviewNotes: z.string().optional(),
})

// Return type helper
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Create a new client
 */
export async function createClient(
  input: z.infer<typeof createClientSchema>
): Promise<
  ActionResult<
    Client & { conflictCheckId?: string }
  >
> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createClientSchema.parse(input)

    // Check for duplicate email
    const existing = await db
      .select()
      .from(clients)
      .where(eq(clients.email, validated.email))
      .limit(1)

    if (existing.length > 0) {
      return { success: false, error: 'Client with this email already exists' }
    }

    // Create client
    const newClient = {
      id: nanoid(),
      name: validated.name,
      type: validated.type,
      email: validated.email,
      phone: validated.phone || null,
      address: validated.address ? JSON.stringify(validated.address) : null,
      status: 'prospect' as const,
      source: validated.source || null,
      createdBy: userId,
    }

    const [created] = await db.insert(clients).values(newClient).returning()

    // Auto-generate conflict check if requested
    let conflictCheckId: string | undefined

    if (validated.autoConflictCheck) {
      const check = await runConflictCheck({
        clientId: created.id,
        opposingParties: [],
      })

      if (check.success) {
        conflictCheckId = check.data?.id
      }
    }

    return {
      success: true,
      data: { ...created, conflictCheckId },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create client' }
  }
}

/**
 * Get clients with optional filters
 */
export async function getClients(filters?: {
  status?: 'prospect' | 'active' | 'inactive' | 'conflict'
  type?: 'individual' | 'business'
  search?: string
  assignedTo?: string
}): Promise<ActionResult<Client[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const conditions = []

    if (filters?.status) {
      conditions.push(eq(clients.status, filters.status))
    }

    if (filters?.type) {
      conditions.push(eq(clients.type, filters.type))
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(clients.name, `%${filters.search}%`),
          like(clients.email, `%${filters.search}%`)
        )!
      )
    }

    if (filters?.assignedTo) {
      conditions.push(eq(clients.assignedTo, filters.assignedTo))
    }

    const results = await db
      .select()
      .from(clients)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(clients.createdAt)

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch clients' }
  }
}

/**
 * Update client status
 */
export async function updateClientStatus(
  id: string,
  status: 'prospect' | 'active' | 'inactive' | 'conflict'
): Promise<ActionResult<Client>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = updateClientStatusSchema.parse({ status })

    const [updated] = await db
      .update(clients)
      .set({ status: validated.status })
      .where(eq(clients.id, id))
      .returning()

    if (!updated) {
      return { success: false, error: 'Client not found' }
    }

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update client' }
  }
}

/**
 * Assign client to partner/manager
 */
export async function assignClient(
  id: string,
  assignedTo: string
): Promise<ActionResult<Client>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [updated] = await db
      .update(clients)
      .set({ assignedTo })
      .where(eq(clients.id, id))
      .returning()

    if (!updated) {
      return { success: false, error: 'Client not found' }
    }

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to assign client' }
  }
}

/**
 * Run conflict check for a client
 */
export async function runConflictCheck(
  input: z.infer<typeof conflictCheckSchema>
): Promise<
  ActionResult<
    ConflictCheck & { conflictedClients?: Client[] }
  >
> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = conflictCheckSchema.parse(input)

    // Search for conflicts in existing clients
    let conflictedClients: Client[] = []
    let status: 'clear' | 'conflict' | 'review' = 'review'

    if (validated.opposingParties.length > 0) {
      for (const party of validated.opposingParties) {
        const matches = await db
          .select()
          .from(clients)
          .where(like(clients.name, `%${party}%`))

        conflictedClients.push(...matches)
      }

      if (conflictedClients.length > 0 && !validated.override) {
        status = 'conflict'
      } else if (conflictedClients.length === 0 || validated.override) {
        status = 'clear'
      }
    } else {
      status = 'clear'
    }

    // Create conflict check record
    const newCheck = {
      id: nanoid(),
      clientId: validated.clientId,
      opposingParties: JSON.stringify(validated.opposingParties),
      status,
      checkedBy: userId,
      notes: validated.notes || null,
      clearedAt: status === 'clear' ? new Date() : null,
    }

    const [created] = await db.insert(conflictChecks).values(newCheck).returning()

    return {
      success: true,
      data: {
        ...created,
        opposingParties: validated.opposingParties,
        conflictedClients: conflictedClients.length > 0 ? conflictedClients : undefined,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to run conflict check' }
  }
}

/**
 * Approve or reject an intake submission
 */
export async function approveSubmission(
  submissionId: string,
  options: z.infer<typeof approveSubmissionSchema>
): Promise<
  ActionResult<{
    submission: any
    clientId?: string
    client?: Client
    tasks?: any[]
    emailSent?: boolean
  }>
> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = approveSubmissionSchema.parse(options)

    // Get submission
    const [submission] = await db
      .select()
      .from(intakeSubmissions)
      .where(eq(intakeSubmissions.id, submissionId))

    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    const submissionData = JSON.parse(submission.data)

    let clientId: string | undefined
    let client: Client | undefined
    let tasks: any[] | undefined
    let emailSent = false

    // If approving and should create client
    if (validated.approve && validated.createClient) {
      const result = await createClient({
        name: submissionData.fullName || submission.submitterName,
        type: submissionData.type || 'individual',
        email: submission.submitterEmail,
        phone: submissionData.phone,
        source: 'intake_form',
      })

      if (result.success) {
        clientId = result.data?.id
        client = result.data

        // Generate onboarding tasks if requested
        if (validated.generateTasks) {
          const defaultTasks = [
            {
              id: nanoid(),
              clientId: clientId!,
              title: 'Send engagement letter',
              priority: 'high' as const,
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
            },
            {
              id: nanoid(),
              clientId: clientId!,
              title: 'Schedule initial consultation',
              priority: 'high' as const,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
            {
              id: nanoid(),
              clientId: clientId!,
              title: 'Set up client portal access',
              priority: 'medium' as const,
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            },
          ]

          await db.insert(onboardingTasks).values(defaultTasks)
          tasks = defaultTasks
        }

        // Send welcome email if requested
        if (validated.sendWelcomeEmail) {
          await sendEmail({
            to: submission.submitterEmail,
            subject: 'Welcome to Our Firm',
            body: `Dear ${submissionData.fullName || submission.submitterName},

Thank you for choosing our firm. Your intake has been approved and we're excited to work with you.

We will be in touch shortly to schedule your initial consultation.

Best regards,
The Team`,
          })
          emailSent = true
        }
      }
    }

    // Update submission status
    const [updatedSubmission] = await db
      .update(intakeSubmissions)
      .set({
        status: validated.approve ? 'approved' : 'rejected',
        clientId: clientId || null,
        reviewedBy: userId,
        reviewNotes: validated.reviewNotes || null,
        reviewedAt: new Date(),
      })
      .where(eq(intakeSubmissions.id, submissionId))
      .returning()

    return {
      success: true,
      data: {
        submission: updatedSubmission,
        clientId,
        client,
        tasks,
        emailSent,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to process submission' }
  }
}
