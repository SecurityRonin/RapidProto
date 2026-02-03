/**
 * Tests for Debug Logging Utilities (Phase 7)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sessionDebug, storageDebug } from '@/lib/debug'

describe('sessionDebug', () => {
  beforeEach(() => {
    // Clear the log buffer before each test
    sessionDebug.clearBuffer()
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('logs to buffer in development mode', () => {
    sessionDebug.log('test event', { foo: 'bar' })

    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(1)
    expect(buffer[0].event).toBe('test event')
    expect(buffer[0].data).toEqual({ foo: 'bar' })
    expect(buffer[0].level).toBe('info')
  })

  it('supports all log levels', () => {
    sessionDebug.debug('debug event')
    sessionDebug.log('info event')
    sessionDebug.warn('warn event')
    sessionDebug.error('error event')

    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(4)
    expect(buffer[0].level).toBe('debug')
    expect(buffer[1].level).toBe('info')
    expect(buffer[2].level).toBe('warn')
    expect(buffer[3].level).toBe('error')
  })

  it('clearBuffer removes all entries', () => {
    sessionDebug.log('event 1')
    sessionDebug.log('event 2')
    expect(sessionDebug.getBuffer().length).toBe(2)

    sessionDebug.clearBuffer()
    expect(sessionDebug.getBuffer().length).toBe(0)
  })

  it('buffer has maximum size of 100', () => {
    for (let i = 0; i < 150; i++) {
      sessionDebug.log(`event ${i}`)
    }

    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(100)
    // First event should be "event 50" (events 0-49 were evicted)
    expect(buffer[0].event).toBe('event 50')
    expect(buffer[99].event).toBe('event 149')
  })

  it('time() measures and logs duration', () => {
    let result: number = 0
    sessionDebug.time('calculation', () => {
      result = 1 + 1
    })

    expect(result).toBe(2)
    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(1)
    expect(buffer[0].event).toContain('calculation completed')
    expect(buffer[0].data).toHaveProperty('durationMs')
  })

  it('timeAsync() measures and logs async duration', async () => {
    const result = await sessionDebug.timeAsync('async op', async () => {
      return 'done'
    })

    expect(result).toBe('done')
    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(1)
    expect(buffer[0].event).toContain('async op completed')
  })
})

describe('storageDebug', () => {
  beforeEach(() => {
    sessionDebug.clearBuffer()
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('logs storage read operations', () => {
    storageDebug.read('testKey', true, { data: 'value' })

    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(1)
    expect(buffer[0].event).toContain('storage.read(testKey)')
    expect(buffer[0].data).toEqual({ success: true, data: { data: 'value' } })
  })

  it('logs storage write operations', () => {
    storageDebug.write('testKey', true)

    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(1)
    expect(buffer[0].event).toContain('storage.write(testKey)')
  })

  it('logs storage delete operations', () => {
    storageDebug.delete('testKey')

    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(1)
    expect(buffer[0].event).toContain('storage.delete(testKey)')
  })
})

describe('production mode', () => {
  beforeEach(() => {
    sessionDebug.clearBuffer()
    vi.stubEnv('NODE_ENV', 'production')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not log in production mode', () => {
    sessionDebug.log('should not appear')
    sessionDebug.debug('should not appear')
    sessionDebug.warn('should not appear')
    sessionDebug.error('should not appear')

    const buffer = sessionDebug.getBuffer()
    expect(buffer.length).toBe(0)
  })

  it('time() still executes function in production', () => {
    let executed = false
    sessionDebug.time('label', () => {
      executed = true
    })

    expect(executed).toBe(true)
    expect(sessionDebug.getBuffer().length).toBe(0)
  })
})
