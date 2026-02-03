/**
 * Debug Logging Utilities
 * Provides structured logging for session operations (Phase 7)
 * Only logs in development mode
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: Date
  level: LogLevel
  event: string
  data?: unknown
}

// Store recent logs for dev panel inspection
const LOG_BUFFER_SIZE = 100
const logBuffer: LogEntry[] = []

function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development'
}

function addToBuffer(entry: LogEntry): void {
  logBuffer.push(entry)
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift()
  }
}

function formatTimestamp(date: Date): string {
  return date.toISOString().slice(11, 23) // HH:mm:ss.SSS
}

/**
 * Session-specific debug logger
 */
export const sessionDebug = {
  /**
   * Log a debug message
   */
  debug(event: string, data?: unknown): void {
    if (!isDevMode()) return
    const entry: LogEntry = { timestamp: new Date(), level: 'debug', event, data }
    addToBuffer(entry)
    console.debug(`[Session] ${formatTimestamp(entry.timestamp)} ${event}`, data ?? '')
  },

  /**
   * Log an info message
   */
  log(event: string, data?: unknown): void {
    if (!isDevMode()) return
    const entry: LogEntry = { timestamp: new Date(), level: 'info', event, data }
    addToBuffer(entry)
    console.log(`[Session] ${formatTimestamp(entry.timestamp)} ${event}`, data ?? '')
  },

  /**
   * Log a warning
   */
  warn(event: string, data?: unknown): void {
    if (!isDevMode()) return
    const entry: LogEntry = { timestamp: new Date(), level: 'warn', event, data }
    addToBuffer(entry)
    console.warn(`[Session] ${formatTimestamp(entry.timestamp)} ${event}`, data ?? '')
  },

  /**
   * Log an error
   */
  error(event: string, data?: unknown): void {
    if (!isDevMode()) return
    const entry: LogEntry = { timestamp: new Date(), level: 'error', event, data }
    addToBuffer(entry)
    console.error(`[Session] ${formatTimestamp(entry.timestamp)} ${event}`, data ?? '')
  },

  /**
   * Get all buffered log entries
   */
  getBuffer(): readonly LogEntry[] {
    return [...logBuffer]
  },

  /**
   * Clear the log buffer
   */
  clearBuffer(): void {
    logBuffer.length = 0
  },

  /**
   * Time an operation and log its duration
   */
  time<T>(label: string, fn: () => T): T {
    if (!isDevMode()) return fn()

    const start = performance.now()
    const result = fn()
    const duration = (performance.now() - start).toFixed(2)
    this.debug(`${label} completed`, { durationMs: parseFloat(duration) })
    return result
  },

  /**
   * Time an async operation and log its duration
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!isDevMode()) return fn()

    const start = performance.now()
    const result = await fn()
    const duration = (performance.now() - start).toFixed(2)
    this.debug(`${label} completed`, { durationMs: parseFloat(duration) })
    return result
  },
}

/**
 * Storage-specific debug logger
 */
export const storageDebug = {
  read(key: string, success: boolean, data?: unknown): void {
    if (!isDevMode()) return
    sessionDebug.debug(`storage.read(${key})`, { success, data })
  },

  write(key: string, success: boolean, error?: unknown): void {
    if (!isDevMode()) return
    sessionDebug.debug(`storage.write(${key})`, { success, error })
  },

  delete(key: string): void {
    if (!isDevMode()) return
    sessionDebug.debug(`storage.delete(${key})`)
  },
}

export type { LogEntry, LogLevel }
