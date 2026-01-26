/**
 * TDD: Action Types Tests
 * Verify types compile correctly and type guards work
 */

import { describe, it, expect } from 'vitest'
import {
  ActionResponse,
  isSuccessResponse,
  isErrorResponse,
  type SessionStatusData,
  type ClientInfoParsed,
  type TimeRemaining,
} from '@/types/actions'

describe('Action Types', () => {
  describe('ActionResponse type guards', () => {
    it('isSuccessResponse should return true for success response', () => {
      const response: ActionResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
      }

      expect(isSuccessResponse(response)).toBe(true)
      expect(isErrorResponse(response)).toBe(false)
    })

    it('isErrorResponse should return true for error response', () => {
      const response: ActionResponse<{ id: string }> = {
        success: false,
        error: 'Something went wrong',
        code: 'INTERNAL_ERROR',
      }

      expect(isErrorResponse(response)).toBe(true)
      expect(isSuccessResponse(response)).toBe(false)
    })

    it('should enable type narrowing', () => {
      const response: ActionResponse<{ value: number }> = {
        success: true,
        data: { value: 42 },
      }

      if (isSuccessResponse(response)) {
        // TypeScript should know response.data exists here
        expect(response.data.value).toBe(42)
      }
    })

    it('should narrow to error type', () => {
      const response: ActionResponse<{ value: number }> = {
        success: false,
        error: 'Failed',
        code: 'NOT_FOUND',
      }

      if (isErrorResponse(response)) {
        // TypeScript should know response.error exists here
        expect(response.error).toBe('Failed')
        expect(response.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('Type structure validation', () => {
    it('ClientInfoParsed should have array fields', () => {
      const clientInfo: ClientInfoParsed = {
        id: 'client_1',
        sessionId: 'session_1',
        clientName: 'Acme Corp',
        clientEmail: 'test@acme.com',
        clientPhone: null,
        businessType: 'Tech',
        companySize: '50-100',
        problemStatement: 'Need better tracking',
        currentSolution: null,
        whyNow: null,
        threeWins: ['Win 1', 'Win 2', 'Win 3'],
        painPoints: ['Pain 1', 'Pain 2'],
        mustHaveFeatures: ['Feature 1'],
        niceToHaveFeatures: [],
        budget: '$10,000',
        timeline: '2 weeks',
        decisionMakers: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Verify array fields are arrays (not strings)
      expect(Array.isArray(clientInfo.threeWins)).toBe(true)
      expect(Array.isArray(clientInfo.painPoints)).toBe(true)
      expect(Array.isArray(clientInfo.mustHaveFeatures)).toBe(true)
      expect(Array.isArray(clientInfo.niceToHaveFeatures)).toBe(true)
    })

    it('TimeRemaining should have required fields', () => {
      const timeRemaining: TimeRemaining = {
        phase: 'discovery',
        totalMinutes: 10,
        elapsedMinutes: 5,
        remainingMinutes: 5,
        isOvertime: false,
        overtimeMinutes: 0,
      }

      expect(timeRemaining.phase).toBe('discovery')
      expect(timeRemaining.remainingMinutes).toBe(5)
    })
  })
})
