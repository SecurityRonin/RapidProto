/**
 * Safe Timer Hooks
 * Automatically cleanup timers on unmount to prevent memory leaks (Phase 6)
 */

import { useCallback, useRef, useEffect } from 'react'

// =============================================================================
// useSafeTimeout
// =============================================================================

/**
 * Returns a setTimeout wrapper that automatically clears on unmount.
 * Use when you need to call setTimeout dynamically during component lifecycle.
 *
 * @example
 * const setTimeout = useSafeTimeout()
 * setTimeout(() => setSaveSuccess(false), 3000)
 */
export function useSafeTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        callback()
      }
      timeoutRef.current = null
    }, delay)

    // Return a function to cancel this specific timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return safeSetTimeout
}

// =============================================================================
// useSafeInterval
// =============================================================================

/**
 * Returns a setInterval wrapper that automatically clears on unmount.
 *
 * @example
 * const [setInterval, clearInterval] = useSafeInterval()
 * setInterval(() => tick(), 1000)
 * // Later: clearInterval()
 */
export function useSafeInterval() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        callback()
      }
    }, delay)
  }, [])

  const safeClearInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return [safeSetInterval, safeClearInterval] as const
}

// =============================================================================
// useDebouncedCallback
// =============================================================================

/**
 * Returns a debounced version of a callback function.
 * Automatically clears pending debounce on unmount.
 *
 * @example
 * const debouncedSave = useDebouncedCallback((value: string) => {
 *   save(value)
 * }, 1500)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const callbackRef = useRef(callback)

  // Keep callback ref updated
  callbackRef.current = callback

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        callbackRef.current(...args)
      }
    }, delay)
  }, [delay]) as T

  return debouncedFn
}

// =============================================================================
// useTimeoutMap
// =============================================================================

/**
 * Manages multiple named timeouts with automatic cleanup.
 * Useful for per-item debouncing (e.g., saving multiple form fields).
 *
 * @example
 * const timeouts = useTimeoutMap()
 * timeouts.set('field1', () => save('field1'), 1500)
 * timeouts.set('field2', () => save('field2'), 1500)
 * timeouts.clear('field1') // Cancel specific
 * timeouts.clearAll() // Cancel all
 */
export function useTimeoutMap() {
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Clear all timeouts on unmount
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current.clear()
    }
  }, [])

  const set = useCallback((key: string, callback: () => void, delay: number) => {
    // Clear existing timeout for this key
    const existing = timeoutsRef.current.get(key)
    if (existing) {
      clearTimeout(existing)
    }

    const timeout = setTimeout(() => {
      timeoutsRef.current.delete(key)
      if (isMountedRef.current) {
        callback()
      }
    }, delay)

    timeoutsRef.current.set(key, timeout)
  }, [])

  const clear = useCallback((key: string) => {
    const timeout = timeoutsRef.current.get(key)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(key)
    }
  }, [])

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current.clear()
  }, [])

  const has = useCallback((key: string) => timeoutsRef.current.has(key), [])

  return { set, clear, clearAll, has }
}
