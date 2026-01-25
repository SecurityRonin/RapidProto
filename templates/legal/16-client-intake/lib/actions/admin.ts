'use server'

import { auth } from '@clerk/nextjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { intakeSubmissions, type IntakeSubmission } from '@/lib/db/schema'

/**
 * Admin-only actions for managing intake submissions
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getPendingSubmissions(): Promise<
  ActionResult<IntakeSubmission[]>
> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const submissions = await db
      .select()
      .from(intakeSubmissions)
      .where(eq(intakeSubmissions.status, 'pending'))
      .orderBy(intakeSubmissions.submittedAt)

    return { success: true, data: submissions }
  } catch (error) {
    return { success: false, error: 'Failed to fetch submissions' }
  }
}
