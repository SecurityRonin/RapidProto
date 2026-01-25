/**
 * TDD: useAction Hook Tests
 * Write tests FIRST, then implement to pass them
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAction } from '@/hooks/use-action'
import type { ActionResponse } from '@/types/actions'

describe('useAction Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with idle state', () => {
      const action = vi.fn()
      const { result } = renderHook(() => useAction(action))

      expect(result.current.isPending).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('execute', () => {
    it('should set isPending true while executing', async () => {
      let resolveAction: (value: ActionResponse<string>) => void
      const action = vi.fn(
        () =>
          new Promise<ActionResponse<string>>((resolve) => {
            resolveAction = resolve
          })
      )

      const { result } = renderHook(() => useAction(action))

      // Start the action but don't resolve yet
      act(() => {
        result.current.execute()
      })

      expect(result.current.isPending).toBe(true)

      // Now resolve
      await act(async () => {
        resolveAction!({ success: true, data: 'done' })
      })

      expect(result.current.isPending).toBe(false)
    })

    it('should pass arguments to action', async () => {
      const action = vi.fn().mockResolvedValue({ success: true, data: 'ok' })

      const { result } = renderHook(() =>
        useAction<[string, number], string>(action)
      )

      await act(async () => {
        await result.current.execute('hello', 42)
      })

      expect(action).toHaveBeenCalledWith('hello', 42)
    })

    it('should return data on success', async () => {
      const action = vi.fn().mockResolvedValue({
        success: true,
        data: { id: 'test_123', name: 'Test' },
      })

      const { result } = renderHook(() =>
        useAction<[], { id: string; name: string }>(action)
      )

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.data).toEqual({ id: 'test_123', name: 'Test' })
      expect(result.current.error).toBeNull()
    })

    it('should set error on failure response', async () => {
      const action = vi.fn().mockResolvedValue({
        success: false,
        error: 'Something went wrong',
        code: 'INVALID_INPUT',
      })

      const { result } = renderHook(() => useAction(action))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.error).toBe('Something went wrong')
      expect(result.current.data).toBeUndefined()
    })

    it('should handle thrown exceptions', async () => {
      const action = vi.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAction(action))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.isPending).toBe(false)
    })

    it('should handle non-Error thrown values', async () => {
      const action = vi.fn().mockRejectedValue('string error')

      const { result } = renderHook(() => useAction(action))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.error).toBe('An unexpected error occurred')
    })
  })

  describe('reset', () => {
    it('should clear error and data', async () => {
      const action = vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed',
      })

      const { result } = renderHook(() => useAction(action))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.error).toBe('Failed')

      act(() => {
        result.current.reset()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('callbacks', () => {
    it('should call onSuccess callback with data', async () => {
      const action = vi.fn().mockResolvedValue({
        success: true,
        data: { value: 123 },
      })
      const onSuccess = vi.fn()

      const { result } = renderHook(() =>
        useAction(action, { onSuccess })
      )

      await act(async () => {
        await result.current.execute()
      })

      expect(onSuccess).toHaveBeenCalledWith({ value: 123 })
    })

    it('should call onError callback with error message', async () => {
      const action = vi.fn().mockResolvedValue({
        success: false,
        error: 'Validation failed',
      })
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useAction(action, { onError })
      )

      await act(async () => {
        await result.current.execute()
      })

      expect(onError).toHaveBeenCalledWith('Validation failed')
    })

    it('should call onError for thrown exceptions', async () => {
      const action = vi.fn().mockRejectedValue(new Error('Crash'))
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useAction(action, { onError })
      )

      await act(async () => {
        await result.current.execute()
      })

      expect(onError).toHaveBeenCalledWith('Crash')
    })
  })

  describe('return value from execute', () => {
    it('should return the response from execute', async () => {
      const action = vi.fn().mockResolvedValue({
        success: true,
        data: 'result',
      })

      const { result } = renderHook(() => useAction(action))

      let response: ActionResponse<string> | undefined
      await act(async () => {
        response = await result.current.execute()
      })

      expect(response).toEqual({ success: true, data: 'result' })
    })

    it('should return error response without throwing', async () => {
      const action = vi.fn().mockResolvedValue({
        success: false,
        error: 'Bad input',
      })

      const { result } = renderHook(() => useAction(action))

      let response: ActionResponse<unknown> | undefined
      await act(async () => {
        response = await result.current.execute()
      })

      expect(response).toEqual({ success: false, error: 'Bad input' })
    })
  })
})
