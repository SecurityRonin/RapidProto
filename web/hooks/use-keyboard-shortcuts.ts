/**
 * Keyboard Shortcuts Hook
 * Global keyboard handler for session controls
 *
 * Shortcuts:
 * - Space: Pause/Resume session
 * - ArrowRight (→): Advance phase/stage
 * - ArrowLeft (←): Go back (facilitator only)
 * - Escape: Clear focus
 */

'use client'

import { useEffect, useCallback, useState } from 'react'

const STORAGE_KEY = 'rapidproto_keyboard_shortcuts'

export type ShortcutAction = 'pause' | 'resume' | 'advance' | 'back' | 'escape'

interface ShortcutCallbacks {
  onPause?: () => void
  onResume?: () => void
  onAdvance?: () => void
  onBack?: () => void
}

interface ShortcutContext {
  isPaused: boolean
  canAdvance: boolean
  canGoBack: boolean
}

interface UseKeyboardShortcutsOptions {
  callbacks: ShortcutCallbacks
  context: ShortcutContext
}

interface UseKeyboardShortcutsReturn {
  enabled: boolean
  enable: () => void
  disable: () => void
  toggle: () => void
}

/**
 * Check if the keyboard event target is an input element
 * Prevents shortcuts from firing when user is typing
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  )
}

export function useKeyboardShortcuts({
  callbacks,
  context,
}: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  const [enabled, setEnabled] = useState(true)

  // Load persisted state on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem(STORAGE_KEY)
    if (savedEnabled !== null) {
      setEnabled(savedEnabled === 'true')
    }
  }, [])

  const enable = useCallback(() => {
    setEnabled(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }, [])

  const disable = useCallback(() => {
    setEnabled(false)
    localStorage.setItem(STORAGE_KEY, 'false')
  }, [])

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const newValue = !prev
      localStorage.setItem(STORAGE_KEY, String(newValue))
      return newValue
    })
  }, [])

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      if (isInputElement(event.target)) return

      // Don't fire when modifiers are held (except Shift for potential future shortcuts)
      if (event.ctrlKey || event.altKey || event.metaKey) return

      const { isPaused, canAdvance, canGoBack } = context
      const { onPause, onResume, onAdvance, onBack } = callbacks

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (isPaused && onResume) {
            onResume()
          } else if (!isPaused && onPause) {
            onPause()
          }
          break

        case 'ArrowRight':
          event.preventDefault()
          if (canAdvance && onAdvance) {
            onAdvance()
          }
          break

        case 'ArrowLeft':
          event.preventDefault()
          if (canGoBack && onBack) {
            onBack()
          }
          break

        case 'Escape':
          event.preventDefault()
          // Clear focus from any element
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
          break
      }
    },
    [callbacks, context]
  )

  // Attach/detach event listener
  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])

  return {
    enabled,
    enable,
    disable,
    toggle,
  }
}

/**
 * Shortcut hint labels for display in buttons
 */
export const SHORTCUT_HINTS: Record<ShortcutAction, string> = {
  pause: 'Space',
  resume: 'Space',
  advance: '→',
  back: '←',
  escape: 'Esc',
}
