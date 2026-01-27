/**
 * Audio Notifications Hook
 * Provides audio warnings for session time thresholds
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import type { TimeWarningType } from '@/components/session/session-timer'

const STORAGE_KEYS = {
  enabled: 'rapidproto_audio_enabled',
  volume: 'rapidproto_audio_volume',
} as const

// Sound file paths (using simple beeps - could be replaced with custom sounds)
const SOUND_FILES: Record<TimeWarningType, string> = {
  'one-minute': '/sounds/warning-gentle.mp3',
  'ten-seconds': '/sounds/warning-urgent.mp3',
  'phase-complete': '/sounds/phase-complete.mp3',
}

interface UseAudioNotificationsReturn {
  enabled: boolean
  volume: number
  enable: () => void
  disable: () => void
  toggle: () => void
  setVolume: (volume: number) => void
  playWarning: (type: TimeWarningType) => Promise<void>
}

export function useAudioNotifications(): UseAudioNotificationsReturn {
  const [enabled, setEnabled] = useState(false)
  const [volume, setVolumeState] = useState(0.5)

  // Load persisted state on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem(STORAGE_KEYS.enabled)
    const savedVolume = localStorage.getItem(STORAGE_KEYS.volume)

    if (savedEnabled !== null) {
      setEnabled(savedEnabled === 'true')
    }
    if (savedVolume !== null) {
      const parsed = parseFloat(savedVolume)
      if (!isNaN(parsed)) {
        setVolumeState(Math.min(1, Math.max(0, parsed)))
      }
    }
  }, [])

  const enable = useCallback(() => {
    setEnabled(true)
    localStorage.setItem(STORAGE_KEYS.enabled, 'true')
  }, [])

  const disable = useCallback(() => {
    setEnabled(false)
    localStorage.setItem(STORAGE_KEYS.enabled, 'false')
  }, [])

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const newValue = !prev
      localStorage.setItem(STORAGE_KEYS.enabled, String(newValue))
      return newValue
    })
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.min(1, Math.max(0, newVolume))
    setVolumeState(clamped)
    localStorage.setItem(STORAGE_KEYS.volume, String(clamped))
  }, [])

  const playWarning = useCallback(async (type: TimeWarningType): Promise<void> => {
    if (!enabled) return

    try {
      const soundFile = SOUND_FILES[type]
      const audio = new Audio(soundFile)
      audio.volume = volume
      await audio.play()
    } catch (error) {
      // Silently handle audio playback failures (e.g., autoplay restrictions)
      console.debug('Audio playback failed:', error)
    }
  }, [enabled, volume])

  return {
    enabled,
    volume,
    enable,
    disable,
    toggle,
    setVolume,
    playWarning,
  }
}
