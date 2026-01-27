/**
 * TDD: Error Handling Utilities
 * Tests for lib/utils/errors.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { logError, handleActionError, type ErrorContext, type ActionError } from '@/lib/utils/errors'

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
})
