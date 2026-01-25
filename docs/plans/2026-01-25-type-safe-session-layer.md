# Type-Safe Session Layer Design

**Date:** 2026-01-25
**Author:** Design Session with User
**Status:** Validated Design - Ready for Implementation

---

## Executive Summary

Enhance RapidProto to minimize surprises and debugging time when templates are integrated into full apps. The design addresses four problem areas in priority order:

1. **Type safety gaps** - JSON fields crash on malformed data, `any` types everywhere
2. **State management bugs** - Race conditions from multiple polling loops, silent action failures
3. **Runtime errors** - Errors ignored, no user feedback on failures
4. **Environment mismatches** - Cryptic errors when env vars missing

---

## Problem Analysis

### Current Issues Found

**Type Safety:**
- `useState<any>(null)` provides no compile-time safety
- JSON fields (`threeWins`, `painPoints`) stored as `text` with 20+ scattered `JSON.parse` calls
- No typed action response contract - components guess at response shapes

**State Management:**
- Each component polls independently with `setInterval` - race conditions possible
- `SessionDashboard`, `ClientInfoForm`, `TemplateSelector` all fetch independently
- No shared session context between components

**Runtime Errors:**
- Actions called without error handling: `await pauseSession(sessionId)` ignores failures
- Users see no feedback when operations fail
- Errors silently swallowed

**Environment:**
- Missing env vars cause cryptic runtime errors deep in the stack
- No startup validation

---

## Design

### 1. Safe JSON Field Utilities

**File:** `lib/utils/json-fields.ts`

```typescript
/**
 * Type-safe JSON field parsing with fallbacks
 * Eliminates crash risk from malformed JSON in database text fields
 */

export function parseJsonField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (err) {
    console.warn('Failed to parse JSON field:', value, err)
    return fallback
  }
}

// Type-specific helpers for common fields
export const parseStringArray = (v: string | null): string[] =>
  parseJsonField<string[]>(v, [])

export const parseThreeWins = parseStringArray
export const parsePainPoints = parseStringArray
export const parseMustHaveFeatures = parseStringArray
export const parseNiceToHaveFeatures = parseStringArray
export const parseTags = parseStringArray

// Serialize helpers (for consistency)
export const serializeStringArray = (arr: string[]): string =>
  JSON.stringify(arr)
```

**Benefits:**
- Single place to handle JSON parsing errors
- Type inference from fallback value
- Console warning for debugging without crashing
- Eliminates 20+ scattered `JSON.parse` calls

---

### 2. Typed Action Response Contract

**File:** `types/actions.ts`

```typescript
/**
 * Standardized action response types
 * All server actions return this shape for predictable handling
 */

// Base response - discriminated union for type narrowing
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ActionErrorCode }

// Error codes for programmatic handling
export type ActionErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

// Phase type used throughout
export type Phase = 'discovery' | 'build' | 'demo'
export type SessionStatus = 'active' | 'paused' | 'completed'
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type Role = 'builder' | 'facilitator'

// Time tracking
export interface TimeRemaining {
  phase: Phase
  totalMinutes: number
  elapsedMinutes: number
  remainingMinutes: number
  isOvertime: boolean
  overtimeMinutes: number
}

// Parsed client info (JSON fields converted to arrays)
export interface ClientInfoParsed {
  id: string
  sessionId: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  businessType: string | null
  companySize: string | null
  problemStatement: string
  currentSolution: string | null
  whyNow: string | null
  threeWins: string[]        // Parsed from JSON
  painPoints: string[]       // Parsed from JSON
  mustHaveFeatures: string[] // Parsed from JSON
  niceToHaveFeatures: string[] // Parsed from JSON
  budget: string | null
  timeline: string | null
  decisionMakers: string | null
  createdAt: Date
  updatedAt: Date
}

// Session with nested data
export interface SessionWithDetails {
  id: string
  role: Role
  status: SessionStatus
  currentPhase: Phase
  phaseStartedAt: Date
  discoveryDuration: number
  buildDuration: number
  demoDuration: number
  startedAt: Date
  pausedAt: Date | null
  completedAt: Date | null
  totalPausedTime: number
  userId: string
  teamId: string | null
  sessionTitle: string | null
  steps: SessionStep[]
  clientInfo: ClientInfoParsed | null
  selectedTemplate: TemplateSelection | null
}

// Main session status response
export interface SessionStatusData {
  session: SessionWithDetails
  currentPhase: Phase
  timeRemaining: TimeRemaining
  stepsCompleted: number
  stepsTotal: number
  clientInfo: ClientInfoParsed | null
  selectedTemplate: TemplateSelection | null
}

// Response types for each action
export type CreateSessionResponse = ActionResponse<{ sessionId: string }>
export type SessionStatusResponse = ActionResponse<SessionStatusData>
export type PauseSessionResponse = ActionResponse<{ status: SessionStatus }>
export type ResumeSessionResponse = ActionResponse<{ status: SessionStatus }>
export type AdvancePhaseResponse = ActionResponse<{ currentPhase: Phase }>
export type CompleteSessionResponse = ActionResponse<{ status: SessionStatus }>
export type SaveClientInfoResponse = ActionResponse<ClientInfoParsed>
export type UpdateStepResponse = ActionResponse<{ success: true }>
```

**Benefits:**
- Compile-time type checking for all action consumers
- Discriminated union enables type narrowing with `if (result.success)`
- Error codes allow programmatic error handling
- Parsed types ensure JSON fields are arrays, not strings

---

### 3. Session Context Provider

**File:** `hooks/use-session.tsx`

```typescript
'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode
} from 'react'
import { getSessionStatus } from '@/lib/actions'
import type { SessionStatusData } from '@/types/actions'

interface SessionContextValue {
  // Data
  session: SessionStatusData | null
  loading: boolean
  error: string | null

  // Actions
  refresh: () => Promise<void>
  setOptimistic: <K extends keyof SessionStatusData>(
    key: K,
    updater: (prev: SessionStatusData[K]) => SessionStatusData[K]
  ) => void

  // Polling control
  pausePolling: () => void
  resumePolling: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

interface SessionProviderProps {
  sessionId: string
  children: ReactNode
  pollInterval?: number // Default 5000ms
}

export function SessionProvider({
  sessionId,
  children,
  pollInterval = 5000
}: SessionProviderProps) {
  const [session, setSession] = useState<SessionStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(true)

  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const result = await getSessionStatus(sessionId)

      if (!isMountedRef.current) return

      if (result.success) {
        setSession(result.data)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [sessionId])

  // Single polling loop - prevents race conditions
  useEffect(() => {
    isMountedRef.current = true
    refresh()

    const startPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (pollingEnabled) {
        pollRef.current = setInterval(refresh, pollInterval)
      }
    }

    startPolling()

    return () => {
      isMountedRef.current = false
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [refresh, pollInterval, pollingEnabled])

  const setOptimistic = useCallback(<K extends keyof SessionStatusData>(
    key: K,
    updater: (prev: SessionStatusData[K]) => SessionStatusData[K]
  ) => {
    setSession(prev => {
      if (!prev) return prev
      return { ...prev, [key]: updater(prev[key]) }
    })
  }, [])

  const pausePolling = useCallback(() => {
    setPollingEnabled(false)
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  const resumePolling = useCallback(() => {
    setPollingEnabled(true)
  }, [])

  return (
    <SessionContext.Provider value={{
      session,
      loading,
      error,
      refresh,
      setOptimistic,
      pausePolling,
      resumePolling,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return ctx
}

// Convenience hooks for specific data
export function useSessionTimer() {
  const { session } = useSession()
  return session?.timeRemaining ?? null
}

export function useSessionSteps() {
  const { session } = useSession()
  return session?.session.steps ?? []
}

export function useClientInfo() {
  const { session } = useSession()
  return session?.clientInfo ?? null
}
```

**Benefits:**
- Single polling loop eliminates race conditions
- All components share same session state
- Optimistic updates for instant UI feedback
- Polling can be paused during user input
- Convenience hooks for specific data slices

---

### 4. Safe Action Wrapper Hook

**File:** `hooks/use-action.ts`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useSession } from './use-session'
import type { ActionResponse } from '@/types/actions'

interface UseActionOptions<TOutput> {
  onSuccess?: (data: TOutput) => void
  onError?: (error: string) => void
  refreshOnSuccess?: boolean  // Default: true
  optimisticUpdate?: () => void
}

interface UseActionReturn<TInput, TOutput> {
  execute: (input: TInput) => Promise<TOutput | null>
  loading: boolean
  error: string | null
  clearError: () => void
}

export function useAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResponse<TOutput>>,
  options: UseActionOptions<TOutput> = {}
): UseActionReturn<TInput, TOutput> {
  const { refresh } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (input: TInput): Promise<TOutput | null> => {
    setLoading(true)
    setError(null)

    // Apply optimistic update immediately
    options.optimisticUpdate?.()

    try {
      const result = await action(input)

      if (result.success) {
        // Refresh session state unless disabled
        if (options.refreshOnSuccess !== false) {
          await refresh()
        }
        options.onSuccess?.(result.data)
        return result.data
      } else {
        setError(result.error)
        options.onError?.(result.error)
        // Refresh to revert optimistic update
        await refresh()
        return null
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      options.onError?.(message)
      // Refresh to revert optimistic update
      await refresh()
      return null
    } finally {
      setLoading(false)
    }
  }, [action, refresh, options])

  const clearError = useCallback(() => setError(null), [])

  return { execute, loading, error, clearError }
}

// Pre-built hooks for common session actions
import {
  pauseSession,
  resumeSession,
  advancePhase,
  completeSession,
  updateStep,
  saveClientInfo,
} from '@/lib/actions'

export function usePauseSession(sessionId: string) {
  return useAction(
    () => pauseSession(sessionId),
    { refreshOnSuccess: true }
  )
}

export function useResumeSession(sessionId: string) {
  return useAction(
    () => resumeSession(sessionId),
    { refreshOnSuccess: true }
  )
}

export function useAdvancePhase(sessionId: string) {
  return useAction(
    () => advancePhase(sessionId),
    { refreshOnSuccess: true }
  )
}

export function useCompleteSession(sessionId: string) {
  return useAction(
    () => completeSession(sessionId),
    { refreshOnSuccess: true }
  )
}

export function useUpdateStep(sessionId: string) {
  return useAction(
    (input: { stepId: string; status?: string; timeSpent?: number; notes?: string }) =>
      updateStep(sessionId, input.stepId, input),
    { refreshOnSuccess: true }
  )
}

export function useSaveClientInfo(sessionId: string) {
  return useAction(
    (data: Parameters<typeof saveClientInfo>[1]) => saveClientInfo(sessionId, data),
    { refreshOnSuccess: true }
  )
}
```

**Benefits:**
- Automatic error handling for all actions
- Loading state for UI feedback
- Auto-refresh session state after mutations
- Optimistic updates with rollback on failure
- Pre-built hooks reduce boilerplate

---

### 5. Environment Validation

**File:** `lib/utils/env-check.ts`

```typescript
/**
 * Environment validation - fail fast on missing config
 * Call at startup before database/service initialization
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
] as const

const optionalEnvVars = [
  'RESEND_API_KEY',
  'VERCEL_URL',
  'NEXT_PUBLIC_APP_URL',
] as const

export class EnvValidationError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing required environment variables:\n` +
      missing.map(k => `  - ${k}`).join('\n') +
      `\n\nCopy .env.example to .env.local and fill in values.`
    )
    this.name = 'EnvValidationError'
  }
}

export function validateEnv(): void {
  const missing = requiredEnvVars.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new EnvValidationError(missing)
  }

  // Warn about optional but recommended vars
  const missingOptional = optionalEnvVars.filter(key => !process.env[key])
  if (missingOptional.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `[env] Optional environment variables not set: ${missingOptional.join(', ')}`
    )
  }
}

// Type-safe environment access
// Only use after validateEnv() has been called
export const env = {
  clerk: {
    publishableKey: () => process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: () => process.env.CLERK_SECRET_KEY!,
  },
  turso: {
    url: () => process.env.TURSO_DATABASE_URL!,
    token: () => process.env.TURSO_AUTH_TOKEN!,
  },
  resend: {
    apiKey: () => process.env.RESEND_API_KEY,
  },
  app: {
    url: () => process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000',
  },
} as const
```

**Usage in `lib/db/index.ts`:**

```typescript
import { validateEnv, env } from '@/lib/utils/env-check'

// Validate at module load - fails fast with clear message
validateEnv()

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const client = createClient({
  url: env.turso.url(),
  authToken: env.turso.token(),
})

export const db = drizzle(client)
```

**Benefits:**
- Immediate, clear error message on missing config
- No cryptic runtime errors deep in the stack
- Type-safe env access after validation
- Development warnings for optional vars

---

## Implementation Plan

### Phase 1: Foundation (30 min)
1. Create `types/actions.ts` with response types
2. Create `lib/utils/json-fields.ts` with parse helpers
3. Create `lib/utils/env-check.ts` with validation

### Phase 2: Update Actions (45 min)
1. Update `lib/actions/index.ts` to use typed responses
2. Parse JSON fields in actions before returning
3. Add `validateEnv()` to `lib/db/index.ts`

### Phase 3: Session Provider (30 min)
1. Create `hooks/use-session.tsx` with provider
2. Create `hooks/use-action.ts` with wrapper hook

### Phase 4: Refactor Components (45 min)
1. Wrap app with `SessionProvider`
2. Update `SessionDashboard` to use `useSession()`
3. Update `ClientInfoForm` to use `useSaveClientInfo()`
4. Update `StepChecklist` to use `useUpdateStep()`
5. Remove all direct `JSON.parse` calls from components

### Phase 5: Testing (30 min)
1. Update tests for new typed responses
2. Add tests for JSON parse edge cases
3. Verify all 170 tests pass

---

## Migration Guide

### Before (Current Pattern)
```typescript
// Component with race conditions and no error handling
const [session, setSession] = useState<any>(null)

useEffect(() => {
  const interval = setInterval(async () => {
    const result = await getSessionStatus(sessionId)
    if (result.success) setSession(result.data)
  }, 5000)
  return () => clearInterval(interval)
}, [])

const handlePause = async () => {
  await pauseSession(sessionId)  // Error ignored!
  // Manual refresh
}

// Crash risk!
const wins = JSON.parse(session.clientInfo.threeWins)
```

### After (New Pattern)
```typescript
// Type-safe, centralized state, error handling
const { session, loading, error } = useSession()
const { execute: pause, loading: pausing, error: pauseError } = usePauseSession(sessionId)

const handlePause = () => pause()  // Auto-refresh, error captured

// Safe - already parsed, typed as string[]
const wins = session?.clientInfo?.threeWins ?? []
```

---

## Success Metrics

- **Zero JSON.parse crashes** - All JSON fields parsed with fallbacks
- **Type coverage** - No `any` types in session-related code
- **Single polling loop** - Only `SessionProvider` polls
- **Error visibility** - All action failures surface to UI
- **Fast failure** - Missing env vars caught at startup

---

**Design validated:** 2026-01-25
**Ready for implementation**
