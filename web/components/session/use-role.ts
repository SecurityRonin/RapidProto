/**
 * Role Detection Hook
 *
 * Encapsulates all role detection logic with proper SSR handling.
 * Role priority: prop > localStorage > default ('builder')
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Role } from './types'
import { isValidRole } from './types'
import { getRoleStorageKey } from './constants'
import { debug } from './debug'

interface UseRoleOptions {
  sessionId: string
  propRole?: Role
}

interface UseRoleResult {
  /** The resolved role */
  role: Role
  /** Whether the role was determined (after mount) */
  isReady: boolean
  /** Convenience: role === 'builder' */
  isBuilder: boolean
  /** Convenience: role === 'facilitator' */
  isFacilitator: boolean
  /** How the role was determined */
  source: 'prop' | 'localStorage' | 'default'
}

/**
 * Read role from localStorage (client-side only)
 */
function getStoredRole(sessionId: string): Role | null {
  if (typeof window === 'undefined') return null

  const key = getRoleStorageKey(sessionId)
  const stored = localStorage.getItem(key)

  if (isValidRole(stored)) {
    return stored
  }

  return null
}

/**
 * Hook for detecting and managing user role in a session.
 *
 * Handles SSR/hydration correctly by deferring localStorage
 * access until after mount.
 *
 * @example
 * ```tsx
 * const { role, isBuilder, isFacilitator, isReady } = useRole({
 *   sessionId: 'abc123',
 *   propRole: undefined, // or 'builder' | 'facilitator'
 * })
 *
 * if (!isReady) return <Loading />
 * ```
 */
export function useRole({ sessionId, propRole }: UseRoleOptions): UseRoleResult {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    debug.mount(sessionId)
  }, [sessionId])

  // Compute role and source together to avoid inconsistency
  const { role, source } = useMemo(() => {
    // Priority 1: Explicit prop
    if (propRole) {
      return { role: propRole, source: 'prop' as const }
    }

    // Priority 2: localStorage (only after mount to avoid SSR mismatch)
    if (mounted) {
      const storedRole = getStoredRole(sessionId)
      if (storedRole) {
        return { role: storedRole, source: 'localStorage' as const }
      }
    }

    // Priority 3: Default
    return { role: 'builder' as Role, source: 'default' as const }
  }, [propRole, mounted, sessionId])

  // Log role detection (only when role changes)
  useEffect(() => {
    if (mounted) {
      debug.roleDetection({
        propRole,
        storedRole: getStoredRole(sessionId),
        finalRole: role,
        source,
        sessionId,
      })
    }
  }, [role, source, mounted, propRole, sessionId])

  return {
    role,
    isReady: mounted,
    isBuilder: role === 'builder',
    isFacilitator: role === 'facilitator',
    source,
  }
}
