/**
 * Session Dashboard Debug Utilities
 *
 * Provides structured logging and state inspection for debugging
 * session-related issues. Enable via localStorage or query param.
 */

import type { DebugInfo, Role, SessionStatusData } from './types'

// =============================================================================
// DEBUG CONFIGURATION
// =============================================================================

const DEBUG_KEY = 'rapidproto_debug'
const DEBUG_QUERY_PARAM = 'debug'

/** Check if debug mode is enabled */
export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false

  // Check query param first (for one-time debugging)
  const params = new URLSearchParams(window.location.search)
  if (params.get(DEBUG_QUERY_PARAM) === 'true') return true

  // Check localStorage (for persistent debugging)
  return localStorage.getItem(DEBUG_KEY) === 'true'
}

/** Enable debug mode */
export function enableDebug(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEBUG_KEY, 'true')
  console.log('[SessionDashboard] Debug mode enabled')
}

/** Disable debug mode */
export function disableDebug(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DEBUG_KEY)
  console.log('[SessionDashboard] Debug mode disabled')
}

// =============================================================================
// STRUCTURED LOGGING
// =============================================================================

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const LOG_COLORS: Record<LogLevel, string> = {
  info: '#2563eb',   // blue
  warn: '#d97706',   // amber
  error: '#dc2626',  // red
  debug: '#6b7280',  // gray
}

function log(level: LogLevel, category: string, message: string, data?: unknown): void {
  if (!isDebugEnabled() && level !== 'error') return

  const prefix = `[SessionDashboard:${category}]`
  const style = `color: ${LOG_COLORS[level]}; font-weight: bold;`

  if (data !== undefined) {
    console[level](`%c${prefix}`, style, message, data)
  } else {
    console[level](`%c${prefix}`, style, message)
  }
}

// =============================================================================
// LOGGING API
// =============================================================================

export const debug = {
  /** Log role detection process */
  roleDetection(params: {
    propRole?: Role
    storedRole: Role | null
    finalRole: Role
    source: 'prop' | 'localStorage' | 'default'
    sessionId: string
  }): void {
    log('debug', 'Role', 'Role detection completed', params)
  },

  /** Log mount lifecycle */
  mount(sessionId: string): void {
    log('debug', 'Lifecycle', `Component mounted for session: ${sessionId}`)
  },

  /** Log session data loaded */
  sessionLoaded(data: SessionStatusData): void {
    log('info', 'Data', 'Session data loaded', {
      id: data.session.id,
      status: data.session.status,
      phase: data.currentPhase,
      facilitatorStage: data.session.facilitatorStage,
      stepsCompleted: data.stepsCompleted,
      stepsTotal: data.stepsTotal,
    })
  },

  /** Log action execution */
  actionStart(actionName: string, sessionId: string): void {
    log('debug', 'Action', `Starting: ${actionName}`, { sessionId })
  },

  /** Log action result */
  actionResult(actionName: string, result: { success: boolean; error?: string }): void {
    if (result.success) {
      log('info', 'Action', `Success: ${actionName}`)
    } else {
      log('warn', 'Action', `Failed: ${actionName}`, { error: result.error })
    }
  },

  /** Log error */
  error(category: string, message: string, error?: unknown): void {
    log('error', category, message, error)
  },

  /** Log state change */
  stateChange(stateName: string, oldValue: unknown, newValue: unknown): void {
    log('debug', 'State', `${stateName} changed`, { from: oldValue, to: newValue })
  },

  /** Log render with key state */
  render(info: DebugInfo): void {
    log('debug', 'Render', 'Component rendering', info)
  },
}

// =============================================================================
// STATE INSPECTION
// =============================================================================

/** Create a debug info snapshot for the current state */
export function createDebugInfo(params: {
  role: Role
  roleSource: 'prop' | 'localStorage' | 'default'
  sessionId: string
  session: SessionStatusData | null
  mounted: boolean
}): DebugInfo {
  return {
    role: params.role,
    roleSource: params.roleSource,
    sessionId: params.sessionId,
    phase: params.session?.currentPhase ?? 'discovery',
    facilitatorStage: params.session?.session.facilitatorStage,
    status: params.session?.session.status ?? 'active',
    mounted: params.mounted,
  }
}

// =============================================================================
// GLOBAL DEBUG HELPERS (for console access)
// =============================================================================

if (typeof window !== 'undefined') {
  // Expose debug controls globally for easy access in browser console
  ;(window as unknown as Record<string, unknown>).__rapidproto_debug = {
    enable: enableDebug,
    disable: disableDebug,
    isEnabled: isDebugEnabled,
  }
}
