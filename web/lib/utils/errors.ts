/**
 * Error Handling Infrastructure
 * Standardized error logging and response generation for server actions
 * Extended with storage-specific error handling for Phase 2
 */

import { z } from 'zod'

export interface ErrorContext {
  action: string
  sessionId?: string
  userId?: string
  key?: string // For storage operations
}

// Extended error codes including storage-specific ones
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  // Storage-specific error codes (Phase 2)
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'STORAGE_UNAVAILABLE'
  | 'SESSION_CORRUPTED'
  | 'SYNC_CONFLICT'
  // Session-specific error codes
  | 'SESSION_NOT_FOUND'
  | 'SESSION_INVALID_STATE'
  | 'STEP_NOT_FOUND'

export interface ActionError {
  success: false
  error: string
  code: ErrorCode
}

/**
 * StorageError class for storage-specific errors with cause chaining
 * @example
 * throw new StorageError('STORAGE_QUOTA_EXCEEDED', 'Failed to save session', 'rapidproto_sessions', quotaError)
 */
export class StorageError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly key?: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'StorageError'
    // Maintain proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageError)
    }
  }

  /**
   * Create a StorageError from a caught exception
   */
  static fromError(error: unknown, key?: string): StorageError {
    if (error instanceof StorageError) {
      return error
    }

    // Detect quota exceeded errors
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        return new StorageError(
          'STORAGE_QUOTA_EXCEEDED',
          'Storage quota exceeded. Please clear some session data.',
          key,
          error
        )
      }
      if (error.name === 'SecurityError') {
        return new StorageError(
          'STORAGE_UNAVAILABLE',
          'Storage access denied. Check browser settings.',
          key,
          error
        )
      }
    }

    // Generic storage error
    return new StorageError(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown storage error',
      key,
      error
    )
  }

  /**
   * Convert to ActionError format for API responses
   */
  toActionError(): ActionError {
    return {
      success: false,
      error: this.message,
      code: this.code,
    }
  }
}

/**
 * SessionError class for session-specific errors
 */
export class SessionError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly sessionId?: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'SessionError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SessionError)
    }
  }

  toActionError(): ActionError {
    return {
      success: false,
      error: this.message,
      code: this.code,
    }
  }
}

/**
 * Log an error with structured context for debugging
 */
export function logError(context: ErrorContext, error: unknown): void {
  const errorInfo = error instanceof Error
    ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        // Include cause if present (for chained errors)
        cause: error.cause instanceof Error
          ? { message: error.cause.message, name: error.cause.name }
          : error.cause,
      }
    : String(error)

  console.error('[ActionError]', JSON.stringify({
    timestamp: new Date().toISOString(),
    ...context,
    error: errorInfo,
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

  // Handle custom error classes first
  if (error instanceof StorageError || error instanceof SessionError) {
    return error.toActionError()
  }

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

/**
 * Type guard to check if an error is a StorageError
 */
export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError
}

/**
 * Type guard to check if an error is a SessionError
 */
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError
}

/**
 * Create a user-friendly error message from an error code
 */
export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    VALIDATION_ERROR: 'The provided data is invalid.',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    CONFLICT: 'A conflict occurred. Please refresh and try again.',
    STORAGE_QUOTA_EXCEEDED: 'Storage is full. Please clear some session data.',
    STORAGE_UNAVAILABLE: 'Storage is not available. Check browser settings.',
    SESSION_CORRUPTED: 'Session data is corrupted. Starting fresh.',
    SYNC_CONFLICT: 'Data conflict detected. Please refresh.',
    SESSION_NOT_FOUND: 'Session not found.',
    SESSION_INVALID_STATE: 'Session is in an invalid state for this operation.',
    STEP_NOT_FOUND: 'Step not found in session.',
  }
  return messages[code] || 'An error occurred.'
}
