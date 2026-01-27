/**
 * TDD: Audio Notifications Hook Tests
 * Tests for the audio warning system during sessions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioNotifications } from '@/hooks/use-audio-notifications'

// Mock Audio API
const mockPlay = vi.fn().mockResolvedValue(undefined)
const mockAudio = vi.fn(() => ({
  play: mockPlay,
  pause: vi.fn(),
  volume: 1,
}))

Object.defineProperty(global, 'Audio', {
  value: mockAudio,
  writable: true,
})

describe('useAudioNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should be disabled by default', () => {
      const { result } = renderHook(() => useAudioNotifications())

      expect(result.current.enabled).toBe(false)
    })

    it('should allow enabling audio notifications', () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.enable()
      })

      expect(result.current.enabled).toBe(true)
    })

    it('should allow disabling audio notifications', () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.enable()
        result.current.disable()
      })

      expect(result.current.enabled).toBe(false)
    })

    it('should toggle audio notifications', () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.toggle()
      })
      expect(result.current.enabled).toBe(true)

      act(() => {
        result.current.toggle()
      })
      expect(result.current.enabled).toBe(false)
    })
  })

  describe('Warning Sounds', () => {
    it('should play one-minute warning sound', async () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.enable()
      })

      await act(async () => {
        await result.current.playWarning('one-minute')
      })

      expect(mockAudio).toHaveBeenCalled()
      expect(mockPlay).toHaveBeenCalled()
    })

    it('should play ten-seconds warning sound', async () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.enable()
      })

      await act(async () => {
        await result.current.playWarning('ten-seconds')
      })

      expect(mockPlay).toHaveBeenCalled()
    })

    it('should play phase-complete sound', async () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.enable()
      })

      await act(async () => {
        await result.current.playWarning('phase-complete')
      })

      expect(mockPlay).toHaveBeenCalled()
    })

    it('should not play sound when disabled', async () => {
      const { result } = renderHook(() => useAudioNotifications())

      await act(async () => {
        await result.current.playWarning('one-minute')
      })

      expect(mockPlay).not.toHaveBeenCalled()
    })

    it('should handle audio play failure gracefully', async () => {
      mockPlay.mockRejectedValueOnce(new Error('Audio playback failed'))

      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.enable()
      })

      // Should not throw
      await act(async () => {
        await result.current.playWarning('one-minute')
      })

      // Hook should still be enabled
      expect(result.current.enabled).toBe(true)
    })
  })

  describe('Volume Control', () => {
    it('should have default volume of 0.5', () => {
      const { result } = renderHook(() => useAudioNotifications())

      expect(result.current.volume).toBe(0.5)
    })

    it('should allow setting volume', () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.setVolume(0.8)
      })

      expect(result.current.volume).toBe(0.8)
    })

    it('should clamp volume between 0 and 1', () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.setVolume(1.5)
      })
      expect(result.current.volume).toBe(1)

      act(() => {
        result.current.setVolume(-0.5)
      })
      expect(result.current.volume).toBe(0)
    })
  })

  describe('Persistence', () => {
    it('should persist enabled state to localStorage', () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.enable()
      })

      expect(localStorage.getItem('rapidproto_audio_enabled')).toBe('true')
    })

    it('should persist volume to localStorage', () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.setVolume(0.7)
      })

      expect(localStorage.getItem('rapidproto_audio_volume')).toBe('0.7')
    })

    it('should restore state from localStorage on mount', () => {
      localStorage.setItem('rapidproto_audio_enabled', 'true')
      localStorage.setItem('rapidproto_audio_volume', '0.9')

      const { result } = renderHook(() => useAudioNotifications())

      expect(result.current.enabled).toBe(true)
      expect(result.current.volume).toBe(0.9)
    })
  })

  describe('Sound Types', () => {
    it('should use different sounds for different warnings', async () => {
      const { result } = renderHook(() => useAudioNotifications())

      act(() => {
        result.current.enable()
      })

      const calls: string[] = []
      mockAudio.mockImplementation((src: string) => {
        calls.push(src)
        return { play: mockPlay, pause: vi.fn(), volume: 1 }
      })

      await act(async () => {
        await result.current.playWarning('one-minute')
        await result.current.playWarning('ten-seconds')
        await result.current.playWarning('phase-complete')
      })

      // Should use different sound files
      expect(calls.length).toBe(3)
      expect(new Set(calls).size).toBeGreaterThanOrEqual(2) // At least 2 different sounds
    })
  })
})
