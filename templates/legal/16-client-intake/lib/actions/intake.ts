'use server'

import { z } from 'zod'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import { intakeSubmissions } from '@/lib/db/schema'

/**
 * Public intake form submission (no auth required)
 */

const submitIntakeSchema = z.object({
  formId: z.string(),
  submitterName: z.string().min(1),
  submitterEmail: z.string().email(),
  data: z.object({
    fullName: z.string(),
    phone: z.string().optional(),
    company: z.string().optional(),
    message: z.string(),
    documents: z.array(z.string()).optional(),
  }),
})

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function submitIntakeForm(
  input: z.infer<typeof submitIntakeSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = submitIntakeSchema.parse(input)

    const newSubmission = {
      id: nanoid(),
      formId: validated.formId,
      submitterEmail: validated.submitterEmail,
      submitterName: validated.submitterName,
      data: JSON.stringify(validated.data),
      status: 'pending' as const,
      submittedAt: new Date(),
    }

    const [created] = await db
      .insert(intakeSubmissions)
      .values(newSubmission)
      .returning()

    return {
      success: true,
      data: { id: created.id },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to submit intake form' }
  }
}
