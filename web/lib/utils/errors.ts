/**
 * Error Handling Infrastructure
 * Standardized error logging and response generation for server actions
 */

import { z } from 'zod'

export interface ErrorContext {
  action: string
  sessionId?: string
  userId?: string
}

export type ErrorCode = 'VALIDATION_ERROR' | 'INTERNAL_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT'

export interface ActionError {
  success: false
  error: string
  code: ErrorCode
}

/**
 * Log an error with structured context for debugging
 */
export function logError(context: ErrorContext, error: unknown): void {
  console.error('[ActionError]', JSON.stringify({
    timestamp: new Date().toISOString(),
    ...context,
    error: error instanceof Error
      ? { message: error.message, stack: error.stack }
      : String(error),
  }, null, 2))
}

/**
 * Handle an action error with consistent logging and response format
 * @param context - Action context for logging
 * @param error - The caught error
 * @returns Standardized error response
 */
export function handleActionError(context: ErrorContext, error: unknown): ActionError {
  logError(context, error)

  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors[0].message,
      code: 'VALIDATION_ERROR'
    }
  }

  return {
    success: false,
    error: `${context.action} failed`,
    code: 'INTERNAL_ERROR'
  }
}
