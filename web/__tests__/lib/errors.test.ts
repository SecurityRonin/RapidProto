/**
 * TDD: Error Handling Utilities
 * Tests for lib/utils/errors.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import {
  logError,
  handleActionError,
  StorageError,
  SessionError,
  isStorageError,
  isSessionError,
  getErrorMessage,
  type ErrorContext,
  type ActionError,
  type ErrorCode,
} from '@/lib/utils/errors'

describe('Error Handling Utilities', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('logError', () => {
    it('logs error with action context', () => {
      const context: ErrorContext = { action: 'testAction' }
      const error = new Error('Test error')

      logError(context, error)

      expect(consoleSpy).toHaveBeenCalledOnce()
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1])
      expect(loggedData.action).toBe('testAction')
      expect(loggedData.error.message).toBe('Test error')
    })

    it('logs error with sessionId when provided', () => {
      const context: ErrorContext = { action: 'testAction', sessionId: 'ABC123' }
      const error = new Error('Test error')

      logError(context, error)

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1])
      expect(loggedData.sessionId).toBe('ABC123')
    })

    it('logs error with userId when provided', () => {
      const context: ErrorContext = { action: 'testAction', userId: 'user-123' }
      const error = new Error('Test error')

      logError(context, error)

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1])
      expect(loggedData.userId).toBe('user-123')
    })

    it('includes timestamp in ISO format', () => {
      const context: ErrorContext = { action: 'testAction' }
      const error = new Error('Test error')

      logError(context, error)

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1])
      expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('includes stack trace for Error objects', () => {
      const context: ErrorContext = { action: 'testAction' }
      const error = new Error('Test error')

      logError(context, error)

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1])
      expect(loggedData.error.stack).toBeDefined()
      expect(loggedData.error.stack).toContain('Error: Test error')
    })

    it('handles string errors', () => {
      const context: ErrorContext = { action: 'testAction' }

      logError(context, 'String error message')

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1])
      expect(loggedData.error).toBe('String error message')
    })

    it('handles non-Error objects', () => {
      const context: ErrorContext = { action: 'testAction' }

      logError(context, { custom: 'error' })

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1])
      expect(loggedData.error).toBe('[object Object]')
    })
  })

  describe('handleActionError', () => {
    it('returns standardized error response', () => {
      const context: ErrorContext = { action: 'createSession' }
      const error = new Error('Database connection failed')

      const result = handleActionError(context, error)

      expect(result).toEqual({
        success: false,
        error: 'createSession failed',
        code: 'INTERNAL_ERROR'
      })
    })

    it('handles Zod validation errors specially', () => {
      const context: ErrorContext = { action: 'createSession' }
      const schema = z.object({ name: z.string().min(1, 'Name is required') })

      let zodError: z.ZodError | null = null
      try {
        schema.parse({ name: '' })
      } catch (e) {
        zodError = e as z.ZodError
      }

      const result = handleActionError(context, zodError)

      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.error).toBe('Name is required')
    })

    it('logs the error before returning', () => {
      const context: ErrorContext = { action: 'testAction' }
      const error = new Error('Test error')

      handleActionError(context, error)

      expect(consoleSpy).toHaveBeenCalledOnce()
    })

    it('always returns success: false', () => {
      const context: ErrorContext = { action: 'testAction' }

      const result1 = handleActionError(context, new Error('error'))
      const result2 = handleActionError(context, 'string error')

      expect(result1.success).toBe(false)
      expect(result2.success).toBe(false)
    })

    it('returns INTERNAL_ERROR code for non-Zod errors', () => {
      const context: ErrorContext = { action: 'testAction' }

      const result = handleActionError(context, new TypeError('type error'))

      expect(result.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('Type safety', () => {
    it('ActionError has required fields', () => {
      const error: ActionError = {
        success: false,
        error: 'test',
        code: 'VALIDATION_ERROR'
      }

      expect(error.success).toBe(false)
      expect(typeof error.error).toBe('string')
      expect(['VALIDATION_ERROR', 'INTERNAL_ERROR', 'UNAUTHORIZED', 'NOT_FOUND', 'CONFLICT']).toContain(error.code)
    })

    it('ErrorContext requires action field', () => {
      const context: ErrorContext = { action: 'required' }
      expect(context.action).toBeDefined()
    })
  })

  // ==========================================================================
  // Phase 2: Extended Error Handling Tests
  // ==========================================================================

  describe('StorageError', () => {
    it('creates error with code, message, and key', () => {
      const error = new StorageError('STORAGE_QUOTA_EXCEEDED', 'Storage full', 'rapidproto_sessions')

      expect(error.code).toBe('STORAGE_QUOTA_EXCEEDED')
      expect(error.message).toBe('Storage full')
      expect(error.key).toBe('rapidproto_sessions')
      expect(error.name).toBe('StorageError')
    })

    it('creates error with cause for chaining', () => {
      const originalError = new Error('Original error')
      const error = new StorageError('INTERNAL_ERROR', 'Wrapped error', undefined, originalError)

      expect(error.cause).toBe(originalError)
    })

    it('fromError detects QuotaExceededError', () => {
      const domException = new DOMException('Quota exceeded', 'QuotaExceededError')
      const error = StorageError.fromError(domException, 'test_key')

      expect(error.code).toBe('STORAGE_QUOTA_EXCEEDED')
      expect(error.key).toBe('test_key')
      expect(error.cause).toBe(domException)
    })

    it('fromError detects SecurityError', () => {
      const domException = new DOMException('Access denied', 'SecurityError')
      const error = StorageError.fromError(domException, 'test_key')

      expect(error.code).toBe('STORAGE_UNAVAILABLE')
    })

    it('fromError returns existing StorageError unchanged', () => {
      const original = new StorageError('SESSION_CORRUPTED', 'Data corrupted')
      const result = StorageError.fromError(original)

      expect(result).toBe(original)
    })

    it('fromError wraps generic errors', () => {
      const genericError = new Error('Something went wrong')
      const error = StorageError.fromError(genericError)

      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.message).toBe('Something went wrong')
    })

    it('toActionError converts to standard format', () => {
      const error = new StorageError('STORAGE_QUOTA_EXCEEDED', 'Storage full')
      const actionError = error.toActionError()

      expect(actionError).toEqual({
        success: false,
        error: 'Storage full',
        code: 'STORAGE_QUOTA_EXCEEDED',
      })
    })
  })

  describe('SessionError', () => {
    it('creates error with code, message, and sessionId', () => {
      const error = new SessionError('SESSION_NOT_FOUND', 'Session not found', 'session_123')

      expect(error.code).toBe('SESSION_NOT_FOUND')
      expect(error.message).toBe('Session not found')
      expect(error.sessionId).toBe('session_123')
      expect(error.name).toBe('SessionError')
    })

    it('creates error with cause for chaining', () => {
      const originalError = new Error('Original')
      const error = new SessionError('SESSION_CORRUPTED', 'Data corrupt', undefined, originalError)

      expect(error.cause).toBe(originalError)
    })

    it('toActionError converts to standard format', () => {
      const error = new SessionError('SESSION_INVALID_STATE', 'Cannot pause inactive session')
      const actionError = error.toActionError()

      expect(actionError).toEqual({
        success: false,
        error: 'Cannot pause inactive session',
        code: 'SESSION_INVALID_STATE',
      })
    })
  })

  describe('handleActionError with custom errors', () => {
    it('handles StorageError correctly', () => {
      const context: ErrorContext = { action: 'saveSession' }
      const error = new StorageError('STORAGE_QUOTA_EXCEEDED', 'Storage full')

      const result = handleActionError(context, error)

      expect(result.code).toBe('STORAGE_QUOTA_EXCEEDED')
      expect(result.error).toBe('Storage full')
    })

    it('handles SessionError correctly', () => {
      const context: ErrorContext = { action: 'getSession' }
      const error = new SessionError('SESSION_NOT_FOUND', 'Session not found')

      const result = handleActionError(context, error)

      expect(result.code).toBe('SESSION_NOT_FOUND')
      expect(result.error).toBe('Session not found')
    })
  })

  describe('Type guards', () => {
    it('isStorageError returns true for StorageError', () => {
      const error = new StorageError('INTERNAL_ERROR', 'test')
      expect(isStorageError(error)).toBe(true)
    })

    it('isStorageError returns false for other errors', () => {
      expect(isStorageError(new Error('test'))).toBe(false)
      expect(isStorageError(new SessionError('SESSION_NOT_FOUND', 'test'))).toBe(false)
      expect(isStorageError('string')).toBe(false)
      expect(isStorageError(null)).toBe(false)
    })

    it('isSessionError returns true for SessionError', () => {
      const error = new SessionError('SESSION_NOT_FOUND', 'test')
      expect(isSessionError(error)).toBe(true)
    })

    it('isSessionError returns false for other errors', () => {
      expect(isSessionError(new Error('test'))).toBe(false)
      expect(isSessionError(new StorageError('INTERNAL_ERROR', 'test'))).toBe(false)
      expect(isSessionError('string')).toBe(false)
      expect(isSessionError(null)).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('returns correct message for VALIDATION_ERROR', () => {
      expect(getErrorMessage('VALIDATION_ERROR')).toBe('The provided data is invalid.')
    })

    it('returns correct message for STORAGE_QUOTA_EXCEEDED', () => {
      expect(getErrorMessage('STORAGE_QUOTA_EXCEEDED')).toBe('Storage is full. Please clear some session data.')
    })

    it('returns correct message for SESSION_CORRUPTED', () => {
      expect(getErrorMessage('SESSION_CORRUPTED')).toBe('Session data is corrupted. Starting fresh.')
    })

    it('returns correct message for all new error codes', () => {
      expect(getErrorMessage('STORAGE_UNAVAILABLE')).toBe('Storage is not available. Check browser settings.')
      expect(getErrorMessage('SYNC_CONFLICT')).toBe('Data conflict detected. Please refresh.')
      expect(getErrorMessage('SESSION_NOT_FOUND')).toBe('Session not found.')
      expect(getErrorMessage('SESSION_INVALID_STATE')).toBe('Session is in an invalid state for this operation.')
      expect(getErrorMessage('STEP_NOT_FOUND')).toBe('Step not found in session.')
    })

    it('returns fallback message for unknown codes', () => {
      // @ts-expect-error - testing unknown code
      expect(getErrorMessage('UNKNOWN_CODE')).toBe('An error occurred.')
    })
  })

  describe('Extended ErrorCode type', () => {
    it('includes all new storage error codes', () => {
      const storageCodes: ErrorCode[] = [
        'STORAGE_QUOTA_EXCEEDED',
        'STORAGE_UNAVAILABLE',
        'SESSION_CORRUPTED',
        'SYNC_CONFLICT',
      ]

      storageCodes.forEach(code => {
        const error = new StorageError(code, 'test')
        expect(error.code).toBe(code)
      })
    })

    it('includes all new session error codes', () => {
      const sessionCodes: ErrorCode[] = [
        'SESSION_NOT_FOUND',
        'SESSION_INVALID_STATE',
        'STEP_NOT_FOUND',
      ]

      sessionCodes.forEach(code => {
        const error = new SessionError(code, 'test')
        expect(error.code).toBe(code)
      })
    })
  })

  describe('Error cause chaining in logs', () => {
    it('logs cause information for chained errors', () => {
      const originalError = new Error('Root cause')
      const wrappedError = new StorageError('INTERNAL_ERROR', 'Wrapped', undefined, originalError)
      // Manually set cause for test (in real code, constructor handles this)
      Object.defineProperty(wrappedError, 'cause', { value: originalError })

      const context: ErrorContext = { action: 'testAction' }
      logError(context, wrappedError)

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1])
      expect(loggedData.error.cause).toBeDefined()
      expect(loggedData.error.cause.message).toBe('Root cause')
    })
  })
})
