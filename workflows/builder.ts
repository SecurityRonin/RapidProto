/**
 * Builder Workflow Functions
 *
 * Orchestrates the 30-minute live build phase:
 * - Template selection based on problem analysis
 * - Project initialization and setup
 * - Progress tracking with time management
 * - Status communication with facilitator
 * - Demo script preparation
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// ============================================================================
// Type Definitions
// ============================================================================

export interface TemplateMatch {
  templateNumber: number
  templateName: string
  category: string
  confidence: number
  reasoning: string
  complexity: number
  estimatedBuildTime: number
  suggestions?: TemplateMatch[]
  needsClarification?: boolean
}

export interface BuildPhase {
  name: string
  startTime: Date
  endTime?: Date
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  notes?: string
}

export interface BuilderSession {
  id: string
  templateNumber: number
  startTime: Date
  phases: BuildPhase[]
  currentPhase?: string
  demoReady?: boolean
  demoUrl?: string
  customizations?: string[]
  clientRequirements?: string[]
  testScenarios?: Array<{
    description: string
    expectedOutcome: string
  }>
  edgeCases?: Array<{
    case: string
    handled: boolean
    approach: string
  }>
  technicalHighlights?: string[]
}

export interface ProjectConfig {
  templateNumber: number
  projectName: string
  clientName?: string
  env?: Record<string, string>
}

export interface InitializationResult {
  success: boolean
  projectPath?: string
  filesCreated?: number
  envConfigured?: boolean
  envVars?: string[]
  error?: string
}

export interface StatusMessage {
  type: 'update' | 'question' | 'ready' | 'blocker'
  text: string
  emoji: string
  timeElapsed?: number
  requiresResponse?: boolean
  urgent?: boolean
  demoUrl?: string
  question?: string
  issue?: string
  needsClientInput?: boolean
}

export interface DemoScript {
  sections: Array<{
    title: string
    duration: number
    steps?: string[]
    callouts?: string[]
    features?: string[]
  }>
  estimatedDuration: number
  technicalNotes?: string
}

export interface ProgressStatus {
  timeElapsed: number
  timeRemaining: number
  onTrack: boolean
  warning?: string
  recommendedAction?: string
  completedPhases?: string[]
  currentPhase?: string
  nextPhase?: string
}

// ============================================================================
// Template Catalog
// ============================================================================

interface TemplateCatalog {
  [key: number]: {
    name: string
    category: string
    keywords: string[]
    complexity: number
    buildTime: number
  }
}

const TEMPLATE_CATALOG: TemplateCatalog = {
  1: {
    name: 'Expense Tracker',
    category: 'financial',
    keywords: ['expense', 'reimbursement', 'spending', 'cost tracking'],
    complexity: 1,
    buildTime: 20,
  },
  2: {
    name: 'Invoice Generator',
    category: 'financial',
    keywords: ['invoice', 'billing', 'payment'],
    complexity: 2,
    buildTime: 25,
  },
  3: {
    name: 'Meeting Scheduler',
    category: 'scheduling',
    keywords: ['meeting', 'calendar', 'availability', 'schedule'],
    complexity: 2,
    buildTime: 25,
  },
  4: {
    name: 'Time Tracker',
    category: 'time',
    keywords: ['time tracking', 'hours', 'billable', 'timesheet'],
    complexity: 2,
    buildTime: 25,
  },
  5: {
    name: 'Resource Booking',
    category: 'scheduling',
    keywords: ['booking', 'reservation', 'equipment', 'room'],
    complexity: 2,
    buildTime: 25,
  },
  6: {
    name: 'Approval Workflow',
    category: 'workflow',
    keywords: ['approval', 'workflow', 'multi-stage', 'notification'],
    complexity: 3,
    buildTime: 30,
  },
  7: {
    name: 'Document Generator',
    category: 'documents',
    keywords: ['document', 'pdf', 'template', 'generation'],
    complexity: 2,
    buildTime: 25,
  },
  8: {
    name: 'Lead Tracking',
    category: 'crm',
    keywords: ['lead', 'sales', 'pipeline', 'crm'],
    complexity: 2,
    buildTime: 25,
  },
  16: {
    name: 'Client Intake',
    category: 'professional-services',
    keywords: ['client', 'intake', 'onboarding', 'conflict check'],
    complexity: 2,
    buildTime: 30,
  },
  26: {
    name: 'Service Appointments',
    category: 'scheduling',
    keywords: ['appointment', 'service', 'booking', 'scheduling'],
    complexity: 2,
    buildTime: 25,
  },
}

// ============================================================================
// Template Selection
// ============================================================================

export function selectTemplate(
  problem: string,
  options?: { returnMultiple?: boolean }
): TemplateMatch | { suggestions: TemplateMatch[]; needsClarification: boolean } {
  const problemLower = problem.toLowerCase()
  const matches: Array<{ template: number; score: number }> = []

  // Score each template based on keyword matches
  for (const [templateNum, template] of Object.entries(TEMPLATE_CATALOG)) {
    let score = 0

    for (const keyword of template.keywords) {
      if (problemLower.includes(keyword.toLowerCase())) {
        score += 1
      }
    }

    // Boost score for exact category matches
    if (problemLower.includes(template.category)) {
      score += 0.5
    }

    if (score > 0) {
      matches.push({ template: parseInt(templateNum), score })
    }
  }

  // Sort by score
  matches.sort((a, b) => b.score - a.score)

  // Check if requesting multiple or problem is too vague
  const topScore = matches[0]?.score || 0
  const isVague = topScore < 1 || problem.split(' ').length < 5

  if (options?.returnMultiple || isVague) {
    // Get best templates from ALL catalog entries if no good matches
    const templatesForSuggestions = matches.length >= 3 ? matches :
      Object.entries(TEMPLATE_CATALOG).slice(0, 3).map(([num]) => ({ template: parseInt(num), score: 0 }))

    const topThree = templatesForSuggestions.slice(0, 3).map(m => {
      const template = TEMPLATE_CATALOG[m.template]
      return {
        templateNumber: m.template,
        templateName: template.name,
        category: template.category,
        confidence: m.score / 5,
        reasoning: `Matches keywords: ${template.keywords.join(', ')}`,
        complexity: template.complexity,
        estimatedBuildTime: template.buildTime,
      }
    })

    return {
      suggestions: topThree,
      needsClarification: isVague,
    }
  }

  // Return best match
  const bestMatch = matches[0]
  const template = TEMPLATE_CATALOG[bestMatch.template]
  const matchedKeywords = template.keywords.filter(k => problemLower.includes(k.toLowerCase()))

  return {
    templateNumber: bestMatch.template,
    templateName: template.name,
    category: template.category,
    confidence: Math.min(bestMatch.score / 3, 1),
    reasoning: matchedKeywords.length > 0
      ? `Strongly matches: ${matchedKeywords.join(' ')}`
      : `Best match for ${template.category}`,
    complexity: template.complexity,
    estimatedBuildTime: template.buildTime,
  }
}

// ============================================================================
// Project Initialization
// ============================================================================

export async function initializeProject(
  config: ProjectConfig
): Promise<InitializationResult> {
  try {
    // Validate template exists
    if (!TEMPLATE_CATALOG[config.templateNumber]) {
      return {
        success: false,
        error: `Template #${config.templateNumber} not found`,
      }
    }

    const template = TEMPLATE_CATALOG[config.templateNumber]
    const templateDir = `template-${config.templateNumber}-${template.name.toLowerCase().replace(/\s+/g, '-')}`
    const projectPath = path.join(process.cwd(), config.projectName)

    // Check if source template exists
    const sourcePath = path.join(process.cwd(), templateDir)
    try {
      await fs.access(sourcePath)
    } catch {
      return {
        success: false,
        error: `Template directory ${templateDir} not found`,
      }
    }

    // Copy template to new project
    await fs.cp(sourcePath, projectPath, { recursive: true })

    let filesCreated = 0
    const countFiles = async (dir: string): Promise<number> => {
      let count = 0
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          count += await countFiles(path.join(dir, entry.name))
        } else {
          count++
        }
      }
      return count
    }
    filesCreated = await countFiles(projectPath)

    // Configure environment
    let envConfigured = false
    const envVars: string[] = []

    if (config.env) {
      const envPath = path.join(projectPath, '.env.local')
      const envContent = Object.entries(config.env)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')

      await fs.writeFile(envPath, envContent)
      envConfigured = true
      envVars.push(...Object.keys(config.env))
    }

    // Update package.json with project name
    const packagePath = path.join(projectPath, 'package.json')
    try {
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'))
      packageJson.name = config.projectName
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2))
    } catch {
      // package.json might not exist in scaffolded templates
    }

    return {
      success: true,
      projectPath,
      filesCreated,
      envConfigured,
      envVars,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Progress Tracking
// ============================================================================

export function trackProgress(
  session: BuilderSession,
  phase?: BuildPhase
): BuilderSession | ProgressStatus {
  // If phase provided, update session
  if (phase) {
    const updatedPhases = [...session.phases]

    // Find and update existing phase or add new one
    const existingIndex = updatedPhases.findIndex(p => p.name === phase.name)
    if (existingIndex >= 0) {
      updatedPhases[existingIndex] = phase
    } else {
      updatedPhases.push(phase)
    }

    return {
      ...session,
      phases: updatedPhases,
      currentPhase: phase.status === 'in-progress' ? phase.name : session.currentPhase,
    }
  }

  // Otherwise, return progress status
  const now = new Date()
  const timeElapsed = Math.floor((now.getTime() - session.startTime.getTime()) / (1000 * 60))
  const timeRemaining = 30 - timeElapsed
  const onTrack = timeElapsed <= 30

  const completedPhases = session.phases
    .filter(p => p.status === 'completed')
    .map(p => p.name)

  const currentPhase = session.phases.find(p => p.status === 'in-progress')?.name

  let warning: string | undefined
  let recommendedAction: string | undefined

  if (timeRemaining < 0) {
    warning = 'Over time limit'
    recommendedAction = 'Simplify scope or demo what works'
  } else if (timeRemaining < 5 && !session.demoReady) {
    warning = 'Running low on time'
    recommendedAction = 'Focus on core demo, skip polish'
  }

  return {
    timeElapsed,
    timeRemaining,
    onTrack,
    warning,
    recommendedAction,
    completedPhases,
    currentPhase,
  }
}

// ============================================================================
// Status Communication
// ============================================================================

export function communicateStatus(
  session: BuilderSession,
  type: 'update' | 'question' | 'ready' | 'blocker',
  context?: {
    question?: string
    issue?: string
    needsClientInput?: boolean
  }
): StatusMessage {
  const status = trackProgress(session) as ProgressStatus

  const baseMessage: StatusMessage = {
    type,
    text: '',
    emoji: '',
    timeElapsed: status.timeElapsed,
  }

  switch (type) {
    case 'update':
      return {
        ...baseMessage,
        emoji: '✅',
        text: `${session.currentPhase || 'In progress'} (${status.timeElapsed} min elapsed, ${status.timeRemaining} min remaining)`,
      }

    case 'question':
      return {
        ...baseMessage,
        emoji: '❓',
        text: `Question: ${context?.question}`,
        question: context?.question,
        requiresResponse: true,
      }

    case 'ready':
      return {
        ...baseMessage,
        emoji: '🚀',
        text: `Demo ready! Built in ${status.timeElapsed} minutes`,
        demoUrl: session.demoUrl || 'https://demo.example.com',
      }

    case 'blocker':
      return {
        ...baseMessage,
        emoji: '⚠️',
        text: `Blocker: ${context?.issue}`,
        issue: context?.issue,
        urgent: true,
        needsClientInput: context?.needsClientInput,
      }

    default:
      return baseMessage
  }
}

// ============================================================================
// Demo Script Preparation
// ============================================================================

export function prepareDemoScript(session: BuilderSession): DemoScript {
  const sections: DemoScript['sections'] = []

  // Section 1: Context Setting
  sections.push({
    title: 'Context Setting',
    duration: 1,
    steps: [
      `Introduce Template #${session.templateNumber}`,
      'Recap the problem we heard',
      'Preview what we built',
    ],
  })

  // Section 2: Happy Path
  const happyPathSteps: string[] = []
  if (session.testScenarios && session.testScenarios.length > 0) {
    happyPathSteps.push(...session.testScenarios.map(s => s.description))
  } else {
    happyPathSteps.push(
      'Demonstrate primary workflow',
      'Show data input/processing',
      'Display results'
    )
  }

  sections.push({
    title: 'Happy Path',
    duration: 3,
    steps: happyPathSteps,
  })

  // Section 3: Edge Cases
  const edgeCaseCallouts = session.edgeCases
    ?.filter(ec => ec.handled)
    .map(ec => ec.case) || []

  sections.push({
    title: 'Edge Cases',
    duration: 2,
    callouts: edgeCaseCallouts,
    steps: edgeCaseCallouts.length > 0
      ? edgeCaseCallouts.map(ec => `Demonstrate: ${ec}`)
      : ['Show how edge cases are handled'],
  })

  // Section 4: Future State
  sections.push({
    title: 'Future State',
    duration: 1,
    steps: [
      'Mention production enhancements',
      'Preview integration possibilities',
      'Set expectations for timeline',
    ],
  })

  const estimatedDuration = sections.reduce((sum, s) => sum + s.duration, 0)

  const technicalNotes = session.technicalHighlights?.join('\n') || undefined

  return {
    sections,
    estimatedDuration,
    technicalNotes,
  }
}
