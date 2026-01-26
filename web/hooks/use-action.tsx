'use client'

import { useState, useCallback } from 'react'
import type { ActionResponse } from '@/types/actions'

interface UseActionOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

interface UseActionReturn<TArgs extends unknown[], TData> {
  execute: (...args: TArgs) => Promise<ActionResponse<TData>>
  isPending: boolean
  error: string | null
  data: TData | undefined
  reset: () => void
}

/**
 * Hook for executing server actions with loading, error, and success state tracking.
 *
 * @example
 * const { execute, isPending, error, data } = useAction(saveClientInfo, {
 *   onSuccess: (data) => toast.success('Saved!'),
 *   onError: (error) => toast.error(error),
 * })
 *
 * <Button onClick={() => execute(sessionId, formData)} disabled={isPending}>
 *   {isPending ? 'Saving...' : 'Save'}
 * </Button>
 */
export function useAction<TArgs extends unknown[] = [], TData = unknown>(
  action: (...args: TArgs) => Promise<ActionResponse<TData>>,
  options: UseActionOptions<TData> = {}
): UseActionReturn<TArgs, TData> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TData | undefined>(undefined)

  const { onSuccess, onError } = options

  const execute = useCallback(
    async (...args: TArgs): Promise<ActionResponse<TData>> => {
      setIsPending(true)
      setError(null)

      try {
        const response = await action(...args)

        if (response.success) {
          setData(response.data)
          onSuccess?.(response.data)
        } else {
          setError(response.error)
          onError?.(response.error)
        }

        return response
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
        onError?.(errorMessage)

        return { success: false, error: errorMessage }
      } finally {
        setIsPending(false)
      }
    },
    [action, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setError(null)
    setData(undefined)
  }, [])

  return {
    execute,
    isPending,
    error,
    data,
    reset,
  }
}
