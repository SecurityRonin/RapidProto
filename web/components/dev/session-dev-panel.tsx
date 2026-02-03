/**
 * Session Dev Panel
 * Developer tools for debugging session state (Phase 7)
 * Only rendered in development mode
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, RefreshCw, Trash2, ChevronDown, ChevronUp, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sessionDebug, type LogEntry, type LogLevel } from '@/lib/debug'
import { cn } from '@/lib/utils'

interface SessionDevPanelProps {
  sessionId?: string
}

type Tab = 'state' | 'storage' | 'logs'

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'text-gray-500',
  info: 'text-blue-600',
  warn: 'text-yellow-600',
  error: 'text-red-600',
}

export function SessionDevPanel({ sessionId }: SessionDevPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('state')
  const [logs, setLogs] = useState<readonly LogEntry[]>([])
  const [sessionData, setSessionData] = useState<unknown>(null)
  const [storageData, setStorageData] = useState<Record<string, unknown>>({})

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Refresh data
  const refreshData = useCallback(() => {
    // Get logs from buffer
    setLogs(sessionDebug.getBuffer())

    // Get session data from localStorage
    try {
      const sessionsRaw = localStorage.getItem('rapidproto_sessions')
      const sessions = sessionsRaw ? JSON.parse(sessionsRaw) : []
      const currentSession = sessionId
        ? sessions.find((s: { id: string }) => s.id === sessionId)
        : sessions[0]
      setSessionData(currentSession || null)
    } catch (error) {
      setSessionData({ error: 'Failed to parse session data' })
    }

    // Get all RapidProto storage keys
    const storage: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('rapidproto_')) {
        try {
          storage[key] = JSON.parse(localStorage.getItem(key) || '{}')
        } catch {
          storage[key] = localStorage.getItem(key)
        }
      }
    }
    setStorageData(storage)
  }, [sessionId])

  // Refresh on open
  useEffect(() => {
    if (isOpen) {
      refreshData()
    }
  }, [isOpen, refreshData])

  // Auto-refresh logs every 2 seconds when logs tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== 'logs') return

    const interval = setInterval(() => {
      setLogs(sessionDebug.getBuffer())
    }, 2000)

    return () => clearInterval(interval)
  }, [isOpen, activeTab])

  const clearStorage = () => {
    if (confirm('Clear all RapidProto storage data?')) {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('rapidproto_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      refreshData()
    }
  }

  const clearLogs = () => {
    sessionDebug.clearBuffer()
    setLogs([])
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Open Dev Panel (Ctrl+Shift+D)"
      >
        <Bug className="h-5 w-5" />
      </button>
    )
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-[500px] max-h-[600px] shadow-2xl border-2 border-gray-300 bg-white">
      <CardHeader className="py-2 px-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Session Dev Panel
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              className="h-7 w-7 p-0"
              title="Refresh"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(prev => !prev)}
              className="h-7 w-7 p-0"
            >
              {isMinimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex gap-1 mt-2">
            {(['state', 'storage', 'logs'] as Tab[]).map(tab => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="text-xs h-6 px-2"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-3">
          {activeTab === 'state' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">
                  Session: {sessionId || 'None'}
                </span>
                {sessionData !== null && (
                  <Badge variant="outline" className="text-xs">
                    {(sessionData as { status?: string }).status || 'unknown'}
                  </Badge>
                )}
              </div>
              <ScrollArea className="h-[300px] rounded border p-2">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(sessionData, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">
                  {Object.keys(storageData).length} keys
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearStorage}
                  className="h-6 text-xs px-2"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded border p-2">
                {Object.entries(storageData).map(([key, value]) => (
                  <div key={key} className="mb-3">
                    <div className="text-xs font-medium text-blue-600 mb-1">
                      {key.replace('rapidproto_', '')}
                    </div>
                    <pre className="text-xs font-mono bg-gray-50 p-1 rounded whitespace-pre-wrap">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">
                  {logs.length} log entries
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogs}
                  className="h-6 text-xs px-2"
                >
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded border p-2">
                {logs.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-8">
                    No logs yet. Operations will appear here.
                  </div>
                ) : (
                  logs.map((entry, i) => (
                    <div key={i} className="text-xs font-mono mb-1 flex gap-2">
                      <span className="text-gray-400 shrink-0">
                        {entry.timestamp.toISOString().slice(11, 19)}
                      </span>
                      <span className={cn('shrink-0', LOG_LEVEL_COLORS[entry.level])}>
                        [{entry.level.toUpperCase().padEnd(5)}]
                      </span>
                      <span className="break-all">
                        {entry.event}
                        {entry.data !== undefined && (
                          <span className="text-gray-500">
                            {' '}
                            {typeof entry.data === 'object'
                              ? JSON.stringify(entry.data)
                              : String(entry.data)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
