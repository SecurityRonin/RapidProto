/**
 * Session Export Utilities
 * Generate markdown and JSON exports of completed sessions
 */

import type { Session, SessionStep } from './store'

/**
 * Format a date for export display
 */
function formatExportDate(date: Date | null): string {
  if (!date) return 'N/A'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate duration in minutes between two dates
 */
function calculateDurationMinutes(start: Date, end: Date | null, pausedTime: number = 0): number {
  if (!end) return 0
  const totalMs = end.getTime() - start.getTime() - pausedTime
  return Math.round(totalMs / 1000 / 60)
}

/**
 * Format duration as human-readable string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
}

/**
 * Get status emoji for markdown
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'completed': return '[x]'
    case 'skipped': return '[-]'
    default: return '[ ]'
  }
}

/**
 * Group steps by phase
 */
function groupStepsByPhase(steps: SessionStep[]): Record<string, SessionStep[]> {
  return steps.reduce((acc, step) => {
    const phase = step.phase
    if (!acc[phase]) acc[phase] = []
    acc[phase].push(step)
    return acc
  }, {} as Record<string, SessionStep[]>)
}

/**
 * Phase display names
 */
const PHASE_NAMES: Record<string, string> = {
  discovery: 'Discovery Phase',
  build: 'Build Phase',
  demo: 'Demo/Verify Phase',
  expectations: 'Expectations Stage',
  longterm: 'Long Term Stage',
  close: 'Close Stage',
}

/**
 * Export session as markdown
 */
export function exportSessionAsMarkdown(session: Session): string {
  const duration = calculateDurationMinutes(
    session.startedAt,
    session.completedAt,
    session.totalPausedTime
  )

  const lines: string[] = []

  // Header
  lines.push(`# Session: ${session.sessionTitle || 'Untitled Session'}`)
  lines.push('')
  lines.push(`**Date:** ${formatExportDate(session.completedAt || session.startedAt)}`)
  lines.push(`**Duration:** ${formatDuration(duration)}`)
  lines.push(`**Status:** ${session.status === 'completed' ? 'Completed' : 'Abandoned'}`)
  lines.push('')

  // Synced Inputs
  if (session.syncedInputs && Object.keys(session.syncedInputs).length > 0) {
    lines.push('## Key Decisions')
    lines.push('')

    if (session.syncedInputs.coreFeature) {
      lines.push(`- **Core Feature:** ${session.syncedInputs.coreFeature}`)
    }
    if (session.syncedInputs.template) {
      lines.push(`- **Template:** ${session.syncedInputs.template}`)
    }
    if (session.syncedInputs.requiredChanges) {
      lines.push(`- **Required Changes:** ${session.syncedInputs.requiredChanges}`)
    }
    if (session.syncedInputs.prototypeScope) {
      lines.push(`- **Prototype Scope:** ${session.syncedInputs.prototypeScope}`)
    }
    if (session.syncedInputs.outOfScope) {
      lines.push(`- **Out of Scope:** ${session.syncedInputs.outOfScope}`)
    }
    if (session.syncedInputs.successCriteria) {
      lines.push(`- **Success Criteria:** ${session.syncedInputs.successCriteria}`)
    }

    lines.push('')
  }

  // Builder Steps
  const builderSteps = session.steps.filter(s => s.role === 'builder')
  if (builderSteps.length > 0) {
    lines.push('## Builder Workflow')
    lines.push('')

    const groupedBuilder = groupStepsByPhase(builderSteps)
    for (const [phase, steps] of Object.entries(groupedBuilder)) {
      lines.push(`### ${PHASE_NAMES[phase] || phase}`)
      lines.push('')

      for (const step of steps) {
        const statusEmoji = getStatusEmoji(step.status)
        let line = `- ${statusEmoji} ${step.title}`

        if (step.acquiredValue) {
          line += `: ${step.acquiredValue}`
        }

        lines.push(line)

        if (step.notes) {
          lines.push(`  - _Notes: ${step.notes}_`)
        }
      }

      lines.push('')
    }
  }

  // Facilitator Steps
  const facilitatorSteps = session.steps.filter(s => s.role === 'facilitator')
  if (facilitatorSteps.length > 0) {
    lines.push('## Facilitator Workflow')
    lines.push('')

    const groupedFacilitator = groupStepsByPhase(facilitatorSteps)
    for (const [phase, steps] of Object.entries(groupedFacilitator)) {
      lines.push(`### ${PHASE_NAMES[phase] || phase}`)
      lines.push('')

      for (const step of steps) {
        const statusEmoji = getStatusEmoji(step.status)
        let line = `- ${statusEmoji} ${step.title}`

        if (step.acquiredValue) {
          line += `: ${step.acquiredValue}`
        }

        lines.push(line)

        if (step.notes) {
          lines.push(`  - _Notes: ${step.notes}_`)
        }
      }

      lines.push('')
    }
  }

  // Footer
  lines.push('---')
  lines.push('')
  lines.push('_Exported from RapidProto_')

  return lines.join('\n')
}

/**
 * Export session as JSON
 */
export function exportSessionAsJson(session: Session): string {
  const duration = calculateDurationMinutes(
    session.startedAt,
    session.completedAt,
    session.totalPausedTime
  )

  const exportData = {
    meta: {
      exportedAt: new Date().toISOString(),
      source: 'RapidProto',
    },
    session: {
      id: session.id,
      title: session.sessionTitle,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() || null,
      durationMinutes: duration,
      totalPausedTimeMs: session.totalPausedTime,
    },
    syncedInputs: session.syncedInputs,
    steps: session.steps.map(step => ({
      id: step.id,
      role: step.role,
      phase: step.phase,
      title: step.title,
      description: step.description,
      status: step.status,
      acquiredValue: step.acquiredValue,
      notes: step.notes,
      estimatedMinutes: step.estimatedMinutes,
      timeSpent: step.timeSpent,
      completedAt: step.completedAt?.toISOString() || null,
    })),
    durations: {
      discovery: session.discoveryDuration,
      build: session.buildDuration,
      demo: session.demoDuration,
    },
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Trigger file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  // Cleanup
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
