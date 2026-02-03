/**
 * TDD: Safe Timer Hooks Tests
 * Tests for hooks/use-safe-timers.ts (Phase 6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useSafeTimeout,
  useSafeInterval,
  useDebouncedCallback,
  useTimeoutMap,
} from '@/hooks/use-safe-timers'

// =============================================================================
// useSafeTimeout Tests
// =============================================================================

describe('useSafeTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes callback after delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useSafeTimeout())

    act(() => {
      result.current(callback, 1000)
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(callback).toHaveBeenCalledOnce()
  })

  it('clears timeout on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useSafeTimeout())

    act(() => {
      result.current(callback, 1000)
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('cancels previous timeout when called again', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result } = renderHook(() => useSafeTimeout())

    act(() => {
      result.current(callback1, 1000)
    })

    act(() => {
      vi.advanceTimersByTime(500)
      result.current(callback2, 1000)
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledOnce()
  })

  it('returns cancel function', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useSafeTimeout())

    let cancel: () => void
    act(() => {
      cancel = result.current(callback, 1000)
    })

    act(() => {
      cancel()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(callback).not.toHaveBeenCalled()
  })
})

// =============================================================================
// useSafeInterval Tests
// =============================================================================

describe('useSafeInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes callback repeatedly at interval', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useSafeInterval())
    const [setInterval] = result.current

    act(() => {
      setInterval(callback, 500)
    })

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('clears interval on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useSafeInterval())
    const [setInterval] = result.current

    act(() => {
      setInterval(callback, 500)
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('clearInterval stops execution', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useSafeInterval())
    const [setInterval, clearInterval] = result.current

    act(() => {
      setInterval(callback, 500)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      clearInterval()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('replacing interval cancels previous', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result } = renderHook(() => useSafeInterval())
    const [setInterval] = result.current

    act(() => {
      setInterval(callback1, 500)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback1).toHaveBeenCalledTimes(1)

    act(() => {
      setInterval(callback2, 500)
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // callback1 should not have been called again
    expect(callback1).toHaveBeenCalledTimes(1)
    // callback2 should have been called twice
    expect(callback2).toHaveBeenCalledTimes(2)
  })
})

// =============================================================================
// useDebouncedCallback Tests
// =============================================================================

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces callback', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('arg1')
      result.current('arg2')
      result.current('arg3')
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith('arg3')
  })

  it('clears debounce on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('value')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('respects delay parameter', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 1000))

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback).toHaveBeenCalledOnce()
  })

  it('resets timer on subsequent calls', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    act(() => {
      result.current() // Reset timer
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(callback).toHaveBeenCalledOnce()
  })
})

// =============================================================================
// useTimeoutMap Tests
// =============================================================================

describe('useTimeoutMap', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('manages multiple named timeouts', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result } = renderHook(() => useTimeoutMap())

    act(() => {
      result.current.set('key1', callback1, 500)
      result.current.set('key2', callback2, 1000)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback1).toHaveBeenCalledOnce()
    expect(callback2).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback2).toHaveBeenCalledOnce()
  })

  it('clears specific timeout', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result } = renderHook(() => useTimeoutMap())

    act(() => {
      result.current.set('key1', callback1, 500)
      result.current.set('key2', callback2, 500)
    })

    act(() => {
      result.current.clear('key1')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledOnce()
  })

  it('clearAll clears all timeouts', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result } = renderHook(() => useTimeoutMap())

    act(() => {
      result.current.set('key1', callback1, 500)
      result.current.set('key2', callback2, 500)
    })

    act(() => {
      result.current.clearAll()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()
  })

  it('replaces timeout for same key', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result } = renderHook(() => useTimeoutMap())

    act(() => {
      result.current.set('key1', callback1, 500)
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    act(() => {
      result.current.set('key1', callback2, 500)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledOnce()
  })

  it('has checks if timeout exists', () => {
    const { result } = renderHook(() => useTimeoutMap())

    expect(result.current.has('key1')).toBe(false)

    act(() => {
      result.current.set('key1', () => {}, 500)
    })

    expect(result.current.has('key1')).toBe(true)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.has('key1')).toBe(false)
  })

  it('clears all on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useTimeoutMap())

    act(() => {
      result.current.set('key1', callback, 500)
      result.current.set('key2', callback, 500)
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(callback).not.toHaveBeenCalled()
  })
})
